/// <reference types="@cloudflare/workers-types" />
import type { AuthenticatedContext, ContextWithUser, AuthUser as SSOAuthUser } from '@rareminds-eym/auth-core';
import { initAuth, requireFeature, requireProduct, requireRole, withAuth as withAuthCore } from '@rareminds-eym/auth-core';
import { hasAnyFeature } from './entitlements';
import { ADMIN_ROLES } from './roleCategories';
import { getServiceClient } from './supabase';
import type { PagesEnv } from './types';

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

/**
 * withAuth variant that does NOT enforce email verification.
 *
 * Used for endpoints that must be accessible immediately after signup
 * (e.g., creating the app profile) before the user has verified their email.
 *
 * The JWT is still validated — the user must be authenticated. Only the
 * email-verified gate is bypassed.
 */
export function withAuthAllowUnverified(handler: (context: AuthenticatedContext) => Promise<Response>) {
  return async (context: any) => {
    const env = context.env as Record<string, string | Fetcher>;
    ensureAuthInitialized(env);

    return withAuthCore(async (authContext) => {
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

export { getServiceClient, requireFeature, requireProduct, requireRole };

// ══════════════════════════════════════════════════════════════
// App-side role-group guard: requireAdmin
// ══════════════════════════════════════════════════════════════

/**
 * Guard requiring the authenticated user to hold ANY role in the ADMIN role
 * group. Equivalent to `requireRole(ADMIN_ROLES, handler)` — the admin group
 * is sourced from the SINGLE shared definition in `./roleCategories`
 * (mirroring `src/shared/types/generated/roles.ts` ROLE_CATEGORIES.admin),
 * NOT an inline `['admin','company_admin',...]` literal duplicated per handler
 * (that duplication is bug §3.4 / §7.1, which this P2 work eliminates).
 *
 * Like `requireRole`, this reads ONLY the verified JWT roles
 * (`context.data.user.roles`) — no shadow-store / DB authorization read.
 *
 * Usage (handlers converted in task 11.x):
 *   export const onRequestPost = withAuth(requireAdmin(async (context) => { ... }));
 *
 * ── P3 FOLLOW-UP (tasks 15–18) ────────────────────────────────────────────
 * The admin group is currently a STATIC list (`ADMIN_ROLES`). In Phase P3 it
 * will be resolved at RUNTIME from the app-DB `role_categories` shadow table
 * (design's `rolesInCategory(env, 'admin')`, ~60s in-isolate cache) so a
 * role's category membership becomes a DB-only change (no regen/redeploy,
 * E3.2/E3.3). At that point this becomes:
 *   requireAdmin = (handler) => async (context) => {
 *     const adminRoles = await rolesInCategory(context.env, 'admin');
 *     return requireRole(adminRoles, handler)(context);
 *   };
 * The signature below is intentionally shaped to make that swap a no-op for
 * callers.
 */
export function requireAdmin(
  handler: (context: ContextWithUser) => Promise<Response> | Response
) {
  return requireRole([...ADMIN_ROLES], handler);
}


// ══════════════════════════════════════════════════════════════
// App-side feature/entitlement guard: requireFeatureAccess
// ══════════════════════════════════════════════════════════════

/**
 * Server-side entitlement predicate bound into auth-core's GENERIC
 * `requireFeature`. auth-core deliberately knows nothing about subscriptions,
 * plans, or add-ons — the concrete decision lives here, in the app, where the
 * shadow tables (`subscription_cache`/`plans_cache`/`user_entitlements`) and the
 * `getServiceClient` binding are available. (Design §"Feature": canonical state
 * stays SSO-side, surfaced locally via `sso-client.ts` RPC + `sync-shadow.ts`.)
 *
 * IMPLEMENTATION (task 24.1 / Phase P5)
 * ----------------------------------------------------------------------------
 * Delegates to `hasAnyFeature` (`functions/lib/entitlements.ts`), which reads
 * the canonical server-side shadow state:
 *   - `subscription_cache` + `plans_cache` (active plan features + freemium
 *     baseline) via the self-healing `checkServerFeatureAccess` helper, and
 *   - `user_entitlements` (purchased add-ons, the app-DB shadow of the SSO
 *     `addon_purchases`).
 * It grants when ANY of `keys` resolves and FAILS CLOSED (deny) on missing
 * identity, empty/invalid keys, DB errors, or unexpected throws — so this can
 * never become a silently-open gate (CC-2).
 *
 * NOTE (live-enforcement deferral): `requireFeatureAccess` is intentionally not
 * yet applied to any live handler (that is task 24.2). Because the
 * subscription/entitlement shadow caches are not yet broadly populated by the
 * SSO entitlement sync/backfill, wiring this guard onto live endpoints now would
 * deny real users. Per the task-23 precedent (user-approved), the canonical read
 * is implemented + unit-tested + documented here, while live wrapping waits for
 * the SSO entitlement sync to populate the caches. See
 * `.kiro/verifications/` for the deferral note.
 */
async function entitlementCheck(
  context: ContextWithUser,
  keys: string[]
): Promise<boolean> {
  const supabase = getServiceClient(context.env as unknown as PagesEnv);
  const userId = getContextUser(context).id;

  // Reads ONLY the server-side shadow (subscription_cache/plans_cache/
  // user_entitlements); grants on ANY key; fails closed otherwise.
  return hasAnyFeature(supabase, userId, keys);
}

/**
 * Guard requiring the authenticated user to be entitled to a given feature (or
 * ANY feature in a list). Binds the GENERIC auth-core `requireFeature` to the
 * app's server-side `entitlementCheck`, mirroring how `requireAdmin` binds
 * `requireRole`. On deny, auth-core responds 403; otherwise the wrapped handler
 * runs.
 *
 * Intended usage (handlers wrapped in task 24.2, behind `withAuth`):
 *   export const onRequestGet = withAuth(requireFeatureAccess('advanced-reports', async (context) => { ... }));
 *
 * `entitlementCheck` is now implemented (task 24.1): it grants when the user has
 * ANY of the requested feature keys via the server-side shadow read and fails
 * closed otherwise. Applying this guard to LIVE handlers is task 24.2 and is
 * deferred until the SSO entitlement sync populates the shadow caches (see the
 * deferral note under `.kiro/verifications/`), so it is not yet wrapped on any
 * endpoint.
 */
export const requireFeatureAccess = (
  featureKey: string | string[],
  handler: (context: ContextWithUser) => Promise<Response> | Response
) => requireFeature(featureKey, entitlementCheck, handler);
