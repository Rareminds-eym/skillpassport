import { apiError } from '../../lib/response';
import { createRefreshCookie } from '../../lib/cookies';
import type { Env } from '../../lib/types';
import { getSsoService } from '../../lib/sso-client';

interface RefreshBody {
  refresh_token?: string;
}

/**
 * POST /api/auth/refresh
 *
 * Refresh access token using refresh_token from cookie or body.
 * Called implicitly by auth-core when access token is expired.
 */
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

  // Get refresh token from body or X-Refresh-Token header
  let refreshToken = body.refresh_token || request.headers.get('X-Refresh-Token');

  // If not in body/header, try to read from cookie
  if (!refreshToken) {
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const refreshCookie = cookies.find(c => c.startsWith('refresh_token='));
      if (refreshCookie) {
        refreshToken = refreshCookie.substring('refresh_token='.length);
      }
    }
  }

  if (!refreshToken) {
    return apiError(401, 'MISSING_REFRESH_TOKEN', 'Refresh token required', request);
  }

  const ip = request.headers.get('CF-Connecting-IP') || undefined;
  const ua = request.headers.get('User-Agent') || undefined;

  try {
    const ssoService = getSsoService(env);

    // Call RPC method to refresh
    const result = await ssoService.refreshSession(refreshToken, ip, ua);

    const requestId = crypto.randomUUID();
    const origin = request.headers.get('Origin') ?? null;
    const { getCorsHeaders } = await import('../../lib/cors');

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...getCorsHeaders(origin),
    });

    // Set X-Access-Token header for client
    if (result.access_token) {
      headers.set('X-Access-Token', result.access_token);
    }

    // Set new refresh_token as HttpOnly cookie
    if (result.refresh_token) {
      headers.append('Set-Cookie', createRefreshCookie(result.refresh_token, request, env));
    }

    // Return new tokens
    return new Response(JSON.stringify({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    }), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    const errMsg = err?.message ?? 'Token refresh failed';
    console.error('[Refresh] RPC error:', err);

    if (errMsg.includes('expired') || errMsg.includes('invalid')) {
      return apiError(401, 'INVALID_REFRESH_TOKEN', errMsg, request);
    }

    if (errMsg.includes('Refresh token reuse detected')) {
      return apiError(401, 'TOKEN_THEFT_DETECTED', errMsg, request);
    }

    return apiError(500, 'REFRESH_FAILED', errMsg, request);
  }
}
