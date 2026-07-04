import { apiError } from '../../lib/response';
import type { Env } from '../../lib/types';

export async function onRequestPost(context: {
  request: Request;
  env: Env;
  data?: Record<string, unknown>;
}): Promise<Response> {
  const { request, env } = context;

  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.replace('Bearer ', '');
  if (!accessToken) {
    return apiError(401, 'UNAUTHORIZED', 'Access token required', request);
  }

  const ip = request.headers.get('CF-Connecting-IP') || undefined;
  const ua = request.headers.get('User-Agent') || undefined;

  try {
    const ssoService = env.SSO_SERVICE as any;

    // Call RPC method directly
    const result = await ssoService.logoutSession({
      access_token: accessToken,
      ip,
      ua,
    });

    // Clear the refresh_token cookie and return success
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    // Clear refresh_token cookie by setting Max-Age=0
    headers.append(
      'Set-Cookie',
      `refresh_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    const errMsg = err?.message ?? 'Logout failed';
    console.error('[Logout] RPC error:', err);

    return apiError(500, 'LOGOUT_FAILED', errMsg, request);
  }
}
