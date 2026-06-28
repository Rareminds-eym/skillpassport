// @public-endpoint: Pre-auth password reset request; the user is not yet authenticated. (RBAC guard-matrix, task 11.1/11.4; CC-2)
/**
 * Password Reset Request API (SkillPassport Proxy)
 * POST /api/auth/forgot-password
 * 
 * Calls SSO Worker via service binding, then sends beautiful email template
 */

import { z } from 'zod';
import { apiLogger } from '../../lib/logger';
import { jsonResponse } from '../../lib/response';
import type { Env } from '../../lib/types';

const forgotPasswordSchema = z.object({
  email: z.string({ message: 'email is required' })
    .trim()
    .min(1, 'email is required')
    .email('Invalid email format'),
  redirect_url: z.string().trim().optional(),
});

type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    // Parse request body and validate using Zod
    let body: ForgotPasswordRequest;
    try {
      const parsed = await request.json();
      const result = forgotPasswordSchema.safeParse(parsed);
      if (!result.success) {
        return jsonResponse({
          success: false,
          error: result.error.issues[0].message
        }, 400);
      }
      body = result.data;
    } catch (error) {
      apiLogger.error('Invalid JSON in forgot password request', error as Error);
      return jsonResponse({
        success: false,
        error: 'Invalid JSON payload'
      }, 400);
    }

    apiLogger.info('Processing forgot password request via service binding', {
      email: body.email
    });

    // Check if SSO service binding is available
    if (!env.SSO_SERVICE) {
      apiLogger.error('SSO service binding not configured');
      return jsonResponse({
        success: false,
        error: 'SSO service not available'
      }, 500);
    }

    // Call SSO Worker via service binding using True RPC
    // SSO Worker will handle token generation and call back to SkillPassport for email template
    try {
      const result = await env.SSO_SERVICE.forgotPassword({
        email: body.email,
        redirect_url: body.redirect_url
      }, request.headers.get("CF-Connecting-IP") ?? undefined, request.headers.get("User-Agent") ?? undefined);

      apiLogger.info('Password reset request processed successfully', {
        email: body.email
      });

      return jsonResponse({
        success: true,
        message: result.message || 'If an account exists, a reset email has been sent.'
      });
    } catch (ssoError: any) {
      apiLogger.error('SSO Worker forgot password failed', ssoError);

      return jsonResponse({
        success: false,
        error: ssoError.message || 'Failed to process password reset request'
      }, 400);
    }

  } catch (error) {
    apiLogger.error('Error processing forgot password request', error as Error);

    return jsonResponse({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
}
