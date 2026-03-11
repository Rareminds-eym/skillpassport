/**
 * Assessment Session Lock Service
 * 
 * Implements multi-tab session locking for assessments using Supabase Realtime and database.
 * Prevents users from taking the same assessment in multiple browser tabs simultaneously.
 * 
 * Features:
 * - Real-time session coordination across tabs
 * - Database-backed session persistence
 * - Automatic lock release on tab close/crash
 * - Heartbeat mechanism for active session detection
 * - Graceful fallback for unsupported browsers
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// =============================================================================
// TYPES
// =============================================================================

export interface SessionLockState {
  isLocked: boolean;
  isActiveTab: boolean;
  lockHolderId: string | null;
  lockHolderName: string | null;
  sessionId: string | null;
  error: string | null;
}

export interface SessionLockOptions {
  assessmentId: string;
  studentId: string;
  studentName?: string;
  onLockStateChange?: (state: SessionLockState) => void;
  onLockAcquired?: () => void;
  onLockLost?: () => void;
  onLockBlocked?: (holderName: string) => void;
}

interface LockMessage {
  type: 'acquire' | 'release' | 'heartbeat' | 'force_release';
  tabId: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  timestamp: number;
  assessmentId: string;
}

interface AssessmentSession {
  id: string;
  assessment_id: string;
  student_id: string;
  tab_id: string;
  student_name: string;
  status: 'active' | 'completed' | 'abandoned';
  heartbeat_at: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ASSESSMENT SESSION LOCK SERVICE
// =============================================================================

export class AssessmentSessionLock {
  private options: SessionLockOptions;
  private tabId: string;
  private channel: RealtimeChannel | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lockState: SessionLockState;
  private isDestroyed = false;
  private currentSessionId: string | null = null;

  // Constants
  private static readonly HEARTBEAT_INTERVAL = 10000; // 10 seconds
  private static readonly LOCK_TIMEOUT = 30000; // 30 seconds
  private static readonly CHANNEL_PREFIX = 'assessment-lock';

  constructor(options: SessionLockOptions) {
    this.options = options;
    this.tabId = this.generateTabId();
    this.lockState = {
      isLocked: false,
      isActiveTab: false,
      lockHolderId: null,
      lockHolderName: null,
      sessionId: null,
      error: null,
    };

    // Bind methods to preserve context
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.handleUnload = this.handleUnload.bind(this);
  }

  /**
   * Initialize the session lock
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('[SessionLock] Initializing for assessment:', this.options.assessmentId);

      // Set up realtime channel first
      await this.setupRealtimeChannel();

      // Try to acquire session via API
      const acquired = await this.acquireSessionViaAPI();
      
      if (acquired) {
        this.startHeartbeat();
        this.setupCleanupHandlers();
        return true;
      }

      return false;
    } catch (error) {
      console.error('[SessionLock] Initialization failed:', error);
      this.updateLockState({ error: 'Failed to initialize session lock' });
      return false;
    }
  }

  /**
   * Acquire session via API
   */
  private async acquireSessionViaAPI(): Promise<boolean> {
    try {
      console.log('[SessionLock] Attempting to acquire session via API');
      console.log('[SessionLock] Request data:', {
        assessmentId: this.options.assessmentId,
        studentId: this.options.studentId,
        tabId: this.tabId,
        studentName: this.options.studentName,
      });
      
      // Get auth session
      const authSession = await supabase.auth.getSession();
      console.log('[SessionLock] Auth session:', {
        hasSession: !!authSession.data.session,
        hasAccessToken: !!authSession.data.session?.access_token,
        userId: authSession.data.session?.user?.id,
      });
      
      const response = await fetch('/api/assessment-session/acquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.data.session?.access_token}`,
        },
        body: JSON.stringify({
          assessmentId: this.options.assessmentId,
          studentId: this.options.studentId,
          tabId: this.tabId,
          studentName: this.options.studentName,
        }),
      });

      console.log('[SessionLock] API response status:', response.status);
      console.log('[SessionLock] API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('[SessionLock] API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[SessionLock] API error response:', errorText);
        return false;
      }

      const result = await response.json();
      console.log('[SessionLock] API response:', result);

      if (result.success && result.acquired) {
        this.currentSessionId = result.session.id;
        
        this.updateLockState({
          isLocked: true,
          isActiveTab: true,
          lockHolderId: this.tabId,
          lockHolderName: this.options.studentName || 'Current Tab',
          sessionId: result.session.id,
          error: null,
        });

        // Broadcast acquisition
        await this.broadcastMessage({
          type: 'acquire',
          tabId: this.tabId,
          sessionId: result.session.id,
          studentId: this.options.studentId,
          studentName: this.options.studentName || 'Student',
          timestamp: Date.now(),
          assessmentId: this.options.assessmentId,
        });

        return true;
      } else if (result.lockHolder) {
        // Session is locked by another tab
        this.updateLockState({
          isLocked: true,
          isActiveTab: false,
          lockHolderId: result.lockHolder.tabId,
          lockHolderName: result.lockHolder.studentName,
          sessionId: null,
          error: null,
        });

        this.options.onLockBlocked?.(result.lockHolder.studentName);
        return false;
      }

      return false;
    } catch (error) {
      console.error('[SessionLock] API acquisition failed:', error);
      throw error;
    }
  }

  /**
   * Set up Supabase Realtime channel for coordination
   */
  private async setupRealtimeChannel(): Promise<void> {
    const channelName = `${AssessmentSessionLock.CHANNEL_PREFIX}:${this.options.assessmentId}:${this.options.studentId}`;
    
    this.channel = supabase.channel(channelName);

    // Listen for broadcast messages
    this.channel.on('broadcast', { event: 'lock-message' }, (payload) => {
      this.handleLockMessage(payload.payload as LockMessage);
    });

    // Listen for database changes on assessment_sessions table
    this.channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assessment_sessions',
        filter: `assessment_id=eq.${this.options.assessmentId}`,
      },
      (payload) => {
        this.handleDatabaseChange(payload);
      }
    );

    // Subscribe to the channel
    await new Promise<void>((resolve, reject) => {
      this.channel!.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[SessionLock] Realtime channel subscribed:', channelName);
          resolve();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SessionLock] Realtime channel error');
          reject(new Error('Failed to subscribe to realtime channel'));
        }
      });
    });
  }

  /**
   * Handle database changes
   */
  private handleDatabaseChange(payload: any): void {
    console.log('[SessionLock] Database change:', payload.eventType, payload.new, payload.old);

    if (payload.eventType === 'DELETE' && payload.old?.tab_id === this.tabId) {
      // Our session was deleted
      this.updateLockState({
        isLocked: false,
        isActiveTab: false,
        lockHolderId: null,
        lockHolderName: null,
        sessionId: null,
        error: null,
      });
    } else if (payload.eventType === 'INSERT' && payload.new?.student_id === this.options.studentId) {
      // New session created for this student
      if (payload.new.tab_id !== this.tabId) {
        this.updateLockState({
          isLocked: true,
          isActiveTab: false,
          lockHolderId: payload.new.tab_id,
          lockHolderName: payload.new.student_name,
          sessionId: null,
          error: null,
        });
      }
    }
  }

  /**
   * Handle incoming lock messages
   */
  private handleLockMessage(message: LockMessage): void {
    // Ignore messages from this tab
    if (message.tabId === this.tabId) {
      return;
    }

    console.log('[SessionLock] Received message:', message.type, 'from:', message.tabId);

    switch (message.type) {
      case 'acquire':
        this.handleLockAcquireMessage(message);
        break;
      case 'release':
        this.handleLockReleaseMessage(message);
        break;
      case 'heartbeat':
        this.handleHeartbeatMessage(message);
        break;
      case 'force_release':
        this.handleForceReleaseMessage(message);
        break;
    }
  }

  /**
   * Handle lock acquisition message from another tab
   */
  private handleLockAcquireMessage(message: LockMessage): void {
    if (this.lockState.isActiveTab) {
      // We already have the lock, send heartbeat to assert dominance
      this.sendHeartbeat();
    } else {
      // Another tab is trying to acquire the lock
      this.updateLockState({
        isLocked: true,
        isActiveTab: false,
        lockHolderId: message.tabId,
        lockHolderName: message.studentName,
        sessionId: null,
        error: null,
      });

      this.options.onLockBlocked?.(message.studentName);
    }
  }

  /**
   * Handle lock release message
   */
  private handleLockReleaseMessage(message: LockMessage): void {
    if (message.tabId === this.lockState.lockHolderId) {
      console.log('[SessionLock] Lock released by holder:', message.tabId);
      
      this.updateLockState({
        isLocked: false,
        isActiveTab: false,
        lockHolderId: null,
        lockHolderName: null,
        sessionId: null,
        error: null,
      });
    }
  }

  /**
   * Handle heartbeat message
   */
  private handleHeartbeatMessage(message: LockMessage): void {
    if (message.tabId === this.lockState.lockHolderId) {
      // Update the last seen time for the lock holder
      console.log('[SessionLock] Heartbeat from lock holder:', message.tabId);
    }
  }

  /**
   * Handle force release message
   */
  private handleForceReleaseMessage(message: LockMessage): void {
    if (this.lockState.isActiveTab) {
      console.log('[SessionLock] Forced to release lock by:', message.tabId);
      this.releaseLock();
    }
  }

  /**
   * Broadcast a message to all tabs
   */
  private async broadcastMessage(message: LockMessage): Promise<void> {
    if (!this.channel) {
      return;
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'lock-message',
        payload: message,
      });
    } catch (error) {
      console.error('[SessionLock] Failed to broadcast message:', error);
    }
  }

  /**
   * Start heartbeat to maintain lock
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, AssessmentSessionLock.HEARTBEAT_INTERVAL);
  }

  /**
   * Send heartbeat message
   */
  private async sendHeartbeat(): Promise<void> {
    if (!this.lockState.isActiveTab || !this.currentSessionId) {
      return;
    }

    try {
      // Send heartbeat to API
      const response = await fetch('/api/assessment-session/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          sessionId: this.currentSessionId,
          tabId: this.tabId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.warn('[SessionLock] Heartbeat failed:', result.error);
        // Session might have been taken over
        this.updateLockState({
          isLocked: false,
          isActiveTab: false,
          lockHolderId: null,
          lockHolderName: null,
          sessionId: null,
          error: 'Session lost',
        });
      }

      // Also broadcast heartbeat
      await this.broadcastMessage({
        type: 'heartbeat',
        tabId: this.tabId,
        sessionId: this.currentSessionId,
        studentId: this.options.studentId,
        studentName: this.options.studentName || 'Student',
        timestamp: Date.now(),
        assessmentId: this.options.assessmentId,
      });
    } catch (error) {
      console.error('[SessionLock] Heartbeat error:', error);
    }
  }

  /**
   * Set up cleanup handlers for tab close/refresh
   */
  private setupCleanupHandlers(): void {
    // Handle tab visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Handle tab close/refresh
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    window.addEventListener('unload', this.handleUnload);
    
    // Handle page navigation
    window.addEventListener('pagehide', this.handleUnload);
  }

  /**
   * Handle visibility change (tab switch)
   */
  private handleVisibilityChange(): void {
    if (document.hidden && this.lockState.isActiveTab) {
      // Tab became hidden, send heartbeat to maintain lock
      this.sendHeartbeat();
    }
  }

  /**
   * Handle before unload (tab close warning)
   */
  private handleBeforeUnload(): void {
    if (this.lockState.isActiveTab) {
      this.releaseLock();
    }
  }

  /**
   * Handle unload (tab close)
   */
  private handleUnload(): void {
    if (this.lockState.isActiveTab) {
      this.releaseLock();
    }
  }

  /**
   * Release the lock
   */
  releaseLock(): void {
    if (!this.lockState.isActiveTab || !this.currentSessionId) {
      return;
    }

    console.log('[SessionLock] Releasing lock');

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Release via API (fire and forget)
    fetch('/api/assessment-session/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(supabase.auth.getSession() as any).data?.session?.access_token}`,
      },
      body: JSON.stringify({
        sessionId: this.currentSessionId,
        tabId: this.tabId,
        status: 'completed',
      }),
    }).catch(error => {
      console.error('[SessionLock] Failed to release session via API:', error);
    });

    // Broadcast release message
    this.broadcastMessage({
      type: 'release',
      tabId: this.tabId,
      sessionId: this.currentSessionId,
      studentId: this.options.studentId,
      studentName: this.options.studentName || 'Student',
      timestamp: Date.now(),
      assessmentId: this.options.assessmentId,
    });

    // Update state
    this.updateLockState({
      isLocked: false,
      isActiveTab: false,
      lockHolderId: null,
      lockHolderName: null,
      sessionId: null,
      error: null,
    });

    this.currentSessionId = null;
    this.options.onLockLost?.();
  }

  /**
   * Force release lock (admin function)
   */
  forceRelease(): void {
    console.log('[SessionLock] Force releasing lock');
    
    this.broadcastMessage({
      type: 'force_release',
      tabId: this.tabId,
      sessionId: this.currentSessionId || '',
      studentId: this.options.studentId,
      studentName: this.options.studentName || 'Admin',
      timestamp: Date.now(),
      assessmentId: this.options.assessmentId,
    });
  }

  /**
   * Destroy the session lock
   */
  destroy(): void {
    console.log('[SessionLock] Destroying session lock');
    
    this.isDestroyed = true;
    
    // Release lock if we have it
    if (this.lockState.isActiveTab) {
      this.releaseLock();
    }

    // Clean up heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Clean up event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('unload', this.handleUnload);
    window.removeEventListener('pagehide', this.handleUnload);

    // Clean up realtime channel
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  /**
   * Get current lock state
   */
  getLockState(): SessionLockState {
    return { ...this.lockState };
  }

  /**
   * Update lock state and notify listeners
   */
  private updateLockState(updates: Partial<SessionLockState>): void {
    const previousState = { ...this.lockState };
    this.lockState = { ...this.lockState, ...updates };

    console.log('[SessionLock] State updated:', this.lockState);

    // Notify listeners
    this.options.onLockStateChange?.(this.lockState);

    // Trigger specific callbacks
    if (!previousState.isActiveTab && this.lockState.isActiveTab) {
      this.options.onLockAcquired?.();
    } else if (previousState.isActiveTab && !this.lockState.isActiveTab) {
      this.options.onLockLost?.();
    }
  }

  /**
   * Generate unique tab ID
   */
  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// =============================================================================
// HOOK FOR REACT COMPONENTS
// =============================================================================

import { useState, useEffect, useRef } from 'react';

export interface UseAssessmentSessionLockOptions extends Omit<SessionLockOptions, 'onLockStateChange'> {
  enabled?: boolean;
}

export interface UseAssessmentSessionLockReturn extends SessionLockState {
  acquireLock: () => Promise<boolean>;
  releaseLock: () => void;
  forceRelease: () => void;
}

/**
 * React hook for assessment session locking
 */
export function useAssessmentSessionLock(
  options: UseAssessmentSessionLockOptions
): UseAssessmentSessionLockReturn {
  const [lockState, setLockState] = useState<SessionLockState>({
    isLocked: false,
    isActiveTab: false,
    lockHolderId: null,
    lockHolderName: null,
    sessionId: null,
    error: null,
  });

  const lockRef = useRef<AssessmentSessionLock | null>(null);

  // Initialize lock when enabled
  useEffect(() => {
    if (!options.enabled || !options.assessmentId || !options.studentId) {
      return;
    }

    const lock = new AssessmentSessionLock({
      ...options,
      onLockStateChange: setLockState,
    });

    lockRef.current = lock;

    // Auto-acquire lock on initialization
    lock.initialize();

    return () => {
      lock.destroy();
      lockRef.current = null;
    };
  }, [options.enabled, options.assessmentId, options.studentId]);

  const acquireLock = async (): Promise<boolean> => {
    if (!lockRef.current) {
      return false;
    }
    return await lockRef.current.initialize();
  };

  const releaseLock = (): void => {
    lockRef.current?.releaseLock();
  };

  const forceRelease = (): void => {
    lockRef.current?.forceRelease();
  };

  return {
    ...lockState,
    acquireLock,
    releaseLock,
    forceRelease,
  };
}