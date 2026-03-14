/**
 * Validation error types and interfaces
 */

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  path?: string[];
  received?: unknown;
}

export interface ValidationErrorResponse {
  success: false;
  error: 'VALIDATION_ERROR';
  errors: ValidationError[];
  timestamp: string;
  requestId?: string;
}

export const ValidationErrorCodes = {
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  TOO_LONG: 'TOO_LONG',
  TOO_SHORT: 'TOO_SHORT',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_URL: 'INVALID_URL',
  INVALID_UUID: 'INVALID_UUID',
  MALFORMED_JSON: 'MALFORMED_JSON',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION'
} as const;

export type ValidationErrorCode = typeof ValidationErrorCodes[keyof typeof ValidationErrorCodes];