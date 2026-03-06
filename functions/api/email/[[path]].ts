/**
 * Email API - Cloudflare Pages Function
 * Handles all email sending operations
 * 
 * Endpoints:
 * - POST /api/email/send or / - Generic email sending
 * - POST /api/email/invitation - Organization invitation emails
 * - POST /api/email/countdown - Single countdown email
 * - POST /api/email/send-bulk-countdown - Bulk countdown emails
 * - POST /api/email/event-confirmation - Event registration confirmation
 * - POST /api/email/event-otp - OTP verification email
 * - GET /api/email/download-receipt/:orderId - Download PDF receipt
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse, createSupabaseClient } from '../../../src/functions-lib';
import { handleGenericEmail } from './handlers/generic';
import { handleInvitationEmail } from './handlers/invitation';
import { handleCountdownEmail } from './handlers/countdown';
import { handleBulkCountdownEmail } from './handlers/bulk-countdown';
import { handleEventConfirmation, handleEventOTP } from './handlers/event-registration';
import { handlePDFReceipt } from './handlers/pdf-receipt';

// ==================== MAIN HANDLER ====================

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/email', '');

  try {
    // Health check
    if (path === '' || path === '/') {
      if (request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          service: 'email-api',
          endpoints: [
            '/welcome',
            '/invitation',
            '/countdown',
            '/send-bulk-countdown',
            '/event-confirmation',
            '/event-otp',
            '/download-receipt/:orderId'
          ],
          timestamp: new Date().toISOString()
        });
      }
    }

    const supabase = createSupabaseClient(env);

    // GET routes (PDF download)
    if (request.method === 'GET') {
      const pdfMatch = path.match(/^\/download-receipt\/(.+)$/);
      if (pdfMatch) {
        const orderId = pdfMatch[1];
        return await handlePDFReceipt(orderId, env, supabase);
      }
      
      return jsonResponse({ success: false, error: 'Route not found' }, 404);
    }

    // Only POST requests for email operations
    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    const body = await request.json().catch(() => ({}));

    // Route to appropriate handler
    if (path === '/invitation') {
      return await handleInvitationEmail(body, env, supabase);
    }
    
    if (path === '/countdown') {
      return await handleCountdownEmail(body, env, supabase);
    }
    
    if (path === '/send-bulk-countdown') {
      return await handleBulkCountdownEmail(body, env, supabase);
    }
    
    if (path === '/event-confirmation') {
      return await handleEventConfirmation(body, env, supabase);
    }
    
    if (path === '/event-otp') {
      return await handleEventOTP(body, env, supabase);
    }
    
    if (path === '/' || path === '/send' || path === '/welcome') {
      return await handleGenericEmail(body, env, supabase);
    }

    return jsonResponse({ success: false, error: 'Route not found' }, 404);

  } catch (error: any) {
    console.error('Email API Error:', error);
    return jsonResponse(
      { success: false, error: error.message || 'Internal server error' },
      500
    );
  }
};
