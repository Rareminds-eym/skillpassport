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

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  'https://sso-auth.skillpassport.pages.dev',
  'https://skillpassport.pages.dev',
  'http://localhost:5173',
  'http://localhost:8788',
];

function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers?.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Expose-Headers': 'X-Request-ID',
    'Access-Control-Max-Age': '86400',
  };
}

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

  // Generic fallback — never expose raw error.message
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
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...getCorsHeaders(request),
  });
  return headers;
}

/**
 * Success response
 */
export function apiSuccess<T>(
  data: T,
  request?: Request,
  options?: { status?: number; startTime?: number }
): Response {
  const requestId = getRequestId();
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      durationMs: options?.startTime ? Date.now() - options.startTime : undefined,
    },
  };

  return new Response(JSON.stringify(body), {
    status: options?.status || 200,
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
  // Log the REAL error server-side for debugging
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
 * CORS preflight handler
 */
export function handleCorsOptions(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: new Headers(getCorsHeaders(request)),
  });
}
