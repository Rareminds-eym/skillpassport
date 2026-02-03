/**
 * Global CORS Middleware for Cloudflare Pages Functions
 * 
 * This middleware handles CORS for all Pages Functions automatically.
 * It intercepts all requests and adds appropriate CORS headers with origin validation.
 */

import type { PagesFunction } from '../src/functions-lib/types';
import { getCorsHeaders, handleCorsPreflightRequest } from '../src/functions-lib/cors';

export const onRequest: PagesFunction = async (context) => {
  // Get origin from request
  const origin = context.request.headers.get('Origin');

  // Handle CORS preflight requests
  if (context.request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(origin);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Continue to the actual function handler
  const response = await context.next();

  // Add CORS headers to the response with origin validation
  const corsHeaders = getCorsHeaders(origin);
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
