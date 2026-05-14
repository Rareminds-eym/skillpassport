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
 */
export function logError(error: ErrorLog): void {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorLog]', {
      ...error,
      timestamp: new Date(error.timestamp).toISOString(),
    });
  }

  // In production, this would send to monitoring service (e.g., Sentry, Datadog)
  // For now, we'll just log to console
  console.error(JSON.stringify(error));
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
