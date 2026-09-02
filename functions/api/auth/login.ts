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
 * Returns access token in body and response headers only.
 * Refresh token is handled implicitly via auth-core + SSO RPC.
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

    // Generate correlation ID for RPC tracing
    const correlationId = crypto.randomUUID();

    // Call RPC method directly on SSO Worker
    const ssoResult = await (env.SSO_SERVICE as any).login({
      correlationId,
      email,
      password
    });

    // Handle RPC outcomes based on 'kind' field
    if (!ssoResult || ssoResult.kind !== 'issued') {
      let errorMsg = 'Login failed';
      let status = 401;

      if (ssoResult?.kind === 'rejected') {
        switch (ssoResult.code) {
          case 'invalid_credentials':
            errorMsg = 'Invalid email or password';
            status = 401;
            break;
          case 'account_blocked':
            errorMsg = 'Account is blocked';
            status = 403;
            break;
          default:
            errorMsg = 'Login failed';
            status = 400;
        }
      } else if (ssoResult?.kind === 'rate_limited') {
        errorMsg = 'Too many attempts. Please try again later';
        status = 429;
      } else if (ssoResult?.kind === 'unavailable') {
        errorMsg = 'Service temporarily unavailable';
        status = 503;
      }

      apiLogger.warn('Login failed from SSO', { email, kind: ssoResult?.kind, code: (ssoResult as any)?.code });
      return new Response(JSON.stringify({
        success: false,
        error: errorMsg
      }), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract session from successful RPC response
    const session = ssoResult.session;
    if (!session?.accessToken || !session?.refreshToken) {
      apiLogger.error('Missing tokens in RPC response', { email });
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication succeeded but tokens missing'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    // Set access token as header for in-memory client storage
    if (session.accessToken) {
      headers.set('X-Access-Token', session.accessToken);
    }

    // Set refresh token as HttpOnly cookie for auth-core implicit refresh
    if (session.refreshToken) {
      // Note: Secure flag omitted for localhost development (HTTP); production should use Secure
      headers.append(
        'Set-Cookie',
        `refresh_token=${session.refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
      );
    }

    apiLogger.info('Login successful via RPC', { email, userId: session.identity.subject });

    // Return response body with session data
    return new Response(JSON.stringify({
      success: true,
      access_token: session.accessToken,
      user: {
        id: session.identity.subject,
        email: session.identity.email
      },
      active_org_id: session.identity.orgId,
      organizations: [{ org_id: session.identity.orgId }]
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
