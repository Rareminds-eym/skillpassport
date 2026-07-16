import type { Env } from '../../lib/types';
import { apiLogger } from '../../lib/logger';

interface SignupBody {
  email: string;
  password: string;
  org_name: string;
  role: string;
  redirect_url?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * POST /api/auth/signup
 *
 * Pure RPC call to SSO Worker signup method.
 * Creates user, organization, and membership via RPC.
 * Sets refresh token as HTTP-Only cookie.
 */
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json() as SignupBody;
    const { email, password, org_name, role, redirect_url, user_metadata } = body;

    if (!email || !password || !org_name || !role) {
      return new Response(JSON.stringify({
        success: false,
        error: 'email, password, org_name, and role are required'
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

    // Allow-list user_metadata to the fields the frontend actually sends,
    // stripping any unexpected keys before they reach the SSO Worker/JWT.
    const safeUserMetadata = user_metadata && typeof user_metadata === 'object'
      ? {
          firstName: typeof user_metadata.firstName === 'string' ? user_metadata.firstName : undefined,
          lastName: typeof user_metadata.lastName === 'string' ? user_metadata.lastName : undefined,
          phone: typeof user_metadata.phone === 'string' ? user_metadata.phone : undefined,
          avatarUrl: typeof user_metadata.avatarUrl === 'string' || user_metadata.avatarUrl === null ? user_metadata.avatarUrl : undefined,
        }
      : undefined;

    // Call RPC method directly on SSO Worker
    const ssoResult = await env.SSO_SERVICE.signup({
      email,
      password,
      org_name,
      role,
      redirect_url,
      user_metadata: safeUserMetadata
    });

    // Handle RPC error response
    if (!ssoResult || !ssoResult.success) {
      const errorMsg = ssoResult?.error || 'Signup failed';
      apiLogger.warn('Signup failed from SSO', { email, error: errorMsg });
      return new Response(JSON.stringify({
        success: false,
        error: errorMsg
      }), {
        status: ssoResult?.status || 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify tokens present
    if (!ssoResult.access_token || !ssoResult.refresh_token) {
      apiLogger.error('Missing tokens in signup RPC response', { email });
      return new Response(JSON.stringify({
        success: false,
        error: 'Signup succeeded but tokens missing'
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

  } catch (error: unknown) {
    apiLogger.error('Signup RPC call failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
