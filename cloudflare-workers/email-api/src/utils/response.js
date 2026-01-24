/**
 * HTTP response helpers
 */

import { CORS_HEADERS } from '../config/constants.js';

export function jsonResponse(data, status = 200) {
  return Response.json(data, {
    status,
    headers: CORS_HEADERS,
  });
}

export function successResponse(message, data = {}) {
  return jsonResponse({
    success: true,
    message,
    ...data,
  });
}

export function errorResponse(message, details = null, status = 500) {
  const response = {
    error: message,
  };

  if (details) {
    response.details = details;
  }

  return jsonResponse(response, status);
}

export function corsPreflightResponse() {
  return new Response('ok', { headers: CORS_HEADERS });
}
