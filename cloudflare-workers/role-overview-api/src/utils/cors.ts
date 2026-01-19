/**
 * CORS headers for cross-origin requests
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests
 */
export function handleCors(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
