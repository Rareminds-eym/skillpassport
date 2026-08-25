/**
 * Tests for the Google OAuth Pages Function (api/oauth/google/[[path]].ts).
 *
 * Covers: kill switch, start redirect + state cookie (nonce-bound), callback
 * state validation (missing/mismatched/tampered/expired/replayed), provider
 * error, id_token claim validation (primary profile source), userinfo
 * fallback logging, refresh-cookie emission, and identity rejection mapping.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet } from '../api/oauth/google/[[path]]';

// ── State helpers (mirror the function's HMAC scheme) ───────────

function b64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

async function makeState(opts: { iat?: number; secret?: string } = {}): Promise<{ value: string; nonce: string }> {
  const secret = opts.secret ?? 'test-state-secret';
  const nonce = crypto.randomUUID();
  const payload = b64urlEncode(new TextEncoder().encode(JSON.stringify({ n: crypto.randomUUID(), iat: opts.iat ?? Date.now(), nce: nonce })));
  const sig = await hmacSign(payload, secret);
  return { value: `${payload}.${sig}`, nonce };
}

/** Builds a Google-style id_token (claims are validated by the handler; signature is not). */
function makeIdToken(claims: Record<string, unknown>): string {
  const payload = b64urlEncode(
    new TextEncoder().encode(JSON.stringify({ iss: 'https://accounts.google.com', aud: 'test-client-id', exp: Math.floor(Date.now() / 1000) + 3600, ...claims })),
  );
  return `header.${payload}.signature`;
}

// ── Harness ─────────────────────────────────────────────────────

const ORIGIN = 'http://localhost:3000';

function baseEnv(overrides: Record<string, unknown> = {}) {
  return {
    GOOGLE_OAUTH_ENABLED: 'true',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    OAUTH_STATE_SECRET: 'test-state-secret',
    SSO_SERVICE: {
      oauthAuthenticate: vi.fn(async () => ({
        kind: 'issued',
        correlationId: 'c-1',
        session: {
          accessToken: 'at',
          refreshToken: 'rt-123',
          remainingLifetimeSeconds: 604800,
          identity: { subject: 'u1', email: 'learner@example.com', roles: ['learner'] },
        },
      })),
    },
    ...overrides,
  };
}

function startRequest(): Request {
  return new Request(`${ORIGIN}/api/oauth/google`, { headers: { 'User-Agent': 'TestAgent' } });
}

function callbackRequest(search: string, stateCookie?: string): Request {
  const headers: Record<string, string> = {};
  if (stateCookie) headers.Cookie = `__Host-rm-oauth-state=${stateCookie}`;
  return new Request(`${ORIGIN}/api/oauth/google/callback?${search}`, { headers });
}

function callStart(env: Record<string, unknown>) {
  return onRequestGet({ request: startRequest(), env: env as never, params: { path: [] } });
}

function callCallback(search: string, env: Record<string, unknown>, stateCookie?: string) {
  return onRequestGet({ request: callbackRequest(search, stateCookie), env: env as never, params: { path: 'callback' } });
}

const GOOGLE_PROFILE = { sub: 'google-sub-abc', email: 'learner@example.com', email_verified: true, name: 'Learner Person', picture: 'https://pic' };

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/oauth/google (start)', () => {
  it('redirects to login with disabled code when the flag is off', async () => {
    const res = await callStart(baseEnv({ GOOGLE_OAUTH_ENABLED: 'false' }));
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/login?oauth_error=disabled');
  });

  it('redirects to Google consent with a signed Lax state cookie and bound nonce', async () => {
    const res = await callStart(baseEnv());
    expect(res.status).toBe(302);
    const location = res.headers.get('Location')!;
    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(location).toContain('client_id=test-client-id');
    expect(location).toContain(`redirect_uri=${encodeURIComponent(`${ORIGIN}/api/oauth/google/callback`)}`);
    expect(location).toContain('scope=openid+email+profile');
    expect(location).toContain('nonce=');

    const setCookie = res.headers.get('Set-Cookie')!;
    expect(setCookie).toContain('__Host-rm-oauth-state=');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
  });

  it('rejects non-approved origins', async () => {
    const res = await onRequestGet({
      request: new Request('https://evil.example.com/api/oauth/google'),
      env: baseEnv() as never,
      params: { path: [] },
    });
    expect(res.headers.get('Location')).toContain('oauth_error=invalid_origin');
  });
});

