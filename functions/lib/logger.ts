/**
 * Simple logger for Cloudflare Pages Functions
 * 
 * This is a lightweight logger that works in server-side environments
 * where import.meta.env is not available.
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
    const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
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
      ? { ...metadata, error: error.message, stack: error.stack }
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
