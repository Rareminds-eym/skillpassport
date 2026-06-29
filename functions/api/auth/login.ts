import { createLogger } from '../../lib/logger';
import { apiSuccess, apiError } from '../../lib/response';

const logger = createLogger('auth-login');

/**
 * POST /api/auth/login
 * 
 * Authenticates user via sso-worker RPC
 */
export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json() as any;
    const { email, password } = body;

    if (!email || !password) {
      return apiError(400, 'VALIDATION_ERROR', 'email and password are required');
    }

    // Call sso-worker via RPC for login
    const ssoResult = await env.SSO_SERVICE.login({
      email,
      password,
      ip: request.headers.get('CF-Connecting-IP') || undefined,
      ua: request.headers.get('User-Agent') || undefined
    });

    if (!ssoResult.success) {
      return apiError(401, 'AUTH_FAILED', ssoResult.error || 'Login failed');
    }

    return apiSuccess({
      access_token: ssoResult.access_token,
      refresh_token: ssoResult.refresh_token
    });

  } catch (error) {
    logger.error('Login error', error as Error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error');
  }
}
