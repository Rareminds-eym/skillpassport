/**
 * Assessment Timer Hook
 *
 * Provides countdown and elapsed time tracking for assessments.
 * Supports both timed sections (countdown) and untimed sections (elapsed time).
 *
 * @module features/assessment/hooks/useAssessmentTimer
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseAssessmentTimerOptions {
  /** Initial time in seconds (for countdown mode) */
  initialTime?: number;
  /** Whether to auto-start the timer */
  autoStart?: boolean;
  /** Callback when timer reaches zero */
  onTimeUp?: () => void;
  /** Callback on each tick (every second) */
  onTick?: (timeRemaining: number, elapsedTime: number) => void;
  /** Warning thresholds in seconds (triggers onWarning) */
  warningThresholds?: number[];
  /** Callback when a warning threshold is reached */
  onWarning?: (threshold: number) => void;
}

export interface UseAssessmentTimerReturn {
  /** Time remaining in seconds (countdown mode) */
  timeRemaining: number;
  /** Time elapsed in seconds */
  elapsedTime: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Whether time has run out */
  isTimeUp: boolean;
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Resume the timer */
  resume: () => void;
  /** Reset the timer to initial state */
  reset: (newInitialTime?: number) => void;
  /** Set time remaining directly */
  setTimeRemaining: (time: number) => void;
  /** Format time as MM:SS or HH:MM:SS */
  formatTime: (seconds?: number) => string;
  /** Get percentage of time remaining */
  getTimePercentage: () => number;
}

export function useAssessmentTimer(
  options: UseAssessmentTimerOptions = {}
): UseAssessmentTimerReturn {
  const {
    initialTime = 0,
    autoStart = false,
    onTimeUp,
    onTick,
    warningThresholds = [],
    onWarning,
  } = options;

  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const triggeredWarningsRef = useRef<Set<number>>(new Set());
  const initialTimeRef = useRef(initialTime);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer tick effect
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);

      if (initialTimeRef.current > 0) {
        // Countdown mode
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - 1);

          // Check warning thresholds
          warningThresholds.forEach((threshold) => {
            if (newTime === threshold && !triggeredWarningsRef.current.has(threshold)) {
              triggeredWarningsRef.current.add(threshold);
              onWarning?.(threshold);
            }
          });

          // Call onTick
          onTick?.(newTime, elapsedTime + 1);

          // Check if time is up
          if (newTime === 0) {
            setIsTimeUp(true);
            setIsRunning(false);
            onTimeUp?.();
          }

          return newTime;
        });
      } else {
        // Elapsed time mode (no countdown)
        onTick?.(0, elapsedTime + 1);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUp, onTick, onWarning, warningThresholds, elapsedTime]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsTimeUp(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (!isTimeUp) {
      setIsRunning(true);
    }
  }, [isTimeUp]);

  const reset = useCallback((newInitialTime?: number) => {
    const time = newInitialTime ?? initialTimeRef.current;
    initialTimeRef.current = time;
    setTimeRemaining(time);
    setElapsedTime(0);
    setIsTimeUp(false);
    setIsRunning(false);
    triggeredWarningsRef.current.clear();
  }, []);

  const setTimeRemainingDirect = useCallback((time: number) => {
    setTimeRemaining(Math.max(0, time));
    if (time <= 0) {
      setIsTimeUp(true);
      setIsRunning(false);
    }
  }, []);

  const formatTime = useCallback(
    (seconds?: number): string => {
      const time = seconds ?? timeRemaining;
      const hrs = Math.floor(time / 3600);
      const mins = Math.floor((time % 3600) / 60);
      const secs = time % 60;

      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    [timeRemaining]
  );

  const getTimePercentage = useCallback((): number => {
    if (initialTimeRef.current === 0) return 100;
    return (timeRemaining / initialTimeRef.current) * 100;
  }, [timeRemaining]);

  return {
    timeRemaining,
    elapsedTime,
    isRunning,
    isTimeUp,
    start,
    pause,
    resume,
    reset,
    setTimeRemaining: setTimeRemainingDirect,
    formatTime,
    getTimePercentage,
  };
}

export default useAssessmentTimer;
