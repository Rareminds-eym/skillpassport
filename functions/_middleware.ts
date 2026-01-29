/**
 * Global CORS Middleware for Cloudflare Pages Functions
 * 
 * This middleware handles CORS for all Pages Functions automatically.
 * It intercepts all requests and adds appropriate CORS headers.
 */

import type { PagesFunction } from '../src/functions-lib/types';
import { corsHeaders, handleCorsPreflightRequest } from '../src/functions-lib/cors';

export const onRequest: PagesFunction = async (context) => {
  // Handle CORS preflight requests
  if (context.request.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  // Continue to the actual function handler
  const response = await context.next();

  // Add CORS headers to the response
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
