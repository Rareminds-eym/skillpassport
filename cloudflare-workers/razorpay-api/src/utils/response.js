/**
 * Response utilities
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function corsPreflightResponse() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export function errorResponse(message, details = null, status = 500) {
  return jsonResponse(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    status
  );
}
