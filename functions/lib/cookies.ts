import { apiLogger } from './logger';
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
  } catch (err) {
    apiLogger.warn('[Cookies] Failed to parse request URL for domain extraction:', err);
  }

  return null;
}

export function createRefreshCookie(
  refreshToken: string,
  request: Request,
  env: { COOKIE_DOMAIN?: string }
): string {
  const isLocal = isLocalHttpRequest(request);
  const domain = getCookieDomain(request, env);
  const name = isLocal ? 'refresh_token' : (domain ? '__Secure-refresh_token' : '__Host-refresh_token');

  const parts = [
    `${name}=${refreshToken}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${REFRESH_MAX_AGE_SECONDS}`,
  ];

  if (!isLocal) {
    parts.push('Secure');
    if (domain) {
      parts.push(`Domain=${domain}`);
    }
  }

  return parts.join('; ');
}

export function clearRefreshCookie(request: Request, env: { COOKIE_DOMAIN?: string }): string {
  const isLocal = isLocalHttpRequest(request);
  const domain = getCookieDomain(request, env);
  const domainSuffix = domain ? `; Domain=${domain}` : '';
  const name = isLocal ? 'refresh_token' : (domain ? '__Secure-refresh_token' : '__Host-refresh_token');

  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${domainSuffix}`;
}

const REFRESH_COOKIE_CANDIDATES = [
  '__Secure-refresh_token',
  'refresh_token',
  '__Host-refresh_token',
] as const;

export function getRefreshCookie(request: Request): string | null {
  for (const candidate of REFRESH_COOKIE_CANDIDATES) {
    const val = getCookie(request, candidate);
    if (val) return val;
  }
  return null;
}

export function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rawValueParts] = part.trim().split('=');
    if (rawKey === name) {
      const rawValue = rawValueParts.join('=');
      return rawValue ? decodeURIComponent(rawValue) : '';
    }
  }

  return null;
}

function isLocalHttpRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
}
