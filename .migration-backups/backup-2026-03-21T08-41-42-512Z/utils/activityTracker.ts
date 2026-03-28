/**
 * Activity Tracker
 * 
 * Tracks user activity to optimize token refresh timing.
 * Monitors UI interactions, message sends, and tab visibility to determine session activity.
 */

export type ActivityType =
  | 'message_sent'
  | 'ui_interaction'
  | 'tab_visible'
  | 'tab_hidden';

export interface ActivityTrackerConfig {
  /** Idle timeout in milliseconds. Default: 30 minutes */
  idleTimeoutMs?: number;
  /** Whether to track UI interactions (clicks, scrolls, typing). Default: true */
  trackUIInteractions?: boolean;
}

type ActivityCallback = (type: ActivityType) => void;

const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * ActivityTracker class for monitoring user activity
 */
export class ActivityTracker {
  private config: Required<ActivityTrackerConfig>;
  private lastActivityTime: number = Date.now();
  private isTabVisible: boolean = true;
  private activityCount: number = 0;
  private callbacks: Set<ActivityCallback> = new Set();
  private eventListeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];
  private isTracking: boolean = false;

  constructor(config: ActivityTrackerConfig = {}) {
    this.config = {
      idleTimeoutMs: config.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS,
      trackUIInteractions: config.trackUIInteractions ?? true,
    };
  }

  /**
   * Record user activity
   * @param activityType - Type of activity that occurred
   */
  recordActivity(activityType: ActivityType): void {
    // Don't record activity when tab is hidden (except for tab visibility changes)
    if (!this.isTabVisible && activityType !== 'tab_visible' && activityType !== 'tab_hidden') {
      return;
    }

    // Update last activity time
    this.lastActivityTime = Date.now();
    this.activityCount++;

    console.log(`[ActivityTracker] Activity recorded: ${activityType}`);

    // Emit activity event to callbacks
    this.emitActivity(activityType);
  }

  /**
   * Get last activity timestamp
   * @returns Unix timestamp in milliseconds
   */
  getLastActivityTime(): number {
    return this.lastActivityTime;
  }

  /**
   * Check if session is active (activity within idle timeout)
   * @returns true if session is active, false otherwise
   */
  isSessionActive(): boolean {
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    return timeSinceActivity < this.config.idleTimeoutMs;
  }

  /**
   * Get time since last activity in milliseconds
   */
  getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivityTime;
  }

  /**
   * Check if browser tab is currently visible
   */
  isTabCurrentlyVisible(): boolean {
    return this.isTabVisible;
  }

  /**
   * Get total activity count (for analytics)
   */
  getActivityCount(): number {
    return this.activityCount;
  }

  /**
   * Register a callback for activity events
   * @param callback - Function to call when activity occurs
   * @returns Unsubscribe function
   */
  onActivity(callback: ActivityCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Emit activity event to all registered callbacks
   */
  private emitActivity(type: ActivityType): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(type);
      } catch (error) {
        console.error('[ActivityTracker] Error in activity callback:', error);
      }
    });
  }

  /**
   * Start tracking user activity
   */
  startTracking(): void {
    if (this.isTracking) {
      console.warn('[ActivityTracker] Already tracking');
      return;
    }

    console.log('[ActivityTracker] Starting activity tracking');
    this.isTracking = true;

    // Set up Page Visibility API listener
    this.setupVisibilityTracking();

    // Set up UI interaction listeners if enabled
    if (this.config.trackUIInteractions) {
      this.setupUIInteractionTracking();
    }
  }

  /**
   * Stop tracking user activity
   */
  stopTracking(): void {
    if (!this.isTracking) {
      return;
    }

    console.log('[ActivityTracker] Stopping activity tracking');
    this.isTracking = false;

    // Remove all event listeners
    this.removeAllEventListeners();
  }

  /**
   * Set up Page Visibility API tracking
   */
  private setupVisibilityTracking(): void {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      
      if (isVisible !== this.isTabVisible) {
        this.isTabVisible = isVisible;
        
        if (isVisible) {
          console.log('[ActivityTracker] Tab became visible');
          this.recordActivity('tab_visible');
        } else {
          console.log('[ActivityTracker] Tab became hidden');
          this.recordActivity('tab_hidden');
        }
      }
    };

    this.addEventListener(document, 'visibilitychange', handleVisibilityChange);

    // Initialize visibility state
    this.isTabVisible = !document.hidden;
  }

  /**
   * Set up UI interaction tracking (clicks, scrolls, typing)
   */
  private setupUIInteractionTracking(): void {
    // Track clicks
    const handleClick = () => {
      this.recordActivity('ui_interaction');
    };

    // Track scrolls (throttled)
    let scrollTimeout: number | null = null;
    const handleScroll = () => {
      if (scrollTimeout === null) {
        scrollTimeout = window.setTimeout(() => {
          this.recordActivity('ui_interaction');
          scrollTimeout = null;
        }, 1000); // Throttle to once per second
      }
    };

    // Track keyboard input (throttled)
    let keyTimeout: number | null = null;
    const handleKeydown = () => {
      if (keyTimeout === null) {
        keyTimeout = window.setTimeout(() => {
          this.recordActivity('ui_interaction');
          keyTimeout = null;
        }, 1000); // Throttle to once per second
      }
    };

    // Track mouse movement (throttled)
    let mouseTimeout: number | null = null;
    const handleMouseMove = () => {
      if (mouseTimeout === null) {
        mouseTimeout = window.setTimeout(() => {
          this.recordActivity('ui_interaction');
          mouseTimeout = null;
        }, 5000); // Throttle to once per 5 seconds
      }
    };

    // Add event listeners
    this.addEventListener(document, 'click', handleClick);
    this.addEventListener(document, 'scroll', handleScroll, true); // Use capture for scroll
    this.addEventListener(document, 'keydown', handleKeydown);
    this.addEventListener(document, 'mousemove', handleMouseMove);
  }

  /**
   * Add an event listener and track it for cleanup
   */
  private addEventListener(
    element: EventTarget,
    type: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(type, handler, options);
    this.eventListeners.push({ element, type, handler });
  }

  /**
   * Remove all tracked event listeners
   */
  private removeAllEventListeners(): void {
    this.eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.eventListeners = [];
  }

  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<ActivityTrackerConfig>): void {
    const wasTracking = this.isTracking;
    
    // Stop tracking if active
    if (wasTracking) {
      this.stopTracking();
    }

    // Update config
    this.config = {
      ...this.config,
      ...config,
    };

    // Restart tracking if it was active
    if (wasTracking) {
      this.startTracking();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<ActivityTrackerConfig> {
    return { ...this.config };
  }

  /**
   * Reset activity state (useful for testing)
   */
  reset(): void {
    this.lastActivityTime = Date.now();
    this.activityCount = 0;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopTracking();
    this.callbacks.clear();
    this.activityCount = 0;
  }
}

/**
 * Create a singleton instance for global use
 */
let globalActivityTracker: ActivityTracker | null = null;

export function getGlobalActivityTracker(config?: ActivityTrackerConfig): ActivityTracker {
  if (!globalActivityTracker) {
    globalActivityTracker = new ActivityTracker(config);
  }
  return globalActivityTracker;
}

/**
 * Reset the global activity tracker (useful for testing)
 */
export function resetGlobalActivityTracker(): void {
  if (globalActivityTracker) {
    globalActivityTracker.destroy();
    globalActivityTracker = null;
  }
}
