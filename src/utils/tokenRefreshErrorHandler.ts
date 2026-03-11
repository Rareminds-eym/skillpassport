/**
 * Token Refresh Error Handler
 * 
 * Provides user-friendly error messages and recovery actions for token refresh failures.
 * Integrates with the Refresh Coordinator to handle different error types appropriately.
 */

import type { RefreshError } from './refreshCoordinator';
import { getLogger } from '../config/logging';

const logger = getLogger('token-refresh-error');

export interface ErrorNotification {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface RefreshFailureLog {
  timestamp: number;
  error: RefreshError;
  attempt: number;
  retryable: boolean;
  details?: string;
}

/**
 * TokenRefreshErrorHandler class for managing error notifications and logging
 */
export class TokenRefreshErrorHandler {
  private failureLogs: RefreshFailureLog[] = [];
  private maxLogEntries: number = 100;
  private notificationCallbacks: Set<(notification: ErrorNotification) => void> = new Set();

  /**
   * Log a refresh failure with timestamp and details
   */
  logFailure(
    error: RefreshError,
    attempt: number,
    retryable: boolean,
    details?: string
  ): void {
    const log: RefreshFailureLog = {
      timestamp: Date.now(),
      error,
      attempt,
      retryable,
      details,
    };

    this.failureLogs.push(log);

    // Keep only the most recent entries
    if (this.failureLogs.length > this.maxLogEntries) {
      this.failureLogs = this.failureLogs.slice(-this.maxLogEntries);
    }

    // Log for debugging
    const timestamp = new Date(log.timestamp).toISOString();
    logger.error(
      `Token refresh failed - Attempt ${attempt}: ${error}${
        details ? ` - ${details}` : ''
      } (retryable: ${retryable})`
    );
  }

  /**
   * Get user-friendly error notification for a refresh failure
   */
  getErrorNotification(
    error: RefreshError,
    onRetry?: () => void,
    onLogin?: () => void
  ): ErrorNotification {
    switch (error) {
      case 'invalid_refresh_token':
        return {
          title: 'Session Expired',
          message: 'Your session has expired. Please sign in again to continue.',
          type: 'error',
          action: onLogin
            ? {
                label: 'Sign In',
                handler: onLogin,
              }
            : undefined,
        };

      case 'network_error':
        return {
          title: 'Connection Issue',
          message:
            'Unable to refresh your session due to a network error. Please check your connection and try again.',
          type: 'warning',
          action: onRetry
            ? {
                label: 'Retry',
                handler: onRetry,
              }
            : undefined,
        };

      case 'timeout':
        return {
          title: 'Request Timeout',
          message:
            'The session refresh request timed out. Please check your connection and try again.',
          type: 'warning',
          action: onRetry
            ? {
                label: 'Retry',
                handler: onRetry,
              }
            : undefined,
        };

      case 'unknown':
      default:
        return {
          title: 'Authentication Error',
          message:
            'An unexpected error occurred while refreshing your session. Please try again or sign in.',
          type: 'error',
          action: onRetry
            ? {
                label: 'Retry',
                handler: onRetry,
              }
            : undefined,
        };
    }
  }

  /**
   * Handle a refresh failure by logging and showing notification
   */
  handleFailure(
    error: RefreshError,
    attempt: number,
    retryable: boolean,
    details?: string,
    onRetry?: () => void,
    onLogin?: () => void
  ): void {
    // Log the failure
    this.logFailure(error, attempt, retryable, details);

    // Get and emit notification
    const notification = this.getErrorNotification(error, onRetry, onLogin);
    this.emitNotification(notification);

    // For invalid refresh token, trigger redirect to login
    if (error === 'invalid_refresh_token' && onLogin) {
      // Delay slightly to allow notification to be shown
      setTimeout(() => {
        onLogin();
      }, 1000);
    }
  }

  /**
   * Register a callback for error notifications
   */
  onNotification(callback: (notification: ErrorNotification) => void): () => void {
    this.notificationCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }

  /**
   * Emit notification to all registered callbacks
   */
  private emitNotification(notification: ErrorNotification): void {
    this.notificationCallbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        logger.error('Error in notification callback', error as Error);
      }
    });
  }

  /**
   * Get all failure logs
   */
  getFailureLogs(): RefreshFailureLog[] {
    return [...this.failureLogs];
  }

  /**
   * Get failure logs within a time range
   */
  getFailureLogsSince(sinceMs: number): RefreshFailureLog[] {
    const cutoff = Date.now() - sinceMs;
    return this.failureLogs.filter((log) => log.timestamp >= cutoff);
  }

  /**
   * Get failure rate (percentage) over a time period
   */
  getFailureRate(periodMs: number = 3600000): number {
    const logs = this.getFailureLogsSince(periodMs);
    if (logs.length === 0) return 0;

    // Count unique failure events (group by timestamp within 1 second)
    const uniqueFailures = new Set(
      logs.map((log) => Math.floor(log.timestamp / 1000))
    ).size;

    return uniqueFailures;
  }

  /**
   * Clear all failure logs
   */
  clearLogs(): void {
    this.failureLogs = [];
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.failureLogs = [];
    this.notificationCallbacks.clear();
  }
}

/**
 * Create a singleton instance for global use
 */
let globalErrorHandler: TokenRefreshErrorHandler | null = null;

export function getGlobalTokenRefreshErrorHandler(): TokenRefreshErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new TokenRefreshErrorHandler();
  }
  return globalErrorHandler;
}

/**
 * Reset the global error handler (useful for testing)
 */
export function resetGlobalTokenRefreshErrorHandler(): void {
  if (globalErrorHandler) {
    globalErrorHandler.destroy();
    globalErrorHandler = null;
  }
}
