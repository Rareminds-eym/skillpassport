/**
 * Time Utility Functions
 * Centralized time formatting and calculation utilities
 */

/**
 * Format seconds to MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format seconds to HH:MM:SS format (with hours if needed)
 */
export const formatElapsedTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get timer color class based on remaining time
 */
export const getTimerColorClass = (
  timeRemaining: number,
  warningThreshold: number = 60,
  criticalThreshold: number = 10
): string => {
  if (timeRemaining <= criticalThreshold) {
    return 'text-red-600 animate-pulse';
  }
  if (timeRemaining <= warningThreshold) {
    return 'text-amber-600';
  }
  return 'text-indigo-600';
};

/**
 * Get timer background class based on remaining time
 */
export const getTimerBgClass = (
  timeRemaining: number,
  warningThreshold: number = 30,
  criticalThreshold: number = 10
): string => {
  if (timeRemaining <= criticalThreshold) {
    return 'bg-red-100 text-red-700 animate-pulse';
  }
  if (timeRemaining <= warningThreshold) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-indigo-100 text-indigo-700';
};

/**
 * Calculate time spent on a section
 */
export const calculateTimeSpent = (
  isTimed: boolean,
  timeLimit: number | null,
  timeRemaining: number | null,
  elapsedTime: number
): number => {
  if (isTimed && timeLimit !== null && timeRemaining !== null) {
    return timeLimit - timeRemaining;
  }
  return elapsedTime;
};

/**
 * Check if timer is in warning state
 */
export const isTimerWarning = (timeRemaining: number, threshold: number = 60): boolean => {
  return timeRemaining > 0 && timeRemaining <= threshold;
};

/**
 * Check if timer is in critical state
 */
export const isTimerCritical = (timeRemaining: number, threshold: number = 10): boolean => {
  return timeRemaining > 0 && timeRemaining <= threshold;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
