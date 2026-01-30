/**
 * Response Utilities
 */

import { corsHeaders } from './cors';

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

export function notFoundResponse(path?: string): Response {
  return jsonResponse({ error: 'Not found', path }, 404);
}
