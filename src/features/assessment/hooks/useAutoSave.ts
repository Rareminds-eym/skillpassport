/**
 * Auto-Save Hook
 * 
 * Provides automatic saving of assessment progress with debouncing.
 * Handles save on change, periodic saves, and save before unload.
 * 
 * @module features/assessment/hooks/useAutoSave
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AutoSaveData {
  answers: Record<string, unknown>;
  currentQuestionIndex: number;
  currentSectionIndex?: number;
  timeRemaining?: number;
  elapsedTime?: number;
  [key: string]: unknown;
}

export interface UseAutoSaveOptions {
  /** Data to save */
  data: AutoSaveData;
  /** Save function that persists data */
  onSave: (data: AutoSaveData) => Promise<void>;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Periodic save interval in milliseconds (0 to disable) */
  periodicSaveMs?: number;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /** Callback on successful save */
  onSaveSuccess?: () => void;
  /** Callback on save error */
  onSaveError?: (error: Error) => void;
  /** Whether to save before page unload */
  saveOnUnload?: boolean;
}

export interface UseAutoSaveReturn {
  /** Whether a save is in progress */
  isSaving: boolean;
  /** Last save timestamp */
  lastSaved: Date | null;
  /** Last save error */
  lastError: Error | null;
  /** Manually trigger a save */
  saveNow: () => Promise<void>;
  /** Reset the auto-save state */
  reset: () => void;
}

export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    data,
    onSave,
    debounceMs = 2000,
    periodicSaveMs = 30000,
    enabled = true,
    onSaveSuccess,
    onSaveError,
    saveOnUnload = true,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const periodicTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef(data);
  const isSavingRef = useRef(false);

  // Keep data ref updated
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Core save function
  const performSave = useCallback(async () => {
    if (isSavingRef.current || !enabled) return;

    isSavingRef.current = true;
    setIsSaving(true);
    setLastError(null);

    try {
      await onSave(dataRef.current);
      setLastSaved(new Date());
      onSaveSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Save failed');
      setLastError(err);
      onSaveError?.(err);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [enabled, onSave, onSaveSuccess, onSaveError]);

  // Debounced save on data change
  useEffect(() => {
    if (!enabled) return;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, enabled, debounceMs, performSave]);

  // Periodic save
  useEffect(() => {
    if (!enabled || periodicSaveMs <= 0) return;

    periodicTimerRef.current = setInterval(() => {
      performSave();
    }, periodicSaveMs);

    return () => {
      if (periodicTimerRef.current) {
        clearInterval(periodicTimerRef.current);
      }
    };
  }, [enabled, periodicSaveMs, performSave]);

  // Save on page unload
  useEffect(() => {
    if (!enabled || !saveOnUnload) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Attempt synchronous save (best effort)
      if (dataRef.current) {
        // Use sendBeacon for reliable delivery
        const saveData = JSON.stringify(dataRef.current);
        // Note: This requires a beacon endpoint on the server
        // navigator.sendBeacon('/api/assessment/save', saveData);
        
        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = 'Your progress has been saved. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, saveOnUnload]);

  // Manual save function
  const saveNow = useCallback(async () => {
    // Clear debounce timer to avoid double save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await performSave();
  }, [performSave]);

  // Reset function
  const reset = useCallback(() => {
    setLastSaved(null);
    setLastError(null);
    setIsSaving(false);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (periodicTimerRef.current) {
      clearInterval(periodicTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (periodicTimerRef.current) {
        clearInterval(periodicTimerRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    lastError,
    saveNow,
    reset,
  };
}

export default useAutoSave;
