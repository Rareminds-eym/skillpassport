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
import { withAuth } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { handleGenericEmail } from './handlers/generic';
import { handleInvitationEmail } from './handlers/invitation';
import { handleCountdownEmail } from './handlers/countdown';
import { handleBulkCountdownEmail } from './handlers/bulk-countdown';
import { handleEventConfirmation, handleEventOTP } from './handlers/event-registration';
import { handlePDFReceipt } from './handlers/pdf-receipt';
import { apiLogger } from '../../lib/logger';

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
    // GET routes (PDF download and health check) — public
    if (request.method === 'GET') {
      // Health check
      if (path === '' || path === '/') {
        return jsonResponse({
          status: 'ok',
          service: 'email-api',
          endpoints: [
            '/send',
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

      const pdfMatch = path.match(/^\/download-receipt\/(.+)$/);
      if (pdfMatch) {
        const orderId = pdfMatch[1];
        const supabase = createSupabaseClient(env);
        return await handlePDFReceipt(orderId, env, supabase);
      }
      
      return jsonResponse({ success: false, error: 'Route not found' }, 404);
    }

    // Only POST requests for email operations (authenticated)
    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    // All POST email operations require authentication
    return withAuth(async (authContext: AuthenticatedContext) => {
      const env = authContext.env as Record<string, string>;

      // Parse JSON body with proper error handling
      let body;
      try {
        body = await authContext.request.json();
      } catch (error) {
        return jsonResponse({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        }, 400);
      }

      // Routes that don't need Supabase
      if (path === '/event-confirmation') {
        return await handleEventConfirmation(body, env);
      }
      
      if (path === '/event-otp') {
        return await handleEventOTP(body, env);
      }

      // Routes that need Supabase - create client only when needed
      const supabase = createSupabaseClient(env);
      
      // Route to appropriate handler
      if (path === '/invitation') {
        return await handleInvitationEmail(authContext.request, body, env, supabase);
      }
      
      if (path === '/countdown') {
        return await handleCountdownEmail(body, env, supabase);
      }
      
      if (path === '/send-bulk-countdown') {
        return await handleBulkCountdownEmail(body, env, supabase);
      }
      
      if (path === '' || path === '/' || path === '/send') {
        return await handleGenericEmail(body, env, supabase);
      }

      return jsonResponse({ success: false, error: 'Route not found' }, 404);
    })(context);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    apiLogger.error('Email API Error', error as Error);
    return jsonResponse(
      { success: false, error: errorMessage },
      500
    );
  }
};
