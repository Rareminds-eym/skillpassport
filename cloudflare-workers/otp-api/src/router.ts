/**
 * Router for OTP API
 */

import { resendOtp } from './handlers/resend';
import { sendOtp } from './handlers/send';
import { verifyOtp } from './handlers/verify';
import { Env } from './types';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Health check
    if (path === '/health' || path === '/') {
      return jsonResponse({ status: 'ok', service: 'otp-api' });
    }

    // Only POST requests for OTP operations
    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    const body = await request.json().catch(() => ({}));

    // Route handlers
    switch (path) {
      case '/send':
      case '/otp/send':
        return await sendOtp(body, env);

      case '/verify':
      case '/otp/verify':
        return await verifyOtp(body, env);

      case '/resend':
      case '/otp/resend':
        return await resendOtp(body, env);

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
}
