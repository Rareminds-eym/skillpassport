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
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Alternative dev port
  'http://localhost:8788', // Pages dev server
  // Add production domains:
  // 'https://yourdomain.com',
  // 'https://app.yourdomain.com',
];

/**
 * Get CORS headers with origin validation
 * Falls back to first allowed origin if origin is not in whitelist
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is in whitelist
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // Fallback to first allowed origin

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

/**
 * Legacy CORS headers for backward compatibility
 * @deprecated Use getCorsHeaders() instead for better security
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
