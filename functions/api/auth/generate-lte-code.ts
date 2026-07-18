import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { ssoGenerateAuthorizationCode } from '../../lib/sso-client';
import type { Env } from '../../lib/types';

interface GenerateLteCodeResponse {
  redirectUrl: string;
  codeExpiresAt: string | null;
}

const LTE_CALLBACK_PATH = '/auth/callback';

function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

function getLteAppUrl(env: Env): string {
  const configuredUrl = env.LTE_APP_URL?.trim();
  if (!configuredUrl) {
    throw new Error('LTE_APP_URL is not configured');
  }
  return configuredUrl.replace(/\/+$/, '');
}

function buildRedirectUrl(lteAppUrl: string, code: string, state: string): string {
  const url = new URL(`${lteAppUrl}${LTE_CALLBACK_PATH}`);
  url.searchParams.set('code', code);
  url.searchParams.set('state', state);
  return url.toString();
}

function normalizeExpiry(expiresAt?: string, codeExpiresAt?: string): string | null {
  return codeExpiresAt ?? expiresAt ?? null;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext<Env>): Promise<Response> => {
  const { request, env } = context;
  const accessToken = extractBearerToken(request);

  if (!accessToken) {
    return apiError(401, 'UNAUTHORIZED', 'Access token required', request);
  }

  const lteAppUrl = getLteAppUrl(env);
  const redirectUri = `${lteAppUrl}${LTE_CALLBACK_PATH}`;
  const ip = request.headers.get('CF-Connecting-IP') ?? undefined;
  const ua = request.headers.get('User-Agent') ?? undefined;

  try {
    const result = await ssoGenerateAuthorizationCode(env, {
      accessToken,
      targetApp: 'lte',
      redirectUri,
      ip,
      ua,
    });

    if (!result.code || !result.state) {
      return apiError(502, 'SSO_CODE_GENERATION_FAILED', 'SSO did not return authorization code data', request);
    }

    const data: GenerateLteCodeResponse = {
      redirectUrl: result.redirectUrl ?? buildRedirectUrl(lteAppUrl, result.code, result.state),
      codeExpiresAt: normalizeExpiry(result.expiresAt, result.codeExpiresAt),
    };

    return apiSuccess(data, request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate LTE authorization code';

    if (message.toLowerCase().includes('entitlement') || message.toLowerCase().includes('lte')) {
      return apiError(403, 'LTE_ACCESS_REQUIRED', message, request);
    }

    return apiError(500, 'LTE_CODE_GENERATION_FAILED', message, request);
  }
});
