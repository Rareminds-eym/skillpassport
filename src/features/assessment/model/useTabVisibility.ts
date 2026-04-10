/**
 * Tab Visibility Hook
 * 
 * Detects when user switches tabs or minimizes the browser.
 * Useful for proctoring and warning users during assessments.
 * 
 * @module features/assessment/hooks/useTabVisibility
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTabVisibilityOptions {
  /** Whether monitoring is enabled */
  enabled?: boolean;
  /** Maximum allowed tab switches before action */
  maxWarnings?: number;
  /** Callback when tab becomes hidden */
  onHidden?: () => void;
  /** Callback when tab becomes visible */
  onVisible?: () => void;
  /** Callback when warning threshold is reached */
  onWarning?: (warningCount: number) => void;
  /** Callback when max warnings exceeded */
  onMaxWarningsExceeded?: (totalSwitches: number) => void;
}

export interface UseTabVisibilityReturn {
  /** Whether the tab is currently visible */
  isVisible: boolean;
  /** Number of times user switched away */
  switchCount: number;
  /** Number of warnings issued */
  warningCount: number;
  /** Whether max warnings have been exceeded */
  maxWarningsExceeded: boolean;
  /** Reset the switch/warning counters */
  reset: () => void;
  /** Manually acknowledge a warning */
  acknowledgeWarning: () => void;
}

export function useTabVisibility(options: UseTabVisibilityOptions = {}): UseTabVisibilityReturn {
  const {
    enabled = true,
    maxWarnings = 3,
    onHidden,
    onVisible,
    onWarning,
    onMaxWarningsExceeded,
  } = options;

  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [switchCount, setSwitchCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [maxWarningsExceeded, setMaxWarningsExceeded] = useState(false);

  const wasVisibleRef = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);

      if (!visible && wasVisibleRef.current) {
        // Tab became hidden
        setSwitchCount(prev => prev + 1);
        
        setWarningCount(prev => {
          const newCount = prev + 1;
          
          if (newCount > maxWarnings) {
            setMaxWarningsExceeded(true);
            onMaxWarningsExceeded?.(switchCount + 1);
          } else {
            onWarning?.(newCount);
          }
          
          return newCount;
        });
        
        onHidden?.();
      } else if (visible && !wasVisibleRef.current) {
        // Tab became visible
        onVisible?.();
      }

      wasVisibleRef.current = visible;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, maxWarnings, switchCount, onHidden, onVisible, onWarning, onMaxWarningsExceeded]);

  const reset = useCallback(() => {
    setSwitchCount(0);
    setWarningCount(0);
    setMaxWarningsExceeded(false);
  }, []);

  const acknowledgeWarning = useCallback(() => {
    // This can be used to track that user acknowledged the warning
    // Could be extended to log this event
  }, []);

  return {
    isVisible,
    switchCount,
    warningCount,
    maxWarningsExceeded,
    reset,
    acknowledgeWarning,
  };
}

export default useTabVisibility;
