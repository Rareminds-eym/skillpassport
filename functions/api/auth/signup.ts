import type { Env } from '../../lib/types';
import { apiLogger } from '../../lib/logger';

interface SignupBody {
  email: string;
  password: string;
  org_name?: string | null; // Optional - can be set later during onboarding
  role: string;
  redirect_url?: string;
}

/**
 * POST /api/auth/signup
 *
 * True RPC call to SSO Worker signup method.
 * Creates user, organization, and membership via RPC.
 * Sets refresh token as HTTP-Only cookie.
 */
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json() as SignupBody;
    const { email, password, org_name, role, redirect_url } = body;

    // Validate required fields (org_name is optional for deferred org setup)
    if (!email || !password || !role) {
      return new Response(JSON.stringify({
        success: false,
        error: 'email, password, and role are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Call SSO Worker signup via true RPC method
    const ssoService = env.SSO_SERVICE as any;
    const ssoResult = await ssoService.signup({
      email,
      password,
      org_name: org_name || null,
      role,
      redirect_url,
      ip: request.headers.get('CF-Connecting-IP') || undefined,
      ua: request.headers.get('User-Agent') || undefined,
    });

    // Handle error response
    if (!ssoResult.success || !ssoResult.access_token) {
      const errorMsg = ssoResult?.error || 'Signup failed';
      const status = ssoResult?.status || 400;
      apiLogger.warn('Signup failed from SSO', { email, error: errorMsg, status });
      return new Response(JSON.stringify({
        success: false,
        error: errorMsg
      }), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set refresh token as HTTP-Only cookie
    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    if (ssoResult.refresh_token) {
      headers.append(
        'Set-Cookie',
        `refresh_token=${ssoResult.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
      );
    }

    apiLogger.info('Signup successful via RPC', { email, userId: ssoResult.user?.id, orgId: ssoResult.org?.id });

    // Return access token to frontend (refresh token in cookie)
    return new Response(JSON.stringify({
      success: true,
      access_token: ssoResult.access_token,
      user: ssoResult.user,
      org: ssoResult.org,
      email_sent: ssoResult.email_sent
    }), {
      status: 200,
      headers
    });

  } catch (error: any) {
    apiLogger.error('Signup RPC call failed', error as Error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
