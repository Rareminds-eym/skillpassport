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
 * Pure RPC call to SSO Worker signup method.
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

    // Call SSO Worker signup endpoint via HTTP fetch (service binding)
    const ssoRequest = new Request('http://sso-service/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': request.headers.get('Origin') || request.headers.get('Referer') || 'http://localhost:5173',
        'CF-Connecting-IP': request.headers.get('CF-Connecting-IP') || '',
        'User-Agent': request.headers.get('User-Agent') || '',
      },
      body: JSON.stringify({
        email,
        password,
        org_name: org_name || null,
        role,
        redirect_url
      })
    });

    const ssoResponse = await env.SSO_SERVICE.fetch(ssoRequest);

    // Log response for debugging
    const responseText = await ssoResponse.text();
    console.log('[Signup] SSO response status:', ssoResponse.status);
    console.log('[Signup] SSO response body:', responseText.substring(0, 500));

    let ssoResult: any;
    try {
      ssoResult = JSON.parse(responseText);
    } catch (parseError) {
      apiLogger.error('Failed to parse SSO response', {
        status: ssoResponse.status,
        body: responseText.substring(0, 200)
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication service returned invalid response'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle error response
    if (!ssoResponse.ok || !ssoResult.access_token) {
      const errorMsg = ssoResult?.message || ssoResult?.error || 'Signup failed';
      apiLogger.warn('Signup failed from SSO', { email, error: errorMsg, status: ssoResponse.status });
      return new Response(JSON.stringify({
        success: false,
        error: errorMsg
      }), {
        status: ssoResponse.status || 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract refresh token from Set-Cookie header
    const setCookieHeader = ssoResponse.headers.get('Set-Cookie');
    let refreshToken: string | null = null;

    if (setCookieHeader) {
      const match = setCookieHeader.match(/refresh_token=([^;]+)/);
      if (match) {
        refreshToken = match[1];
      }
    }

    // Set refresh token as HTTP-Only cookie
    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    if (refreshToken) {
      headers.append(
        'Set-Cookie',
        `refresh_token=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
      );
    }

    apiLogger.info('Signup successful via HTTP', { email, userId: ssoResult.user?.id, orgId: ssoResult.org?.id });

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
