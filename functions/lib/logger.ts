/**
 * Simple logger for Cloudflare Pages Functions
 * 
 * This is a lightweight logger that works in server-side environments
 * where import.meta.env is not available.
 * 
 * IMPORTANT: This logger uses console.* methods internally, which is the ONLY
 * way to output logs in Cloudflare Workers/Pages Functions. This is NOT debugging
 * code - it's the production logging mechanism for serverless environments.
 * 
 * The console methods are wrapped to provide:
 * - Structured log formatting with timestamps
 * - Log level categorization
 * - Consistent metadata handling
 * - Error stack trace formatting
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: unknown;
}

class FunctionLogger {
  private category: string;

  constructor(category: string) {
    this.category = category;
  }

  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.category}]`;
    
    // Safe JSON serialization with circular reference handling
    let metaStr = '';
    if (metadata) {
      try {
        metaStr = ` ${JSON.stringify(metadata)}`;
      } catch (serializationError) {
        // Fallback for circular references or non-serializable values
        metaStr = ` [Metadata serialization failed: ${serializationError instanceof Error ? serializationError.message : 'Unknown error'}]`;
      }
    }
    
    return `${prefix} ${message}${metaStr}`;
  }

  debug(message: string, metadata?: LogMetadata): void {
    console.debug(this.formatMessage('debug', message, metadata));
  }

  info(message: string, metadata?: LogMetadata): void {
    console.info(this.formatMessage('info', message, metadata));
  }

  warn(message: string, metadata?: LogMetadata): void {
    console.warn(this.formatMessage('warn', message, metadata));
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    const errorMeta = error instanceof Error 
      ? { ...(metadata || {}), error: error.message, stack: error.stack }
      : metadata;
    
    console.error(this.formatMessage('error', message, errorMeta));
    
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Create a logger for a specific category
 */
export function createLogger(category: string): FunctionLogger {
  return new FunctionLogger(category);
}

// Pre-configured loggers for common use cases
export const apiLogger = createLogger('api');
export const emailLogger = createLogger('email');
export const authLogger = createLogger('auth');
