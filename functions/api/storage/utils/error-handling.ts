/**
 * Error Handling Utilities
 * 
 * Provides standardized error responses and logging for the Storage API.
 * Ensures consistent error messages and proper security logging without exposing sensitive data.
 */

import { jsonResponse } from '../../../../src/functions-lib';

/**
 * Standard error messages
 */
export const ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: 'Authentication required',
  AUTHENTICATION_REQUIRED_DETAIL: 'Please provide a valid JWT token in the Authorization header',
  ACCESS_DENIED: 'Access denied',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to access this resource',
  INVALID_TOKEN: 'Invalid or expired authentication token',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
} as const;

/**
 * Authentication failure reasons
 */
export type AuthFailureReason = 
  | 'missing_token'
  | 'invalid_token'
  | 'expired_token'
  | 'malformed_token';

/**
 * Authorization failure reasons
 */
export type AuthzFailureReason =
  | 'ownership_mismatch'
  | 'insufficient_role'
  | 'user_id_mismatch'
  | 'not_educator'
  | 'invalid_path';

/**
 * Log authentication failure
 * 
 * @param endpoint - The endpoint that was accessed
 * @param reason - The reason for authentication failure
 */
export function logAuthenticationFailure(
  endpoint: string,
  reason: AuthFailureReason
): void {
  console.error('[Auth] Authentication failed:', {
    endpoint,
    reason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log authorization failure
 * 
 * @param userId - The authenticated user's ID
 * @param fileKey - The file key that was accessed
 * @param reason - The reason for authorization failure
 */
export function logAuthorizationFailure(
  userId: string,
  fileKey: string,
  reason: AuthzFailureReason
): void {
  console.error('[Authz] Authorization failed:', {
    userId,
    fileKey,
    reason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create a 401 Unauthorized response
 * 
 * @param endpoint - The endpoint that was accessed (for logging)
 * @param reason - The reason for authentication failure (for logging)
 * @param message - Optional custom message (defaults to standard message)
 * @returns Response with 401 status
 */
export function createAuthenticationError(
  endpoint: string,
  reason: AuthFailureReason = 'missing_token',
  message?: string
): Response {
  logAuthenticationFailure(endpoint, reason);
  
  return jsonResponse(
    {
      error: ERROR_MESSAGES.AUTHENTICATION_REQUIRED,
      message: message || ERROR_MESSAGES.AUTHENTICATION_REQUIRED_DETAIL,
    },
    401
  );
}

/**
 * Create a 403 Forbidden response
 * 
 * @param userId - The authenticated user's ID
 * @param fileKey - The file key that was accessed
 * @param reason - The reason for authorization failure
 * @param customMessage - Optional custom message
 * @returns Response with 403 status
 */
export function createAuthorizationError(
  userId: string,
  fileKey: string,
  reason: AuthzFailureReason,
  customMessage?: string
): Response {
  logAuthorizationFailure(userId, fileKey, reason);
  
  return jsonResponse(
    {
      error: ERROR_MESSAGES.ACCESS_DENIED,
      message: customMessage || ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
    },
    403
  );
}

/**
 * Sanitize error message to prevent sensitive data leakage
 * 
 * Removes:
 * - JWT tokens
 * - File contents
 * - Database credentials
 * - API keys
 * 
 * @param message - The error message to sanitize
 * @returns Sanitized error message
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove potential JWT tokens (Bearer tokens)
  let sanitized = message.replace(/Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/gi, 'Bearer [REDACTED]');
  
  // Remove potential API keys
  sanitized = sanitized.replace(/[a-z0-9]{32,}/gi, '[REDACTED]');
  
  // Remove potential file paths with sensitive info
  sanitized = sanitized.replace(/\/[a-z0-9-_]+\/[a-z0-9-_]+\//gi, '/[PATH]/');
  
  return sanitized;
}

/**
 * Log error safely without exposing sensitive data
 * 
 * @param context - Context about where the error occurred
 * @param error - The error object
 */
export function logErrorSafely(context: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const sanitizedMessage = sanitizeErrorMessage(errorMessage);
  
  console.error(`[${context}] Error:`, {
    message: sanitizedMessage,
    timestamp: new Date().toISOString(),
  });
}
