/**
 * HTTP response helpers
 */

import { CORS_HEADERS } from '../config/constants';

export function jsonResponse(data: any, status: number = 200): Response {
  return Response.json(data, {
    status,
    headers: CORS_HEADERS,
  });
}

export function successResponse(message: string, data: Record<string, any> = {}): Response {
  return jsonResponse({
    success: true,
    message,
    ...data,
  });
}

export function errorResponse(message: string, details: string | null = null, status: number = 500): Response {
  const response: Record<string, any> = {
    error: message,
  };

  if (details) {
    response.details = details;
  }

  return jsonResponse(response, status);
}

export function corsPreflightResponse(): Response {
  return new Response('ok', { headers: CORS_HEADERS });
}
