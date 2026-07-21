import type { Env } from './types';

const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function getCookieDomain(request: Request, env: { COOKIE_DOMAIN?: string }): string | null {
  if (env.COOKIE_DOMAIN) return env.COOKIE_DOMAIN;
  if (isLocalHttpRequest(request)) return null;

  try {
    const hostname = new URL(request.url).hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join('.')}`;
    }
  } catch {
    // Ignore invalid URL
  }

  return null;
}

export function createRefreshCookie(
  refreshToken: string,
  request: Request,
  env: { COOKIE_DOMAIN?: string }
): string {
  const parts = [
    `refresh_token=${refreshToken}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${REFRESH_MAX_AGE_SECONDS}`,
  ];

  if (!isLocalHttpRequest(request)) {
    parts.splice(3, 0, 'Secure');
    const domain = getCookieDomain(request, env);
    if (domain) {
      parts.push(`Domain=${domain}`);
    }
  }

  return parts.join('; ');
}

export function clearRefreshCookie(request: Request, env: { COOKIE_DOMAIN?: string }): string {
  const domain = getCookieDomain(request, env);
  const domainSuffix = domain ? `; Domain=${domain}` : '';
  return `refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${domainSuffix}`;
}

function isLocalHttpRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
}
