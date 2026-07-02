import { apiError } from '../../lib/response';
import type { Env } from '../../lib/types';

interface RefreshBody {
  refresh_token?: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
  data?: Record<string, unknown>;
}): Promise<Response> {
  const { request, env } = context;

  let body: RefreshBody;
  try {
    body = await request.json() as RefreshBody;
  } catch {
    body = {};
  }

  const refreshToken = body.refresh_token || request.headers.get('X-Refresh-Token');
  if (!refreshToken) {
    return apiError(401, 'MISSING_REFRESH_TOKEN', 'Refresh token required', request);
  }

  const ip = request.headers.get('CF-Connecting-IP') || undefined;
  const ua = request.headers.get('User-Agent') || undefined;

  try {
    const ssoService = env.SSO_SERVICE as any;

    // Call RPC method directly
    const result = await ssoService.refreshSession(refreshToken, ip, ua);

    // Return raw RefreshResponse (auth-client expects { access_token })
    const requestId = crypto.randomUUID();
    const origin = request.headers.get('Origin') ?? null;
    const { getCorsHeaders } = await import('../../lib/cors');

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...getCorsHeaders(origin),
    });

    // Set new refresh_token as HttpOnly cookie for session persistence
    if (result.refresh_token) {
      headers.append(
        'Set-Cookie',
        `refresh_token=${result.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
      );
    }

    // Return raw response (auth-client.refresh expects { access_token })
    return new Response(JSON.stringify(result), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    const errMsg = err?.message ?? 'Token refresh failed';
    console.error('[Refresh] RPC error:', err);

    if (errMsg.includes('expired') || errMsg.includes('invalid')) {
      return apiError(401, 'INVALID_REFRESH_TOKEN', errMsg, request);
    }

    return apiError(500, 'REFRESH_FAILED', errMsg, request);
  }
}
