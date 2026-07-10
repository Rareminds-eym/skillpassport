import { apiLogger } from '../../lib/logger';
import { getCorsHeaders } from '../../lib/cors';
import type { Env } from '../../lib/types';

/**
 * POST /api/auth/logout
 *
 * Terminates the user's session per OWASP Session Management Cheat Sheet:
 *
 * 1. Extract the refresh token from the HttpOnly cookie (primary) or request
 *    body/header (fallback for non-browser clients).
 * 2. Call SSO Worker RPC `logoutSession(refreshToken, ip, ua)` to revoke the
 *    session server-side. This is the critical security step — without it an
 *    attacker who captured the refresh token could continue using it.
 * 3. ALWAYS clear the refresh_token cookie, even when the RPC call fails
 *    (network error, rate limit, etc.). A user who clicked "Logout" must
 *    never remain logged in on the current device.
 *
 * Cookie-clearing attributes MUST match those used when the cookie was SET
 * (login.ts / refresh.ts) so the browser can locate and delete the correct
 * cookie. login.ts sets: `Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
 * — notably NO `Secure` flag (omitted for localhost HTTP development).
 *
 * No access-token gate: auth-client's `logout()` calls this endpoint without
 * an Authorization header (the access token may already have expired). The
 * refresh-token cookie, sent automatically via `credentials: "include"`, is
 * sufficient to identify the session to revoke.
 */
export async function onRequestPost(context: {
  request: Request;
  env: Env;
  data?: Record<string, unknown>;
}): Promise<Response> {
  const { request, env } = context;
  const startTime = Date.now();

  // ── 1. Extract refresh token (cookie → body → header) ────────
  let refreshToken: string | null = null;

  // Primary: HttpOnly cookie (set by login/refresh endpoints)
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='));
    if (refreshCookie) {
      refreshToken = refreshCookie.substring('refresh_token='.length);
    }
  }

  // Fallback: request body (for non-browser / programmatic clients)
  if (!refreshToken) {
    try {
      const body = (await request.json()) as { refresh_token?: string };
      if (body.refresh_token) {
        refreshToken = body.refresh_token;
      }
    } catch {
      // Body is empty or not JSON — acceptable for browser logout
    }
  }

  // Fallback: X-Refresh-Token header (consistent with refresh.ts)
  if (!refreshToken) {
    refreshToken = request.headers.get('X-Refresh-Token');
  }

  const ip = request.headers.get('CF-Connecting-IP') || undefined;
  const ua = request.headers.get('User-Agent') || undefined;

  // ── 2. Server-side session revocation (OWASP critical step) ──
  let rpcSuccess = true;
  let rpcWarning: string | undefined;

  if (refreshToken) {
    try {
      const ssoService = env.SSO_SERVICE as any;

      // logoutSession signature: (refreshToken: string, ip?: string, ua?: string)
      // Positional arguments — NOT an object (Cloudflare Workers RPC contract)
      await ssoService.logoutSession(refreshToken, ip, ua);
      apiLogger.info('Logout: session revoked server-side', { ip });
    } catch (err: any) {
      // Log but do NOT block the response — the cookie must still be cleared.
      // The pending-logout safety net in authStore.ts will retry on next load.
      rpcSuccess = false;
      rpcWarning = err?.message ?? 'Session revocation failed';
      apiLogger.error('Logout: RPC revocation failed (cookie will still be cleared)', {
        error: rpcWarning,
        ip,
      });
    }
  } else {
    // No refresh token found — nothing to revoke server-side, but we still
    // clear the cookie so the client is definitively logged out.
    rpcWarning = 'No refresh token found — client-side cookie cleared only';
    apiLogger.warn('Logout: no refresh token in request', { ip });
  }

  // ── 3. Build response — ALWAYS clear the cookie ──────────────
  const requestId = crypto.randomUUID();
  const origin = request.headers.get('Origin') ?? null;

  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...getCorsHeaders(origin),
  });

  // Clear refresh_token cookie.
  // Attributes MUST match those used in login.ts / refresh.ts to ensure
  // the browser deletes the correct cookie (RFC 6265bis §5.4).
  //
  // login.ts sets:   `refresh_token=<val>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
  // We clear with:   `refresh_token=;      Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  //
  // Note: `Secure` is intentionally omitted to match login.ts (required for
  // localhost HTTP development). Production should set `Secure` on both set
  // and clear via environment-based cookie config (tracked separately).
  headers.append(
    'Set-Cookie',
    'refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  );

  const durationMs = Date.now() - startTime;

  return new Response(
    JSON.stringify({
      success: true,
      data: null,
      error: null,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        durationMs,
        // Surface non-fatal warnings so authStore.ts can decide to set the
        // pending-logout flag (without exposing internal details to end users)
        ...(rpcWarning && !rpcSuccess ? { serverRevocationPending: true } : {}),
      },
    }),
    {
      status: 200,
      headers,
    },
  );
}
