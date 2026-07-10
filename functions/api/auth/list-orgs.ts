import { apiError } from '../../lib/response';
import type { Env } from '../../lib/types';

export async function onRequestGet(context: {
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

  try {
    const ssoService = env.SSO_SERVICE as any;

    // Call RPC method directly
    const result = await ssoService.listOrgs(accessToken);

    // Return raw ListOrgsResponse (auth-client expects { organizations: [...] })
    const requestId = crypto.randomUUID();
    const origin = request.headers.get('Origin') ?? null;
    const { getCorsHeaders } = await import('../../lib/cors');

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...getCorsHeaders(origin),
    });

    // Return raw response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    const errMsg = err?.message ?? 'Failed to list organizations';
    console.error('[ListOrgs] RPC error:', err);

    if (errMsg.includes('invalid') || errMsg.includes('expired')) {
      return apiError(401, 'INVALID_TOKEN', 'Invalid or expired access token', request);
    }

    return apiError(500, 'LIST_ORGS_FAILED', errMsg, request);
  }
}
