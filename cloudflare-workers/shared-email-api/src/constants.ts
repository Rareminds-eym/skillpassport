/**
 * Constants for Shared Email API Worker
 */

export const VERSION = '1.0.0';

export const RATE_LIMITS = {
  DEFAULT_PER_MINUTE: 60,
  DEFAULT_PER_HOUR: 1000,
  DEFAULT_PER_DAY: 10000,
} as const;

export const TIMEOUTS = {
  SMTP_CONNECTION: 10000, // 10 seconds
  EMAIL_SEND: 30000, // 30 seconds
} as const;

export const RETRY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;

export const VALIDATION = {
  MAX_RECIPIENTS: 50,
  MAX_SUBJECT_LENGTH: 998,
  MAX_HTML_SIZE: 1024 * 1024, // 1MB
} as const;

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
} as const;

export const ERROR_CODES = {
  AUTH_ERROR: 'AUTH_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
