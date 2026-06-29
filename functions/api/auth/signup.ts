import { createLogger } from '../../lib/logger';
import { apiError, apiSuccess } from '../../lib/response';

const logger = createLogger('auth-signup');

/**
 * POST /api/auth/signup
 *
 * Creates user, org, membership via sso-worker RPC
 * sso-worker handles email sending internally
 */
export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json() as any;
    const { email, password, org_name, role, redirect_url } = body;

    if (!email || !password || !org_name || !role) {
      return apiError(400, 'VALIDATION_ERROR', 'email, password, org_name, and role are required');
    }

    // Call sso-worker via RPC for signup (email sent internally by sso-worker)
    const ssoResult = await env.SSO_SERVICE.signup({
      email,
      password,
      org_name,
      role,
      redirect_url
    });

    if (!ssoResult.success) {
      return apiError(400, 'SIGNUP_FAILED', ssoResult.error || 'Signup failed');
    }

    return apiSuccess({
      user: ssoResult.user,
      access_token: ssoResult.access_token,
      refresh_token: ssoResult.refresh_token,
      org: ssoResult.org,
      email_sent: ssoResult.email_sent
    });

  } catch (error) {
    logger.error('Signup error', error as Error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}
