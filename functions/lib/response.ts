/**
 * API Response Utilities — Industrial-Grade
 *
 * Provides:
 * - Consistent response envelope { success, data, error, meta }
 * - Proper HTTP status codes (400/401/403/404/500)
 * - CORS headers on every response
 * - Request ID tracing (X-Request-ID)
 * - Safe error mapping (no internal DB details leaked)
 * - Timing metadata
 */

import { getCorsHeaders } from './cors';

// ---------------------------------------------------------------------------
// Request ID
// ---------------------------------------------------------------------------
function getRequestId(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Safe Error Mapping — never leak raw DB internals
// ---------------------------------------------------------------------------
const SAFE_ERROR_MAP: Record<string, { code: string; message: string; status: number }> = {
  PGRST116: { code: 'NOT_FOUND', message: 'Resource not found', status: 404 },
  PGRST301: { code: 'RELATION_ERROR', message: 'Internal data error', status: 500 },
  '42501':  { code: 'PERMISSION_DENIED', message: 'Insufficient permissions', status: 403 },
  '23505':  { code: 'DUPLICATE', message: 'Resource already exists', status: 409 },
  '23503':  { code: 'REFERENCE_ERROR', message: 'Referenced resource not found', status: 400 },
  '22P02':  { code: 'INVALID_INPUT', message: 'Invalid input format', status: 400 },
};

interface SafeError {
  code: string;
  message: string;
}

function mapDbError(error: any): { safeError: SafeError; status: number } {
  if (!error) {
    return { safeError: { code: 'UNKNOWN', message: 'Unknown error' }, status: 500 };
  }

  const mapped = SAFE_ERROR_MAP[error.code];
  if (mapped) {
    return { safeError: { code: mapped.code, message: mapped.message }, status: mapped.status };
  }

  return {
    safeError: { code: 'INTERNAL_ERROR', message: 'An internal error occurred' },
    status: 500,
  };
}

// ---------------------------------------------------------------------------
// Response Builders
// ---------------------------------------------------------------------------
interface ResponseMeta {
  requestId: string;
  timestamp: string;
  durationMs?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: SafeError | null;
  meta: ResponseMeta;
}

function buildHeaders(requestId: string, request?: Request): Headers {
  const origin = request?.headers?.get('Origin') ?? null;
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...getCorsHeaders(origin),
  });
  return headers;
}

/**
 * Success response
 * Accepts either a status number (3rd arg) or an options object with status/startTime
 */
export function apiSuccess<T>(
  data: T,
  request?: Request,
  statusOrOptions?: number | { status?: number; startTime?: number }
): Response {
  const requestId = getRequestId();
  const { status, startTime } = typeof statusOrOptions === 'number'
    ? { status: statusOrOptions, startTime: undefined }
    : { status: statusOrOptions?.status ?? 200, startTime: statusOrOptions?.startTime };

  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      durationMs: startTime ? Date.now() - startTime : undefined,
    },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: buildHeaders(requestId, request),
  });
}

/**
 * Error response — safe, no internals leaked
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  request?: Request,
  options?: { startTime?: number }
): Response {
  const requestId = getRequestId();
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error: { code, message },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      durationMs: options?.startTime ? Date.now() - options.startTime : undefined,
    },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: buildHeaders(requestId, request),
  });
}

/**
 * Map a raw DB error to a safe API error response
 */
export function apiDbError(dbError: any, request?: Request, options?: { startTime?: number }): Response {
  const { safeError, status } = mapDbError(dbError);
  console.error(`[API] DB Error [${dbError?.code}]: ${dbError?.message}`);
  return apiError(status, safeError.code, safeError.message, request, options);
}

/**
 * Validation error — returns 400 with field-level details
 */
export function apiValidationError(
  issues: Array<{ path: string; message: string }>,
  request?: Request
): Response {
  const requestId = getRequestId();
  const body = {
    success: false,
    data: null,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: issues,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  return new Response(JSON.stringify(body), {
    status: 400,
    headers: buildHeaders(requestId, request),
  });
}

/**
 * Method Not Allowed — 405
 */
export function apiMethodNotAllowed(request?: Request): Response {
  return apiError(405, 'METHOD_NOT_ALLOWED', 'HTTP method not allowed', request);
}

/**
 * Not Found — 404
 */
export function apiNotFound(message = 'Resource not found', request?: Request): Response {
  return apiError(404, 'NOT_FOUND', message, request);
}

/**
 * Legacy JSON response builder (for backward compatibility)
 */
export function jsonResponse(body: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(null),
      ...extraHeaders
    }
  });
}