describe('GET /api/oauth/google/callback', () => {
  it('maps a provider error param to provider_error', async () => {
    const res = await callCallback('error=access_denied', baseEnv(), 'anything');
    expect(res.headers.get('Location')).toBe('/login?oauth_error=provider_error');
  });

  it('rejects a missing state cookie', async () => {
    const { value } = await makeState();
    const res = await callCallback(`code=c&state=${encodeURIComponent(value)}`, baseEnv());
    expect(res.headers.get('Location')).toContain('oauth_error=invalid_state');
  });

  it('rejects a state param that does not match the cookie', async () => {
    const { value: cookieState } = await makeState();
    const { value: otherState } = await makeState();
    const res = await callCallback(`code=c&state=${encodeURIComponent(otherState)}`, baseEnv(), cookieState);
    expect(res.headers.get('Location')).toContain('oauth_error=invalid_state');
  });

  it('rejects a tampered signature', async () => {
    const { value } = await makeState({ secret: 'wrong-secret' });
    const res = await callCallback(`code=c&state=${encodeURIComponent(value)}`, baseEnv(), value);
    expect(res.headers.get('Location')).toContain('oauth_error=invalid_state');
  });

  it('rejects an expired state', async () => {
    const { value } = await makeState({ iat: Date.now() - 601_000 });
    const res = await callCallback(`code=c&state=${encodeURIComponent(value)}`, baseEnv(), value);
    expect(res.headers.get('Location')).toContain('oauth_error=expired_state');
  });

  it('maps a failed token exchange to token_exchange_failed', async () => {
    const { value } = await makeState();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('bad code', { status: 400 })));

    const res = await callCallback(`code=c&state=${encodeURIComponent(value)}`, baseEnv(), value);
    expect(res.headers.get('Location')).toContain('oauth_error=token_exchange_failed');

    // Single-use: the state cookie must be cleared on every response.
    const setCookie = res.headers.get('Set-Cookie')!;
    expect(setCookie).toContain('__Host-rm-oauth-state=;');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('validates id_token claims and fails closed on a nonce mismatch', async () => {
    const { value } = await makeState();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          access_token: 'ga',
          id_token: makeIdToken({ ...GOOGLE_PROFILE, nonce: 'attacker-nonce' }),
        }),
      ),
    );

    const warnSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await callCallback(`code=c&state=${encodeURIComponent(value)}`, baseEnv(), value);
    warnSpy.mockRestore();

    expect(res.headers.get('Location')).toContain('oauth_error=identity_error');
  });

  it('fails closed on an expired id_token', async () => {
    const { value, nonce } = await makeState();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          access_token: 'ga',
          id_token: makeIdToken({ ...GOOGLE_PROFILE, nonce, exp: Math.floor(Date.now() / 1000) - 120 }),
        }),
      ),
    );

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await callCallback(`code=c&state=${encodeURIComponent(value)}`, baseEnv(), value);
    errorSpy.mockRestore();

    expect(res.headers.get('Location')).toContain('oauth_error=identity_error');
  });

  it('authenticates via SSO using id_token claims, sets the refresh cookie, and lands on /auth/callback without calling userinfo', async () => {
    const { value, nonce } = await makeState();
    const env = baseEnv();

    let userinfoCalled = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: { body?: string }) => {
        if (String(input).includes('oauth2.googleapis.com/token')) {
          expect(String(init?.body)).toContain('grant_type=authorization_code');
          expect(String(init?.body)).toContain('client_secret=test-client-secret');
          return Response.json({
            access_token: 'ga',
            id_token: makeIdToken({ ...GOOGLE_PROFILE, nonce }),
          });
        }
        userinfoCalled = true;
        return Response.json({});
      }),
    );

    const res = await callCallback(`code=one-time-code&state=${encodeURIComponent(value)}`, env, value);

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/auth/callback');
    expect(userinfoCalled).toBe(false);

    const cookies = [...(res.headers.getSetCookie?.() ?? [res.headers.get('Set-Cookie')!])].join('\n');
    expect(cookies).toContain('__Host-rm-refresh=rt-123; Secure; HttpOnly; Path=/; SameSite=Strict; Max-Age=604800');
    expect(cookies).toContain('__Host-rm-oauth-state=;'); // cleared (single-use)

    expect(env.SSO_SERVICE.oauthAuthenticate).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'google',
      providerUserId: 'google-sub-abc',
      email: 'learner@example.com',
      emailVerified: true,
    }));
  });

  it('falls back to userinfo (and logs it) when the token response has no id_token', async () => {
    const { value } = await makeState();
    const env = baseEnv();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes('oauth2.googleapis.com/token')) {
          return Response.json({ access_token: 'ga' }); // no id_token
        }
        return Response.json(GOOGLE_PROFILE);
      }),
    );

    const res = await callCallback(`code=c&state=${encodeURIComponent(value)}`, env, value);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('falling back to userinfo'));
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/auth/callback');
    warnSpy.mockRestore();
  });

  it('maps an SSO rejection to identity_rejected for blocked accounts', async () => {
    const { value, nonce } = await makeState();
    const env = baseEnv({
      SSO_SERVICE: { oauthAuthenticate: vi.fn(async () => ({ kind: 'rejected', correlationId: 'c-2', code: 'account_blocked' })) },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ access_token: 'ga', id_token: makeIdToken({ ...GOOGLE_PROFILE, nonce }) }),
      ),
    );

    const res = await callCallback(`code=c&state=${encodeURIComponent(value)}`, env, value);
    expect(res.headers.get('Location')).toContain('oauth_error=identity_rejected');
  });
});
