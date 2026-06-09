/**
 * CORS utilities for Cloudflare Pages Functions
 * Provides consistent CORS headers across all API endpoints
 * 
 * Security: Origin whitelist approach to prevent unauthorized access
 */

/**
 * Allowed origins for CORS
 * Add your production and development domains here
 */
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8788',
  'http://127.0.0.1:8788',
  'https://skillpassport.com:3002',
  'https://sso-auth.skillpassport.pages.dev',
  'https://skillpassport.pages.dev',
  'https://skillpassport.rareminds.in',
  'https://app.skillpassport.rareminds.in',
];

/**
 * Get CORS headers with origin validation
 * Falls back to first allowed origin if origin is not in whitelist
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

/**
 * CORS headers using whitelist (fallback origin)
 */
export const corsHeaders: Record<string, string> = getCorsHeaders(null);

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(request?: Request): Response {
  const origin = request?.headers?.get('Origin') ?? null;
  return new Response(null, {
    status: 204,
    headers: new Headers(getCorsHeaders(origin)),
  });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: Response, request?: Request): Response {
  const origin = request?.headers?.get('Origin') ?? null;
  const cors = getCorsHeaders(origin);
  const newHeaders = new Headers(response.headers);
  Object.entries(cors).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Generic request handler with CORS support
 */
export async function handleRequest(
  context: any,
  handler: (params: { request: Request; env: any; ctx: any }) => Promise<Response>
): Promise<Response> {
  try {
    const { request, env, ctx } = context;
    const response = await handler({ request, env, ctx });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Request handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}
