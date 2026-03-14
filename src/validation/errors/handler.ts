/**
 * Validation error handling utilities
 */

import { ZodError, ZodIssue } from 'zod';
import { ValidationError, ValidationErrorResponse, ValidationErrorCodes } from './types.js';

/**
 * Convert Zod error to standardized validation error format
 */
export function formatZodError(error: ZodError): ValidationError[] {
  return error.issues.map((issue: ZodIssue) => ({
    code: mapZodCodeToValidationCode(issue.code),
    message: issue.message,
    field: issue.path.join('.') || undefined,
    path: issue.path.map(String),
    received: 'received' in issue ? issue.received : undefined
  }));
}

/**
 * Map Zod error codes to our validation error codes
 */
function mapZodCodeToValidationCode(zodCode: string): string {
  const codeMap: Record<string, string> = {
    'invalid_type': ValidationErrorCodes.INVALID_TYPE,
    'invalid_string': ValidationErrorCodes.INVALID_FORMAT,
    'too_small': ValidationErrorCodes.TOO_SHORT,
    'too_big': ValidationErrorCodes.TOO_LONG,
    'invalid_email': ValidationErrorCodes.INVALID_EMAIL,
    'invalid_url': ValidationErrorCodes.INVALID_URL,
    'invalid_uuid': ValidationErrorCodes.INVALID_UUID,
    'custom': ValidationErrorCodes.INVALID_FORMAT
  };
  
  return codeMap[zodCode] || ValidationErrorCodes.INVALID_FORMAT;
}

/**
 * Create standardized validation error response
 */
export function createValidationErrorResponse(
  errors: ValidationError[],
  requestId?: string
): ValidationErrorResponse {
  return {
    success: false,
    error: 'VALIDATION_ERROR',
    errors,
    timestamp: new Date().toISOString(),
    requestId
  };
}

/**
 * Create validation error response from Zod error
 */
export function createZodErrorResponse(
  zodError: ZodError,
  requestId?: string
): ValidationErrorResponse {
  const errors = formatZodError(zodError);
  return createValidationErrorResponse(errors, requestId);
}