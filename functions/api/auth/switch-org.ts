import { apiError } from '../../lib/response';
import type { Env } from '../../lib/types';
import { getSsoService } from '../../lib/sso-client';

interface SwitchOrgBody {
  org_id: string;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
  data?: Record<string, unknown>;
}): Promise<Response> {
  const { request, env } = context;

  let body: SwitchOrgBody;
  try {
    body = await request.json() as SwitchOrgBody;
  } catch {
    return apiError(400, 'INVALID_JSON', 'Invalid JSON body', request);
  }

  if (!body.org_id) {
    return apiError(400, 'MISSING_FIELDS', 'org_id is required', request);
  }

  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.replace('Bearer ', '');
  if (!accessToken) {
    return apiError(401, 'UNAUTHORIZED', 'Access token required', request);
  }

  const ip = request.headers.get('CF-Connecting-IP') || undefined;
  const ua = request.headers.get('User-Agent') || undefined;

  try {
    const ssoService = getSsoService(env);

    // Call RPC method directly
    const result = await ssoService.switchOrg({
      access_token: accessToken,
      org_id: body.org_id,
      ip,
      ua,
    });

    // Return raw SwitchOrgResponse (auth-client expects { access_token, org_id, roles })
    const requestId = crypto.randomUUID();
    const origin = request.headers.get('Origin') ?? null;
    const { getCorsHeaders } = await import('../../lib/cors');

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...getCorsHeaders(origin),
    });

    // Set new refresh_token as HttpOnly cookie (org switch always rotates token)
    if (result.refresh_token) {
      headers.append(
        'Set-Cookie',
        `refresh_token=${result.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
      );
    }

    // Remove refresh_token from response body (it's in the cookie)
    const responseData = { access_token: result.access_token, org_id: result.org_id, roles: result.roles };

    // Return raw response
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    const errMsg = err?.message ?? 'Failed to switch organization';
    console.error('[SwitchOrg] RPC error:', err);

    if (errMsg.includes('not found')) {
      return apiError(404, 'ORG_NOT_FOUND', 'Organization not found', request);
    }

    if (errMsg.includes('not a member')) {
      return apiError(403, 'NOT_A_MEMBER', 'You are not a member of this organization', request);
    }

    return apiError(500, 'SWITCH_ORG_FAILED', errMsg, request);
  }
}
