/// <reference types="@cloudflare/workers-types" />
import { initAuth, verifyJWT, withAuth as withAuthCore, requireRole, requireProduct } from '@rareminds-eym/auth-core';
import type { AuthenticatedContext, AuthUser as SSOAuthUser } from '@rareminds-eym/auth-core';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceClient } from './supabase';

// ---------------------------------------------------------------------------
// Module-level lazy singleton for auth-core initialization.
//
// auth-core's initAuth() sets module-level _config + fires _onReset callbacks
// that nullify the JWKS cache. Calling it per-request clears the cache on
// every call, forcing a re-fetch on next verifyJWT. Since SSO_DOMAIN and
// SSO_SERVICE are static per Worker instance (frozen at deploy time), we
// initialize once and reuse for the isolate's lifetime.
//
// In Cloudflare Workers, env bindings are isolated per-deployment. Different
// deployments (preview, staging, production) run in separate isolates, so
// there is never a case where one isolate serves requests with different
// SSO_DOMAIN values.
// ---------------------------------------------------------------------------
let _authInitialized = false;

function ensureAuthInitialized(env: Record<string, unknown>): void {
  if (_authInitialized) return;

  const ssoRpcRaw = env.SSO_SERVICE;
  if (!ssoRpcRaw || typeof ssoRpcRaw !== 'object') {
    throw new Error(
      `SSO_SERVICE must be a Service Binding to the SSO worker. ` +
      `Check wrangler.toml - SSO_SERVICE should be configured as [[services]] binding.`
    );
  }

  try {
    initAuth({ ssoRpc: ssoRpcRaw as any });
    _authInitialized = true;
  } catch (error) {
    console.error('[auth] Failed to initialize auth-core:', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

async function verifyEmailOrBlock(
  user: SSOAuthUser,
  env: Record<string, string | Fetcher>,
  request: Request
): Promise<Response | null> {
  if (user.is_email_verified) return null;

  let isVerifiedInDb = false;
  try {
    const supabase = getServiceClient(env as any);
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('is_email_verified')
      .eq('id', user.sub)
      .single();

    if (!error && dbUser && dbUser.is_email_verified) {
      isVerifiedInDb = true;
      user.is_email_verified = true;
    }
  } catch (e) {
    console.warn('[auth] DB verification check failed:', e);
  }

  if (isVerifiedInDb) return null;

  const pathname = new URL(request.url).pathname;
  console.warn('[auth] Blocked unverified user:', {
    userId: user.sub, email: user.email, path: pathname,
  });

  return new Response(
    JSON.stringify({
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email address to access this feature',
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Code': 'EMAIL_NOT_VERIFIED',
      },
    }
  );
}

/**
 * Wrapped withAuth that initializes auth-core once per isolate
 * before running the auth-core middleware.
 *
 * Also enforces email verification - blocks unverified users from accessing
 * protected endpoints (returns 403 with EMAIL_NOT_VERIFIED error code).
 */
export function withAuth(handler: (context: AuthenticatedContext) => Promise<Response>) {
  return async (context: any) => {
    const env = context.env as Record<string, string | Fetcher>;
    ensureAuthInitialized(env);

    return withAuthCore(async (authContext) => {
      const blocked = await verifyEmailOrBlock(authContext.data.user, env, context.request);
      if (blocked) return blocked;

      return handler(authContext);
    })(context);
  };
}

export interface AuthUser extends SSOAuthUser {
  id: string;
}

// ══════════════════════════════════════════════════════════════
// Context-based auth helper: extract user from withAuth context.
//
// For PagesFunction handlers inside `withAuth`, the context is
// modified by withAuthCore to include `data.user`. This helper
// provides a typed, safe way to access it — keeping lib/auth.ts
// as the holistic auth gateway for all handlers.
// ══════════════════════════════════════════════════════════════

/**
 * Extract the authenticated user from a PagesFunction context
 * that has been wrapped with `withAuth`.
 *
 * Throws if `context.data.user` is not set (handler is not behind `withAuth`).
 */
export function getContextUser(context: { data?: { user?: SSOAuthUser } }): AuthUser {
  const user = context.data?.user;
  if (!user) {
    throw new Error(
      'getContextUser: context.data.user is not set. ' +
      'Ensure this handler is wrapped with `withAuth`.'
    );
  }
  return { ...user, id: user.sub };
}

export { requireRole, requireProduct, getServiceClient };

