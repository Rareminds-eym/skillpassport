// @public-endpoint: Google OAuth 2.0 authorization-code redirect flow.
//
// Lives OUTSIDE /api/auth/* because the sso-gateway route guard rejects
// top-level navigations (Sec-Fetch-Mode) and URLs with query strings — both
// of which are inherent to the OAuth start/callback redirects.
//
// Flow:
//   GET /api/oauth/google          → 302 Google consent (state cookie set)
//   GET /api/oauth/google/callback → validate state, exchange code, fetch
//     userinfo, call SSO_SERVICE.oauthAuthenticate, set refresh cookie,
//     302 /auth/callback. Tokens never appear in any URL.

import type { Env } from '../../../lib/types';
import { APPROVED_ORIGINS } from '../../../lib/app-origins';
import { ssoOauthAuthenticate } from '../../../lib/sso-client';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

const STATE_COOKIE_NAME = '__Host-rm-oauth-state';
/** Must be Lax: Google's redirect back is a cross-site top-level navigation. */
const STATE_COOKIE_ATTRS = 'Secure; HttpOnly; Path=/; SameSite=Lax';
const STATE_MAX_AGE_SECONDS = 600;

/** Byte-identical to the sso-gateway cookie-codec policy (cookie-codec.ts). */
const REFRESH_COOKIE_NAME = '__Host-rm-refresh';
const REFRESH_COOKIE_ATTRS = 'Secure; HttpOnly; Path=/; SameSite=Strict';
const REFRESH_COOKIE_MAX_AGE_SECONDS = 604800;

const APPROVED_ORIGIN_SET = new Set(APPROVED_ORIGINS);

