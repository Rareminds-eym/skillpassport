// @public-endpoint: Pre-auth reset completion; the reset token is the gate, not a session. (RBAC guard-matrix, task 11.1/11.4; CC-2)
/**
 * Password Reset Completion API (SkillPassport Proxy)
 * POST /api/auth/reset-password
 * 
 * Calls SSO Worker via RPC to complete password reset
 */

import { z } from 'zod';
import { createLogger } from '../../lib/logger';
import { apiError, apiSuccess } from '../../lib/response';

const logger = createLogger('auth-reset-password');

const resetPasswordSchema = z.object({
  token: z.string({ message: 'token is required' })
    .trim()
    .min(1, 'token is required'),
  password: z.string({ message: 'password is required' })
    .trim()
    .min(1, 'password is required')
});

type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  const { request, env } = context;

  try {
    // Parse request body and validate using Zod
    let body: ResetPasswordRequest;
    try {
      const parsed = await request.json();
      const result = resetPasswordSchema.safeParse(parsed);
      if (!result.success) {
        return apiError(400, 'VALIDATION_ERROR', result.error.issues[0].message, request);
      }
      body = result.data;
    } catch (error) {
      logger.error('Invalid JSON in reset password request', error as Error);
      return apiError(400, 'INVALID_JSON', 'Invalid JSON payload', request);
    }

    logger.info('Processing reset password request via service binding');

    // Check if SSO service binding is available
    if (!env.SSO_SERVICE) {
      logger.error('SSO service binding not configured');
      return apiError(500, 'SERVICE_UNAVAILABLE', 'SSO service not available', request);
    }

    // Call SSO Worker via RPC
    try {
      const ssoResult = await env.SSO_SERVICE.resetPassword({
        token: body.token,
        password: body.password
      });

      if (!ssoResult.success) {
        return apiError(400, 'RESET_FAILED', ssoResult.error || 'Failed to reset password', request);
      }

      logger.info('Password reset completed successfully');

      return apiSuccess({
        reset: true,
        message: 'Password reset successfully'
      }, request);
    } catch (ssoError: any) {
      logger.error('SSO Worker reset password failed', ssoError);
      return apiError(400, 'SSO_ERROR', ssoError.message || 'Failed to reset password', request);
    }

  } catch (error) {
    logger.error('Error processing reset password request', error as Error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
}
