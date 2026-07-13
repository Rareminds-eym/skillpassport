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
    console.log('[verify-email] Request received');

    const body = await request.json() as any;
    const { token } = body;

    console.log('[verify-email] Token:', token ? `${token.substring(0, 8)}...` : 'missing');

    if (!token) {
      console.error('[verify-email] ❌ Token missing');
      return apiError(400, 'VALIDATION_ERROR', 'token is required', request);
    }

    // Check if SSO_SERVICE binding exists
    if (!env.SSO_SERVICE) {
      console.error('[verify-email] ❌ SSO_SERVICE binding not found in env:', {
        availableBindings: Object.keys(env).filter(k => k.includes('SSO') || k.includes('SERVICE'))
      });
      return apiError(500, 'INTERNAL_ERROR', 'SSO service not configured. Please contact support.', request);
    }

    console.log('[verify-email] Calling SSO_SERVICE.verifyEmail() RPC method...');

    // Call sso-worker RPC method for email verification
    const ssoService = env.SSO_SERVICE as any;
    const ssoResult = await ssoService.verifyEmail({
      token,
      ip: request.headers.get('CF-Connecting-IP') || undefined,
      ua: request.headers.get('User-Agent') || undefined,
    });

    console.log('[verify-email] SSO RPC result:', ssoResult);

    if (!ssoResult.success) {
      console.error('[verify-email] ❌ Verification failed:', ssoResult.error);
      return apiError(400, 'VERIFY_FAILED', ssoResult.error || 'Email verification failed', request);
    }

    console.log('[verify-email] ✓ Email verified successfully');
    return apiSuccess({ verified: true, ...ssoResult }, request);

  } catch (error) {
    console.error('[verify-email] ❌ Exception:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    logger.error('Verify email error', error as Error);
    return apiError(500, 'INTERNAL_ERROR', `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, request);
  }
}
