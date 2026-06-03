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
  // Development origins - always include for Workers compatibility
  'http://localhost:5173',
  'http://localhost:3000', 
  'http://localhost:8788',
  'http://127.0.0.1:8787', // SSO worker local
  // Production domains from environment variables
  'https://skillpassport.rareminds.in',
  'https://app.skillpassport.rareminds.in',
  'https://api.rareminds.email', // SSO worker production
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
