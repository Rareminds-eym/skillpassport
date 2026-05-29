import { ssoClient } from '@/shared/api/ssoClient';
/**
 * Error Logging Utility
 * 
 * Provides structured error logging for subscription operations
 * with consistent format and context tracking.
 */

export interface ErrorLog {
  timestamp: string;
  userId: string;
  errorType: string;
  errorMessage: string;
  context: {
    planCode?: string;
    feature?: string;
    endpoint?: string;
    statusCode?: number;
    [key: string]: any;
  };
  stackTrace?: string;
}

/**
 * Log an error with structured context
 * Sends to monitoring service in production (Sentry, DataDog, etc.)
 */
export function logError(error: ErrorLog): void {
  // Always log to console for debugging
  console.error('[ErrorLog]', {
    ...error,
    timestamp: new Date(error.timestamp).toISOString(),
  });

  // Send to monitoring service in production
  if (!import.meta.env.DEV) {
    // Try to send to monitoring service
    sendToMonitoringService(error);

    // Also send to custom backend endpoint for aggregation
    sendToBackend(error);
  }
}

/**
 * Send error to monitoring service (Sentry, DataDog, etc.)
 */
function sendToMonitoringService(error: ErrorLog): void {
  try {
    // Check if Sentry is available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;

      Sentry.captureException(new Error(error.errorMessage), {
        tags: {
          errorType: error.errorType,
          userId: error.userId,
          planCode: error.context.planCode,
          feature: error.context.feature,
        },
        contexts: {
          subscription: error.context,
        },
        level: 'error',
      });
    }

    // Check if DataDog is available
    if (typeof window !== 'undefined' && (window as any).DD_LOGS) {
      const DD_LOGS = (window as any).DD_LOGS;

      DD_LOGS.logger.error(error.errorMessage, {
        error_type: error.errorType,
        user_id: error.userId,
        context: error.context,
        stack_trace: error.stackTrace,
      });
    }
  } catch (monitoringError) {
    // Silently fail - don't let monitoring errors break the app
    console.warn('[ErrorLog] Failed to send to monitoring service:', monitoringError);
  }
}

/**
 * Send error to custom backend endpoint for aggregation
 */
function sendToBackend(error: ErrorLog): void {
  try {
    // Use keepalive to ensure log is sent even if page unloads
    ssoClient.fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error),
      keepalive: true,
    }).catch(fetchError => {
      // Fallback: Store in localStorage for later retry
      storeErrorForRetry(error);
    });
  } catch (backendError) {
    // Fallback: Store in localStorage for later retry
    storeErrorForRetry(error);
  }
}

/**
 * Store error in localStorage for later retry
 */
function storeErrorForRetry(error: ErrorLog): void {
  try {
    const pendingErrors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
    pendingErrors.push(error);

    // Keep only last 10 errors to avoid filling localStorage
    const recentErrors = pendingErrors.slice(-10);
    localStorage.setItem('pending_errors', JSON.stringify(recentErrors));
  } catch (storageError) {
    // If localStorage fails, just log to console
    console.warn('[ErrorLog] Failed to store error for retry:', storageError);
  }
}

/**
 * Retry sending pending errors from localStorage
 * Call this on app initialization or page load
 */
export function retryPendingErrors(): void {
  try {
    const pendingErrors = JSON.parse(localStorage.getItem('pending_errors') || '[]');

    if (pendingErrors.length === 0) {
      return;
    }

    // Try to send each pending error
    pendingErrors.forEach((error: ErrorLog) => {
      ssoClient.fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error),
      }).catch(() => {
        // Silently fail - will retry on next page load
      });
    });

    // Clear pending errors after attempting to send
    localStorage.removeItem('pending_errors');
  } catch (error) {
    console.warn('[ErrorLog] Failed to retry pending errors:', error);
  }
}

/**
 * Create a subscription error log entry
 */
export function createSubscriptionErrorLog(
  userId: string,
  errorType: string,
  errorMessage: string,
  context: ErrorLog['context'],
  error?: Error
): ErrorLog {
  return {
    timestamp: new Date().toISOString(),
    userId,
    errorType,
    errorMessage,
    context,
    stackTrace: error?.stack,
  };
}

/**
 * Create a feature access error log entry
 */
export function createFeatureAccessErrorLog(
  userId: string,
  feature: string,
  planCode: string,
  errorMessage: string,
  error?: Error
): ErrorLog {
  return {
    timestamp: new Date().toISOString(),
    userId,
    errorType: 'FEATURE_ACCESS_ERROR',
    errorMessage,
    context: {
      feature,
      planCode,
    },
    stackTrace: error?.stack,
  };
}

/**
 * Create a payment error log entry
 */
export function createPaymentErrorLog(
  userId: string,
  errorType: string,
  errorMessage: string,
  planCode: string,
  context: Record<string, any> = {},
  error?: Error
): ErrorLog {
  return {
    timestamp: new Date().toISOString(),
    userId,
    errorType,
    errorMessage,
    context: {
      planCode,
      ...context,
    },
    stackTrace: error?.stack,
  };
}
