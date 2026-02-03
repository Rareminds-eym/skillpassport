/**
 * OTP API - Pages Function
 * Handles OTP generation, sending via AWS SNS, and verification
 * 
 * Endpoints:
 * - POST /send - Send OTP to phone number
 * - POST /verify - Verify OTP
 * - POST /resend - Resend OTP
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse, createSupabaseClient } from '../../../src/functions-lib';
import { sendOtpHandler } from './handlers/send';
import { verifyOtpHandler } from './handlers/verify';
import { resendOtpHandler } from './handlers/resend';

// ==================== MAIN HANDLER ====================

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Health check
    if (path === '/api/otp' || path === '/api/otp/') {
      if (request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          service: 'otp-api',
          endpoints: ['/send', '/verify', '/resend'],
          timestamp: new Date().toISOString()
        });
      }
    }

    // Only POST requests for OTP operations
    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    const body = await request.json().catch(() => ({}));
    const supabase = createSupabaseClient(env);

    // Parse path: /api/otp/send, /api/otp/verify, /api/otp/resend
    const pathParts = path.replace('/api/otp', '').split('/').filter(Boolean);

    if (pathParts.length === 0) {
      return jsonResponse({ success: false, error: 'Endpoint required' }, 400);
    }

    const endpoint = pathParts[0];

    // Route handlers
    switch (endpoint) {
      case 'send':
        return await sendOtpHandler(body, env, supabase);

      case 'verify':
        return await verifyOtpHandler(body, env, supabase);

      case 'resend':
        return await resendOtpHandler(body, env, supabase);

      default:
        return jsonResponse({ success: false, error: 'Not found' }, 404);
    }
  } catch (error: any) {
    console.error('OTP API Error:', error);
    return jsonResponse(
      { success: false, error: error.message || 'Internal server error' },
      500
    );
  }
};
