// @admin-endpoint: Admin-only operation to reset user password
/**
 * Admin Reset Password API (SkillPassport Proxy)
 * POST /api/auth/admin-reset-password
 *
 * Calls SSO Worker via service binding to reset a user's password (admin operation)
 */

import { z } from 'zod';
import { apiLogger } from '../../lib/logger';
import { jsonResponse } from '../../lib/response';
import type { Env } from '../../lib/types';

const adminResetPasswordSchema = z.object({
  user_id: z.string({ message: 'user_id is required' })
    .trim()
    .min(1, 'user_id is required'),
  new_password: z.string({ message: 'new_password is required' })
    .trim()
    .min(1, 'new_password is required')
});

type AdminResetPasswordRequest = z.infer<typeof adminResetPasswordSchema>;

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    // Parse request body and validate using Zod
    let body: AdminResetPasswordRequest;
    try {
      const parsed = await request.json();
      const result = adminResetPasswordSchema.safeParse(parsed);
      if (!result.success) {
        return jsonResponse({
          success: false,
          error: result.error.issues[0].message
        }, 400);
      }
      body = result.data;
    } catch (error) {
      apiLogger.error('Invalid JSON in admin reset password request', error as Error);
      return jsonResponse({
        success: false,
        error: 'Invalid JSON payload'
      }, 400);
    }

    apiLogger.info('Processing admin reset password request via service binding');

    // Check if SSO service binding is available
    if (!env.SSO_SERVICE) {
      apiLogger.error('SSO service binding not configured');
      return jsonResponse({
        success: false,
        error: 'SSO service not available'
      }, 500);
    }

    // Extract access token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken) {
      return jsonResponse({
        success: false,
        error: 'Access token required'
      }, 401);
    }

    // Call SSO Worker via service binding using True RPC
    try {
      const result = await env.SSO_SERVICE.adminResetPassword({
        user_id: body.user_id,
        new_password: body.new_password,
        access_token: accessToken,
        ip: request.headers.get('CF-Connecting-IP') ?? undefined,
        ua: request.headers.get('User-Agent') ?? undefined,
      });

      apiLogger.info('Admin password reset completed successfully');

      return jsonResponse({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (ssoError: any) {
      apiLogger.error('SSO Worker admin reset password failed', ssoError);

      return jsonResponse({
        success: false,
        error: ssoError.message || 'Failed to reset password'
      }, 400);
    }

  } catch (error) {
    apiLogger.error('Error processing admin reset password request', error as Error);

    return jsonResponse({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
}
