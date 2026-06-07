// @public-endpoint: Pre-auth OTP send/verify/resend used during signup/login. (RBAC guard-matrix, task 11.1/11.4; CC-2)
/**
 * OTP API - Pages Function
 * Handles OTP generation, sending via AWS SNS, and verification
 * 
 * Endpoints:
 * - POST /send - Send OTP to phone number
 * - POST /verify - Verify OTP
 * - POST /resend - Resend OTP
 */

import { getCorsHeaders } from '../../lib/cors';
import { apiError, apiSuccess } from '../../lib/response';
import type { PagesFunction } from '../../lib/types';
import { resendOtpHandler } from './handlers/resend';
import { sendOtpHandler } from './handlers/send';
import { verifyOtpHandler } from './handlers/verify';
;

// ==================== MAIN HANDLER ====================

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin') || '';
    return new Response(null, {
      status: 204,
      headers: {
        ...getCorsHeaders(origin),
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Health check
    if (path === '/api/otp' || path === '/api/otp/') {
      if (request.method === 'GET') {
        return apiSuccess({
          status: 'ok',
          service: 'otp-api',
          endpoints: ['/send', '/verify', '/resend'],
          timestamp: new Date().toISOString()
        }, context.request);
      }
    }

    // Only POST requests for OTP operations
    if (request.method !== 'POST') {
      return apiError(405, 'ERROR', 'Method not allowed', context.request);
    }

    const body = await request.json().catch(() => ({}));

    // Parse path: /api/otp/send, /api/otp/verify, /api/otp/resend
    const pathParts = path.replace('/api/otp', '').split('/').filter(Boolean);

    if (pathParts.length === 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Endpoint required', context.request);
    }

    const endpoint = pathParts[0];

    // Route handlers
    switch (endpoint) {
      case 'send':
        return await sendOtpHandler(body as any, env);

      case 'verify':
        return await verifyOtpHandler(body as any, env);

      case 'resend':
        return await resendOtpHandler(body as any, env);

      default:
        return apiError(404, 'NOT_FOUND', 'Not found', context.request);
    }
  } catch (error: any) {
    console.error('OTP API Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Internal server error', context.request);
  }
};
