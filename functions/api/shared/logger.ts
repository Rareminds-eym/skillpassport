/**
 * Development-only logging utility
 * Prevents console logs in production for better performance and security
 * 
 * @module shared/logger
 */

/**
 * Check if running in development mode
 * Cloudflare Workers don't have NODE_ENV, so we check for localhost or dev indicators
 */
const isDevelopment = (): boolean => {
  // Check if we're in local development (wrangler dev)
  if (typeof globalThis !== 'undefined' && (globalThis as any).__STATIC_CONTENT_MANIFEST) {
    return false; // Production (Pages)
  }
  return true; // Assume dev if no production indicators
};

/**
 * Logger that only outputs in development
 */
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment()) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment()) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment()) {
      console.info(...args);
    }
  }
};

/**
 * Production-safe logger that uses structured logging
 * In production, logs are sent to Cloudflare's logging system
 */
export const structuredLog = (level: 'info' | 'warn' | 'error', message: string, data?: Record<string, any>) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (isDevelopment()) {
    console.log(JSON.stringify(logEntry));
  }
};
