/**
 * Logging Configuration for Organization Subscription Management
 * 
 * Provides structured logging with:
 * - Log levels (debug, info, warn, error)
 * - Contextual metadata
 * - Log aggregation support
 * - Performance tracking
 */

// ============================================================================
// LOG LEVELS
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get minimum log level from environment
const MIN_LOG_LEVEL: LogLevel = 
  (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 
  (import.meta.env.PROD ? 'info' : 'debug');

// ============================================================================
// LOG ENTRY STRUCTURE
// ============================================================================

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  category: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
  private category: string;
  private context: Record<string, unknown> = {};

  constructor(category: string) {
    this.category = category;
  }

  /**
   * Set context that will be included in all logs
   */
  setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Check if log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
  }

  /**
   * Create log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      category: this.category,
      metadata: { ...this.context, ...metadata },
      userId: this.context.userId as string | undefined,
      organizationId: this.context.organizationId as string | undefined,
      requestId: this.context.requestId as string | undefined,
    };
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Format for console
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    const metaStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';

    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${entry.message}${metaStr}`);
        break;
      case 'info':
        console.info(`${prefix} ${entry.message}${metaStr}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}${metaStr}`);
        break;
      case 'error':
        console.error(`${prefix} ${entry.message}${metaStr}`);
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }

    // Send to log aggregation service in production
    if (import.meta.env.PROD) {
      this.sendToAggregator(entry);
    }
  }

  /**
   * Send log to aggregation service
   */
  private sendToAggregator(entry: LogEntry): void {
    // TODO: Integrate with log aggregation service (e.g., Datadog, Logtail)
    // Example:
    // fetch(LOG_AGGREGATOR_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(entry),
    // }).catch(() => {}); // Silently fail
  }

  // Log methods
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry('debug', message, metadata));
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry('info', message, metadata));
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.createEntry('warn', message, metadata));
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    const entry = this.createEntry('error', message, metadata);
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    this.output(entry);
  }

  /**
   * Log with timing
   */
  timed<T>(
    message: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): T | Promise<T> {
    const start = performance.now();
    
    const logCompletion = (result: T) => {
      const duration = performance.now() - start;
      this.info(`${message} completed`, { ...metadata, duration: `${duration.toFixed(2)}ms` });
      return result;
    };

    const logError = (error: Error) => {
      const duration = performance.now() - start;
      this.error(`${message} failed`, error, { ...metadata, duration: `${duration.toFixed(2)}ms` });
      throw error;
    };

    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.then(logCompletion).catch(logError);
      }
      return logCompletion(result);
    } catch (error) {
      return logError(error as Error);
    }
  }
}


// ============================================================================
// LOGGER FACTORY
// ============================================================================

const loggers: Map<string, Logger> = new Map();

/**
 * Get or create a logger for a category
 */
export function getLogger(category: string): Logger {
  if (!loggers.has(category)) {
    loggers.set(category, new Logger(category));
  }
  return loggers.get(category)!;
}

// ============================================================================
// PRE-CONFIGURED LOGGERS
// ============================================================================

export const orgSubscriptionLogger = getLogger('org-subscription');
export const licenseLogger = getLogger('license-management');
export const billingLogger = getLogger('billing');
export const invitationLogger = getLogger('invitation');
export const paymentLogger = getLogger('payment');
export const apiLogger = getLogger('api');

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Log subscription purchase
 */
export function logSubscriptionPurchase(data: {
  organizationId: string;
  planId: string;
  seatCount: number;
  amount: number;
  userId: string;
}): void {
  orgSubscriptionLogger.info('Subscription purchased', data);
}

/**
 * Log license assignment
 */
export function logLicenseAssignment(data: {
  organizationId: string;
  poolId: string;
  userId: string;
  assignedBy: string;
}): void {
  licenseLogger.info('License assigned', data);
}

/**
 * Log license revocation
 */
export function logLicenseRevocation(data: {
  organizationId: string;
  assignmentId: string;
  userId: string;
  revokedBy: string;
  reason?: string;
}): void {
  licenseLogger.info('License revoked', data);
}

/**
 * Log payment event
 */
export function logPaymentEvent(
  event: 'initiated' | 'success' | 'failed' | 'refunded',
  data: {
    organizationId: string;
    amount: number;
    transactionId?: string;
    error?: string;
  }
): void {
  if (event === 'failed') {
    paymentLogger.error(`Payment ${event}`, undefined, data);
  } else {
    paymentLogger.info(`Payment ${event}`, data);
  }
}

/**
 * Log invitation event
 */
export function logInvitationEvent(
  event: 'sent' | 'accepted' | 'expired' | 'cancelled',
  data: {
    organizationId: string;
    email: string;
    invitedBy?: string;
  }
): void {
  invitationLogger.info(`Invitation ${event}`, data);
}

/**
 * Log API request
 */
export function logApiRequest(data: {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  organizationId?: string;
  error?: string;
}): void {
  if (data.statusCode >= 500) {
    apiLogger.error(`${data.method} ${data.path} - ${data.statusCode}`, undefined, data);
  } else if (data.statusCode >= 400) {
    apiLogger.warn(`${data.method} ${data.path} - ${data.statusCode}`, data);
  } else {
    apiLogger.info(`${data.method} ${data.path} - ${data.statusCode}`, data);
  }
}

// ============================================================================
// REQUEST CONTEXT
// ============================================================================

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Set request context for all loggers
 */
export function setRequestContext(context: {
  requestId: string;
  userId?: string;
  organizationId?: string;
}): void {
  loggers.forEach(logger => {
    logger.setContext(context);
  });
}

/**
 * Clear request context
 */
export function clearRequestContext(): void {
  loggers.forEach(logger => {
    logger.clearContext();
  });
}
