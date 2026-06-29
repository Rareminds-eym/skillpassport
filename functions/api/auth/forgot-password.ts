// @public-endpoint: Pre-auth password reset request; the user is not yet authenticated. (RBAC guard-matrix, task 11.1/11.4; CC-2)
/**
 * Password Reset Request API (SkillPassport Proxy)
 * POST /api/auth/forgot-password
 *
 * Calls SSO Worker via RPC for token generation and email sending
 */

import { z } from 'zod';
import { createLogger } from '../../lib/logger';
import { apiError, apiSuccess } from '../../lib/response';

const logger = createLogger('auth-forgot-password');

const forgotPasswordSchema = z.object({
  email: z.string({ message: 'email is required' })
    .trim()
    .min(1, 'email is required')
    .email('Invalid email format'),
  redirect_url: z.string().trim().optional(),
});

type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  const { request, env } = context;

  try {
    // Parse request body and validate using Zod
    let body: ForgotPasswordRequest;
    try {
      const parsed = await request.json();
      const result = forgotPasswordSchema.safeParse(parsed);
      if (!result.success) {
        return apiError(400, 'VALIDATION_ERROR', result.error.issues[0].message);
      }
      body = result.data;
    } catch (error) {
      logger.error('Invalid JSON in forgot password request', error as Error);
      return apiError(400, 'INVALID_JSON', 'Invalid JSON payload');
    }

    logger.info('Processing forgot password request via service binding', {
      email: body.email
    });

    // Check if SSO service binding is available
    if (!env.SSO_SERVICE) {
      logger.error('SSO service binding not configured');
      return apiError(500, 'SERVICE_UNAVAILABLE', 'SSO service not available');
    }

    // Call SSO Worker via RPC (email sent internally by sso-worker)
    try {
      const ssoResult = await env.SSO_SERVICE.forgotPassword({
        email: body.email,
        redirect_url: body.redirect_url
      }, request.headers.get("CF-Connecting-IP") ?? undefined, request.headers.get("User-Agent") ?? undefined);

      if (!ssoResult.success) {
        return apiError(400, 'FORGOT_PASSWORD_FAILED', ssoResult.error || 'Failed to process password reset request');
      }

      logger.info('Password reset request processed successfully', {
        email: body.email
      });

      return apiSuccess({
        message: ssoResult.message || 'If an account exists, a reset email has been sent.'
      });
    } catch (ssoError: any) {
      logger.error('SSO Worker forgot password failed', ssoError);
      return apiError(400, 'SSO_ERROR', ssoError.message || 'Failed to process password reset request');
    }

  } catch (error) {
    logger.error('Error processing forgot password request', error as Error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}
