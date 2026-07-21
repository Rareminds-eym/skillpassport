/**
 * Structured Logger for Cloudflare Workers
 * 
 * Provides consistent JSON-formatted logging across all backend services.
 * Follows steering file standards (00-core-standards.md Section 4.1).
 * 
 * @module lib/logger
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Context object for structured logging
 * Include relevant metadata for searchability and tracing
 */
export interface LogContext {
  /** Unique request ID for distributed tracing */
  requestId?: string;
  /** User ID if authenticated */
  userId?: string;
  /** Email address (for auth operations) */
  email?: string;
  /** Organization ID */
  orgId?: string;
  /** Request duration in milliseconds */
  duration?: number;
  /** HTTP status code */
  status?: number;
  /** HTTP method */
  method?: string;
  /** Request path */
  path?: string;
  /** Additional custom fields */
  [key: string]: unknown;
}

/**
 * Logger interface with standard log levels
 */
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error | unknown, context?: LogContext): void;
  fatal(message: string, error?: Error | unknown, context?: LogContext): void;
}

/**
 * Creates a logger instance for a service
 * 
 * @param service - Service name (e.g., 'recruiter-admin-signup', 'email-verification')
 * @param env - Environment name (defaults to 'development')
 * @returns Logger instance with structured logging methods
 * 
 * @example
 * ```typescript
 * const logger = createLogger('recruiter-admin-signup', 'production');
 * 
 * logger.info('signup_initiated', { 
 *   requestId: 'abc-123',
 *   email: 'user@example.com' 
 * });
 * 
 * logger.error('sso_signup_failed', error, {
 *   requestId: 'abc-123',
 *   email: 'user@example.com',
 *   status: 500
 * });
 * ```
 */
export function createLogger(service: string, env?: string): Logger {
  const environment = env || 'development';

  /**
   * Internal log function that formats and outputs structured logs
   */
  function log(level: LogLevel, message: string, context?: LogContext, error?: Error | unknown) {
    const logEntry: Record<string, unknown> = {
      level,
      message,
      service,
      environment,
      timestamp: new Date().toISOString(),
      ...context,
    };

    // Add error details if provided
    if (error !== undefined) {
      if (error instanceof Error) {
        logEntry['error'] = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        logEntry['error'] = String(error);
      }
    }

    // Output to appropriate console method
    const logFn = level === 'error' || level === 'fatal' ? console.error : console.log;
    logFn(JSON.stringify(logEntry));
  }

  return {
    /**
     * Debug level - Detailed information for diagnosing problems
     * Typically disabled in production
     */
    debug(message: string, context?: LogContext): void {
      log('debug', message, context);
    },

    /**
     * Info level - General informational messages
     * Track normal operations and important events
     */
    info(message: string, context?: LogContext): void {
      log('info', message, context);
    },

    /**
     * Warn level - Warning messages for non-critical issues
     * Indicates potential problems that don't prevent operation
     */
    warn(message: string, context?: LogContext): void {
      log('warn', message, context);
    },

    /**
     * Error level - Error events that might still allow continued operation
     * Requires attention but system continues running
     */
    error(message: string, error?: Error | unknown, context?: LogContext): void {
      log('error', message, context, error);
    },

    /**
     * Fatal level - Very severe error events that might cause termination
     * Critical issues requiring immediate attention
     */
    fatal(message: string, error?: Error | unknown, context?: LogContext): void {
      log('fatal', message, context, error);
    },
  };
}

/**
 * Performance logger helper
 * Measures and logs operation duration
 * 
 * @param logger - Logger instance
 * @param operationName - Name of the operation being measured
 * @param context - Additional context
 * @returns Function to call when operation completes
 * 
 * @example
 * ```typescript
 * const logger = createLogger('my-service');
 * const endTimer = logPerformance(logger, 'database_query', { query: 'SELECT ...' });
 * 
 * // ... perform operation ...
 * 
 * endTimer(); // Logs duration automatically
 * ```
 */
export function logPerformance(
  logger: Logger,
  operationName: string,
  context?: LogContext
): () => void {
  const startTime = Date.now();

  return () => {
    const duration = Date.now() - startTime;
    logger.info(`${operationName}_completed`, {
      ...context,
      duration,
    });
  };
}

/**
 * Sanitizes sensitive data from log context
 * Removes or masks fields that should not be logged
 * 
 * @param context - Original context object
 * @returns Sanitized context with sensitive data masked
 * 
 * @example
 * ```typescript
 * const context = {
 *   email: 'user@example.com',
 *   password: 'secret123',
 *   token: 'eyJhbGc...'
 * };
 * 
 * const sanitized = sanitizeLogContext(context);
 * // { email: 'user@example.com', password: '[REDACTED]', token: 'eyJ...XXX' }
 * ```
 */
export function sanitizeLogContext(context: LogContext): LogContext {
  const sanitized = { ...context };

  // List of sensitive field names to sanitize
  const sensitiveFields = [
    'password',
    'passwordConfirmation',
    'currentPassword',
    'newPassword',
    'access_token',
    'accessToken',
    'refresh_token',
    'refreshToken',
    'secret',
    'apiKey',
    'privateKey',
  ];

  // Redact sensitive fields completely
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Mask tokens (show first/last few characters)
  const tokenFields = ['token', 'jwt', 'sessionToken'];
  for (const field of tokenFields) {
    if (field in sanitized && typeof sanitized[field] === 'string') {
      const value = sanitized[field] as string;
      if (value.length > 10) {
        sanitized[field] = `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
      } else {
        sanitized[field] = '[REDACTED]';
      }
    }
  }

  return sanitized;
}

/**
 * Creates a child logger with inherited context
 * Useful for maintaining context across multiple operations
 * 
 * @param logger - Parent logger instance
 * @param inheritedContext - Context to include in all child logs
 * @returns New logger that includes inherited context
 * 
 * @example
 * ```typescript
 * const logger = createLogger('my-service');
 * const requestLogger = createChildLogger(logger, { requestId: 'abc-123' });
 * 
 * requestLogger.info('step_1'); // Includes requestId automatically
 * requestLogger.info('step_2'); // Includes requestId automatically
 * ```
 */
export function createChildLogger(logger: Logger, inheritedContext: LogContext): Logger {
  return {
    debug(message: string, context?: LogContext): void {
      logger.debug(message, { ...inheritedContext, ...context });
    },
    info(message: string, context?: LogContext): void {
      logger.info(message, { ...inheritedContext, ...context });
    },
    warn(message: string, context?: LogContext): void {
      logger.warn(message, { ...inheritedContext, ...context });
    },
    error(message: string, error?: Error | unknown, context?: LogContext): void {
      logger.error(message, error, { ...inheritedContext, ...context });
    },
    fatal(message: string, error?: Error | unknown, context?: LogContext): void {
      logger.fatal(message, error, { ...inheritedContext, ...context });
    },
  };
}

/**
 * Default API logger instance for general use
 * Pre-configured with 'api' service name
 * 
 * @example
 * ```typescript
 * import { apiLogger } from './logger';
 * 
 * apiLogger.info('Request received');
 * apiLogger.error('Operation failed', error);
 * ```
 */
export const apiLogger = createLogger('api');
