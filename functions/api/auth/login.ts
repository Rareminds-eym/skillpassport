import type { Env } from '../../lib/types';
import { apiLogger } from '../../lib/logger';

interface LoginBody {
  email: string;
  password: string;
}

/**
 * POST /api/auth/login
 *
 * Pure RPC call to SSO Worker login method.
 * Sets refresh token as HTTP-Only cookie and returns access token.
 */
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json() as LoginBody;
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'email and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if SSO_SERVICE RPC binding exists
    if (!env.SSO_SERVICE) {
      apiLogger.error('SSO_SERVICE binding not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication service unavailable'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ip = request.headers.get('CF-Connecting-IP') || undefined;
    const ua = request.headers.get('User-Agent') || undefined;

    // Call RPC method directly on SSO Worker
    const ssoResult = await (env.SSO_SERVICE as any).login({
      email,
      password,
      ip,
      ua
    });

    // Handle RPC error response
    if (!ssoResult || !ssoResult.success) {
      const errorMsg = ssoResult?.error || 'Login failed';
      apiLogger.warn('Login failed from SSO', { email, error: errorMsg });
      return new Response(JSON.stringify({
        success: false,
        error: errorMsg
      }), {
        status: ssoResult?.status || 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify tokens present
    if (!ssoResult.access_token || !ssoResult.refresh_token) {
      apiLogger.error('Missing tokens in RPC response', { email });
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication succeeded but tokens missing'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set refresh token as HTTP-Only cookie
    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    headers.append(
      'Set-Cookie',
      `refresh_token=${ssoResult.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
    );

    apiLogger.info('Login successful via RPC', { email, userId: ssoResult.user?.id });

    // Return access token to frontend (refresh token in cookie)
    return new Response(JSON.stringify({
      success: true,
      access_token: ssoResult.access_token,
      user: ssoResult.user,
      active_org_id: ssoResult.active_org_id,
      organizations: ssoResult.organizations
    }), {
      status: 200,
      headers
    });

  } catch (error: any) {
    apiLogger.error('Login RPC call failed', error as Error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
