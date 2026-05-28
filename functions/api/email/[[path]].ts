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

import type { PagesFunction } from '../../lib/types';
import { getCorsHeaders } from '../../lib/cors';
import { createSupabaseClient } from '../../lib/supabase';;
import { apiSuccess, apiError } from '../../lib/response';
import { withAuth } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { handleGenericEmail } from './handlers/generic';
import { handleInvitationEmail } from './handlers/invitation';
import { handleCountdownEmail } from './handlers/countdown';
import { handleBulkCountdownEmail } from './handlers/bulk-countdown';
import { handleEventConfirmation, handleEventOTP } from './handlers/event-registration';
import { handlePDFReceipt } from './handlers/pdf-receipt';
import type { PagesEnv } from '../../lib/types';
import { apiLogger } from '../../lib/logger';
import type { EventConfirmationRequest, EventOTPRequest, CountdownEmailRequest, BulkCountdownEmailRequest, GenericEmailRequest, InvitationEmailRequest } from './types';

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
  const path = url.pathname.replace('/api/email', '');

  try {
    // GET routes (PDF download and health check) — public
    if (request.method === 'GET') {
      // Health check
      if (path === '' || path === '/') {
        return apiSuccess({
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
        }, request);
      }

      const pdfMatch = path.match(/^\/download-receipt\/(.+)$/);
      if (pdfMatch) {
        const orderId = pdfMatch[1];
        const supabase = createSupabaseClient(env);
        return await handlePDFReceipt(orderId, env, supabase);
      }
      
      return apiError(404, 'NOT_FOUND', 'Route not found', request);
    }

    // Only POST requests for email operations (authenticated)
    if (request.method !== 'POST') {
      return apiError(405, 'ERROR', 'Method not allowed', request);
    }

    // All POST email operations require authentication
    return withAuth(async (authContext: AuthenticatedContext) => {
      const env = authContext.env as Record<string, string>;

      // Parse JSON body with proper error handling
      let body;
      try {
        body = await authContext.request.json();
      } catch (error) {
        return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', authContext.request);
      }

      const envTyped = env as unknown as PagesEnv;

      // Routes that don't need Supabase
      if (path === '/event-confirmation') {
        return await handleEventConfirmation(body as EventConfirmationRequest, envTyped);
      }
      
      if (path === '/event-otp') {
        return await handleEventOTP(body as EventOTPRequest, envTyped);
      }

      // Routes that need Supabase - create client only when needed
      const supabase = createSupabaseClient(env);
      
      // Route to appropriate handler
      if (path === '/invitation') {
        return await handleInvitationEmail(body as InvitationEmailRequest, envTyped);
      }
      
      if (path === '/countdown') {
        return await handleCountdownEmail(body as CountdownEmailRequest, envTyped, supabase);
      }
      
      if (path === '/send-bulk-countdown') {
        return await handleBulkCountdownEmail(body as BulkCountdownEmailRequest, envTyped, supabase);
      }
      
      if (path === '' || path === '/' || path === '/send') {
        return await handleGenericEmail(body as GenericEmailRequest, envTyped, supabase);
      }

      return apiError(404, 'NOT_FOUND', 'Route not found', authContext.request);
    })(context);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    apiLogger.error('Email API Error', error as Error);
    return apiError(500, 'INTERNAL_ERROR', errorMessage, request);
  }
};
