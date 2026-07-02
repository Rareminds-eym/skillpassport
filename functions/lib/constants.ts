/**
 * Shared constants for backend functions
 */

/**
 * Password validation constants
 * CRITICAL: Must match sso-worker and frontend constants
 */

/** Minimum password length — must match sso-worker and frontend constants */
export const PASSWORD_MIN = 10;

/** Maximum password length — bcrypt silently truncates at 72 bytes */
export const PASSWORD_MAX = 72;

/**
 * Receipt file path configuration
 * CRITICAL: Must match frontend configuration in src/shared/config/constants.js
 */
export const RECEIPT_CONFIG = {
  /**
   * Length of user ID prefix used in receipt file paths
   * Pattern: payment_pdf/user_{first8chars}/{sanitizedPaymentId}_{timestamp}.pdf
   * 
   * This MUST be consistent between frontend and backend to ensure
   * receipt downloads work correctly.
   */
  USER_ID_PREFIX_LENGTH: 8,
  
  /**
   * Regex to sanitize payment IDs for safe file paths
   * Removes all characters except alphanumeric, underscore, and hyphen
   * This prevents directory traversal attacks and ensures valid file paths
   */
  PAYMENT_ID_SANITIZE_REGEX: /[^a-zA-Z0-9_-]/g,
} as const;

/**
 * Date utilities for consistent formatting
 */
export const DateUtils = {
  /**
   * Get current date in YYYY-MM-DD format
   * Used for receipt filenames and other date-based naming
   */
  getDateString: (date: Date = new Date()): string => {
    return date.toISOString().split('T')[0];
  },
} as const;
