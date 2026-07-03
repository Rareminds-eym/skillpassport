import { createLogger } from '../../lib/logger';
import { apiSuccess, apiError } from '../../lib/response';

const logger = createLogger('auth-verify-email');

/**
 * POST /api/auth/verify-email
 * 
 * Verifies email via sso-worker RPC
 */
export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json() as any;
    const { token } = body;

    if (!token) {
      return apiError(400, 'VALIDATION_ERROR', 'token is required', request);
    }

    // Call sso-worker via RPC for email verification
    const ssoResult = await env.SSO_SERVICE.verifyEmail({ token });

    if (!ssoResult.success) {
      return apiError(400, 'VERIFY_FAILED', ssoResult.error || 'Email verification failed', request);
    }

    return apiSuccess({ verified: true }, request);

  } catch (error) {
    logger.error('Verify email error', error as Error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
}
