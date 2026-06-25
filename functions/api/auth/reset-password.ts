// @public-endpoint: Pre-auth reset completion; the reset token is the gate, not a session. (RBAC guard-matrix, task 11.1/11.4; CC-2)
/**
 * Password Reset Completion API (SkillPassport Proxy)
 * POST /api/auth/reset-password
 * 
 * Calls SSO Worker via service binding to complete password reset
 */

import { z } from 'zod';
import { apiLogger } from '../../lib/logger';
import { jsonResponse } from '../../lib/response';
import type { Env } from '../../lib/types';

const resetPasswordSchema = z.object({
  token: z.string({ message: 'token is required' })
    .trim()
    .min(1, 'token is required'),
  password: z.string({ message: 'password is required' })
    .trim()
    .min(1, 'password is required')
});

const ssoResponseSchema = z.object({
  reset: z.boolean().optional()
});

type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    // Parse request body and validate using Zod
    let body: ResetPasswordRequest;
    try {
      const parsed = await request.json();
      const result = resetPasswordSchema.safeParse(parsed);
      if (!result.success) {
        return jsonResponse({
          success: false,
          error: result.error.issues[0].message
        }, 400);
      }
      body = result.data;
    } catch (error) {
      apiLogger.error('Invalid JSON in reset password request', error as Error);
      return jsonResponse({
        success: false,
        error: 'Invalid JSON payload'
      }, 400);
    }

    apiLogger.info('Processing reset password request via service binding');

    // Check if SSO service binding is available
    if (!env.SSO_SERVICE) {
      apiLogger.error('SSO service binding not configured');
      return jsonResponse({
        success: false,
        error: 'SSO service not available'
      }, 500);
    }

    // Call SSO Worker via service binding using True RPC
    try {
      const result = await env.SSO_SERVICE.resetPassword({
        token: body.token,
        password: body.password
      }, request.headers.get("CF-Connecting-IP") ?? undefined, request.headers.get("User-Agent") ?? undefined);

      apiLogger.info('Password reset completed successfully');

      return jsonResponse({
        success: true,
        reset: result.reset ?? true,
        message: 'Password reset successfully'
      });
    } catch (ssoError: any) {
      apiLogger.error('SSO Worker reset password failed', ssoError);

      return jsonResponse({
        success: false,
        error: ssoError.message || 'Failed to reset password'
      }, 400);
    }



  } catch (error) {
    apiLogger.error('Error processing reset password request', error as Error);

    return jsonResponse({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
}