interface OAuthContext {
  request: Request;
  env: Env;
  params: { path?: string | string[] };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function b64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecodeToString(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return atob(padded);
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return b64urlEncode(new Uint8Array(signature));
}

async function hmacVerify(payload: string, signatureB64url: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  try {
    const signatureBytes = Uint8Array.from(b64urlDecodeToString(signatureB64url), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}

function clearStateCookie(): string {
  return `${STATE_COOKIE_NAME}=; ${STATE_COOKIE_ATTRS}; Max-Age=0`;
}

function redirect(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
}

function loginError(errorCode: string, extraCookies: string[] = []): Response {
  return redirect(`/login?oauth_error=${encodeURIComponent(errorCode)}`, [...extraCookies, clearStateCookie()]);
}

function resolveRequestPath(params: OAuthContext['params']): string {
  const path = params?.path;
  if (Array.isArray(path)) return path.join('/');
  return path ?? '';
}

function approvedOrigin(request: Request): string | null {
  let origin: string;
  try {
    origin = new URL(request.url).origin;
  } catch {
    return null;
  }
  return APPROVED_ORIGIN_SET.has(origin) ? origin : null;
}

async function fetchWithTimeout(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── GET /api/oauth/google (start) ───────────────────────────────────

export async function onRequestGet(context: OAuthContext): Promise<Response> {
  const { request, env } = context;
  const subPath = resolveRequestPath(context.params);

  if (subPath === '' || subPath === '/') return handleStart(request, env);
  if (subPath === 'callback') return handleCallback(request, env);

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleStart(request: Request, env: Env): Promise<Response> {
  if (env.GOOGLE_OAUTH_ENABLED !== 'true') {
    return loginError('disabled');
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.error(JSON.stringify({ msg: '[oauth/google] missing client credentials' }));
    return loginError('identity_error');
  }

  const origin = approvedOrigin(request);
  if (!origin) {
    return loginError('invalid_origin');
  }

  const stateSecret = env.OAUTH_STATE_SECRET || env.GOOGLE_CLIENT_SECRET;
  const nonce = crypto.randomUUID();
  const payload = b64urlEncode(new TextEncoder().encode(JSON.stringify({ n: crypto.randomUUID(), iat: Date.now(), nce: nonce })));
  const sig = await hmacSign(payload, stateSecret);
  const state = `${payload}.${sig}`;

  const googleUrl = new URL(GOOGLE_AUTH_ENDPOINT);
  googleUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  googleUrl.searchParams.set('redirect_uri', `${origin}/api/oauth/google/callback`);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);
  // Bound to the HMAC-signed state; verified against the id_token claim.
  googleUrl.searchParams.set('nonce', nonce);
  googleUrl.searchParams.set('prompt', 'select_account');

  return redirect(googleUrl.toString(), [
    `${STATE_COOKIE_NAME}=${state}; ${STATE_COOKIE_ATTRS}; Max-Age=${STATE_MAX_AGE_SECONDS}`,
  ]);
}

// ─── GET /api/oauth/google/callback ──────────────────────────────────

async function handleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.searchParams.get('error')) {
    // User cancelled consent or Google refused — nothing sensitive to log.
    return loginError('provider_error');
  }

  // ─── Validate state (CSRF + single-use + TTL) ────────────────────
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const stateCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${STATE_COOKIE_NAME}=`))
    ?.slice(STATE_COOKIE_NAME.length + 1);
  const returnedState = url.searchParams.get('code') ? url.searchParams.get('state') : null;

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    console.error(JSON.stringify({ msg: '[oauth/google] missing client credentials' }));
    return loginError('identity_error');
  }
  if (!stateCookie || !returnedState || stateCookie !== returnedState) {
    return loginError('invalid_state');
  }

  const dotIndex = stateCookie.indexOf('.');
  const payload = dotIndex > 0 ? stateCookie.slice(0, dotIndex) : '';
  const sig = dotIndex > 0 ? stateCookie.slice(dotIndex + 1) : '';
  const stateSecret = env.OAUTH_STATE_SECRET || env.GOOGLE_CLIENT_SECRET;

  let issuedAt = 0;
  let stateNonce: string | undefined;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(Uint8Array.from(b64urlDecodeToString(payload), (c) => c.charCodeAt(0)))) as { iat?: number; nce?: string };
    issuedAt = parsed.iat ?? 0;
    stateNonce = parsed.nce;
  } catch (e) {
    console.error('DBG_STATE_PARSE', String(e));
    return loginError('invalid_state');
  }
  const validSignature = payload.length > 0 && sig.length > 0 && (await hmacVerify(payload, sig, stateSecret));
  if (!validSignature) return loginError('invalid_state');
  if (!issuedAt || Date.now() - issuedAt > STATE_MAX_AGE_SECONDS * 1000) {
    return loginError('expired_state');
  }

  const origin = approvedOrigin(request);
  if (!origin) {
    return loginError('invalid_origin');
  }

  // State consumed — every response from here clears the cookie.
  const code = url.searchParams.get('code');
  if (!code) {
    return loginError('missing_code');
  }

  // ─── Exchange code for tokens ────────────────────────────────────
  let accessToken: string | undefined;
  let idToken: string | undefined;
  try {
    const tokenResponse = await fetchWithTimeout(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${origin}/api/oauth/google/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    });
    if (!tokenResponse.ok) throw new Error(`token endpoint ${tokenResponse.status}`);
    const tokenData = (await tokenResponse.json()) as { access_token?: string; id_token?: string };
    accessToken = tokenData.access_token;
    idToken = tokenData.id_token;
  } catch (err) {
    console.error(JSON.stringify({ msg: '[oauth/google] token exchange failed', err: String(err) }));
    return loginError('token_exchange_failed', [clearStateCookie()]);
  }
  if (!accessToken) {
    return loginError('token_exchange_failed', [clearStateCookie()]);
  }

  // ─── Resolve the Google profile ─────────────────────────────────
  // Preferred path (OIDC BCP / Microsoft guidance): claims from the id_token
  // returned directly by Google's token endpoint over TLS with client auth —
  // saves a full /userinfo round-trip. Signature verification is not required
  // for tokens fetched directly from the token endpoint; we still validate
  // exp/iss/aud/nonce and fail closed on any violation.
  let profile: { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string };

  const parseIdTokenClaims = (jwt: string): Record<string, unknown> | null => {
    try {
      const payloadPart = jwt.split('.')[1];
      if (!payloadPart) return null;
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(b64urlDecodeToString(payloadPart), (c) => c.charCodeAt(0)))) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const idTokenClaims = idToken ? parseIdTokenClaims(idToken) : null;
  if (idToken && !idTokenClaims) {
    console.error(JSON.stringify({ msg: '[oauth/google] id_token present but unparsable' }));
    return loginError('identity_error', [clearStateCookie()]);
  }

  if (idTokenClaims) {
    const exp = typeof idTokenClaims.exp === 'number' ? idTokenClaims.exp : 0;
    const iss = typeof idTokenClaims.iss === 'string' ? idTokenClaims.iss : '';
    const aud = idTokenClaims.aud;
    const audOk = aud === env.GOOGLE_CLIENT_ID || (Array.isArray(aud) && aud.includes(env.GOOGLE_CLIENT_ID));
    const issOk = iss === 'https://accounts.google.com' || iss === 'accounts.google.com';
    const nonceOk = typeof stateNonce === 'string' && stateNonce.length > 0 && idTokenClaims.nonce === stateNonce;

    if (!idTokenClaims.sub || exp * 1000 < Date.now() - 60_000 || !issOk || !audOk || !nonceOk) {
      console.error(JSON.stringify({
        msg: '[oauth/google] id_token claim validation failed',
        expired: exp * 1000 < Date.now() - 60_000,
        issOk,
        audOk,
        nonceOk,
      }));
      return loginError('identity_error', [clearStateCookie()]);
    }

    profile = {
      sub: String(idTokenClaims.sub),
      email: typeof idTokenClaims.email === 'string' ? idTokenClaims.email : undefined,
      email_verified: idTokenClaims.email_verified === true,
      name: typeof idTokenClaims.name === 'string' ? idTokenClaims.name : undefined,
      picture: typeof idTokenClaims.picture === 'string' ? idTokenClaims.picture : undefined,
    };
  } else {
    // Fallback path: token response carried no id_token. Logged so fallback
    // usage stays observable.
    console.warn(JSON.stringify({ msg: '[oauth/google] id_token absent from token response — falling back to userinfo' }));
    try {
      const userinfoResponse = await fetchWithTimeout(GOOGLE_USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userinfoResponse.ok) throw new Error(`userinfo endpoint ${userinfoResponse.status}`);
      profile = (await userinfoResponse.json()) as typeof profile;
    } catch (err) {
      console.error(JSON.stringify({ msg: '[oauth/google] userinfo failed', err: String(err) }));
      return loginError('userinfo_failed', [clearStateCookie()]);
    }
  }

  if (!profile.sub || !profile.email || profile.email_verified !== true) {
    return loginError('email_unverified', [clearStateCookie()]);
  }

  // ─── Authenticate against the identity system ────────────────────
  if (!env.SSO_SERVICE) {
    console.error(JSON.stringify({ msg: '[oauth/google] SSO_SERVICE binding missing' }));
    return loginError('identity_error', [clearStateCookie()]);
  }

  let outcome: Awaited<ReturnType<typeof ssoOauthAuthenticate>>;
  try {
    outcome = await ssoOauthAuthenticate(env, {
      provider: 'google',
      providerUserId: profile.sub,
      email: profile.email,
      emailVerified: true,
      name: profile.name ?? null,
      picture: profile.picture ?? null,
    });
  } catch (err) {
    console.error(JSON.stringify({ msg: '[oauth/google] identity RPC threw', err: err instanceof Error ? err.message : String(err) }));
    return loginError('identity_error', [clearStateCookie()]);
  }

  if (outcome.kind !== 'issued') {
    const errorCode =
      outcome.kind === 'rejected' && outcome.code === 'account_blocked'
        ? 'identity_rejected'
        : 'identity_error';
    console.warn(JSON.stringify({ msg: '[oauth/google] identity rejected', kind: outcome.kind, code: 'code' in outcome ? outcome.code : undefined }));
    return loginError(errorCode, [clearStateCookie()]);
  }

  const refreshCookie = `${REFRESH_COOKIE_NAME}=${outcome.session.refreshToken}; ${REFRESH_COOKIE_ATTRS}; Max-Age=${REFRESH_COOKIE_MAX_AGE_SECONDS}`;
  return redirect('/auth/callback', [refreshCookie, clearStateCookie()]);
}
