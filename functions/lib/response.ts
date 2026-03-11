/**
 * Response helper utilities for Cloudflare Pages Functions
 * Provides consistent response formatting with CORS headers
 */

import { corsHeaders } from './cors';

/**
 * Create a JSON response with CORS headers
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 * @param additionalHeaders - Optional additional headers to include
 */
export function jsonResponse(data: any, status = 200, additionalHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
  });
}

/**
 * Create an error response with CORS headers
 */
export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * Create a success response with CORS headers
 */
export function successResponse(data: any, status = 200): Response {
  return jsonResponse({ success: true, ...data }, status);
}

/**
 * Create a streaming response with CORS headers
 */
export function streamResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
