/// <reference types="@cloudflare/workers-types" />
import type { VerifiedAuthUser as SSOAuthUser, VerifiedAuthContext } from "@rareminds-eym/auth-core";
import { createAuth } from "@rareminds-eym/auth-core";
import { createSsoGateway } from "@rareminds-eym/sso-gateway";
import { APPROVED_ORIGINS } from "./app-origins";
import { hasAnyFeature } from "./entitlements";
import { ADMIN_ROLES } from "./roleCategories";
import { getServiceClient } from "./supabase";
import type { PagesEnv } from "./types";

// NOTE: Do NOT cache the auth instance across requests.
// env.SSO_SERVICE is a request-scoped service binding — caching it in a
// module-level variable causes "Cannot perform I/O on behalf of a different
// request" errors in the Workers runtime on subsequent requests.

export function getAuthInstance(env: Record<string, unknown>): ReturnType<typeof createAuth> {
  const ssoRpcRaw = env.SSO_SERVICE;
  if (!ssoRpcRaw || typeof ssoRpcRaw !== "object") {
    throw new Error(
      "SSO_SERVICE must be a Service Binding to the SSO worker. Check wrangler.toml."
    );
  }

  try {
    return createAuth({
      sso: ssoRpcRaw as any,
      issuer: "sso-api",
      audience: "sso-client",
      approvedOrigins: [...APPROVED_ORIGINS],
      credentialedCors: {
        origins: [...APPROVED_ORIGINS],
      },
      csrf: { name: "X-RM-CSRF", value: "1" },
      cookieMaxAgeSeconds: 604800,
      ssoRequestTimeoutMs: 5000,
    });
  } catch (error) {
    throw new Error(
      `Failed to initialize auth-core: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function getSsoGatewayInstance(env: Record<string, unknown>): ReturnType<typeof createSsoGateway> {
  const ssoRpcRaw = env.SSO_SERVICE;
  if (!ssoRpcRaw || typeof ssoRpcRaw !== "object") {
    throw new Error(
      "SSO_SERVICE must be a Service Binding to the SSO worker. Check wrangler.toml."
    );
  }

  return createSsoGateway({
    sso: ssoRpcRaw as any,
    issuer: "sso-api",
    audience: "sso-client",
    basePath: "/api/auth",
    approvedOrigins: [...APPROVED_ORIGINS],
    csrf: { name: "X-RM-CSRF", value: "1" },
    cookieMaxAgeSeconds: 604800,
    ssoRequestTimeoutMs: 5000,
  });
}

/**
 * Checks email verification from the SSO JWT claim (authoritative source).
 * C2/C3 fix: No Supabase DB fallback, no frozen-object mutation, no PII logging.
 */
function requireVerifiedEmail(user: SSOAuthUser): Response | null {
  if (user.is_email_verified) return null;

  return new Response(
    JSON.stringify({
      error: "Email verification required",
      code: "EMAIL_NOT_VERIFIED",
      message: "Please verify your email address to access this feature",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "X-Error-Code": "EMAIL_NOT_VERIFIED",
      },
    }
  );
}

export function withAuth(handler: (context: any) => Promise<Response>) {
  return async (context: any) => {
    const env = context.env as Record<string, unknown>;
    const auth = getAuthInstance(env);

    const authenticate = auth.authenticate(async (_req: Request, authedContext: VerifiedAuthContext) => {
      context.data = context.data ?? {};
      context.data.user = authedContext.user;

      const blocked = requireVerifiedEmail(authedContext.user);
      if (blocked) return blocked;

      // Async self-heal (eventual, no block) where SYNC_QUEUE consumer is absent.
      // Now enabled for all envs (was gated ENVIRONMENT!=='production'); fail-soft never blocks request.
      // Heals users/learners/members/subscription when any is missing (full parity).
      try {
        const waitUntil = (context as any).waitUntil as ((p: Promise<any>) => void) | undefined;
        const healPromise = (async () => {
          const { getServiceClient: getSvc } = await import('./supabase');
          const { ensureAppUserAndLearner } = await import('./heal-user');
          const svc = getSvc(env as any);
          const { data: u } = await (svc as any).from('users').select('id').eq('id', authedContext.user.sub).maybeSingle();
          const { data: subCache } = await (svc as any).from('subscription_cache').select('id').eq('user_id', authedContext.user.sub).limit(1).maybeSingle();
          if (!u || !subCache) {
            await ensureAppUserAndLearner(svc as any, env as any, { sub: authedContext.user.sub, email: authedContext.user.email }, crypto.randomUUID());
          }
        })().catch(() => {});
        if (waitUntil) waitUntil(healPromise);
        else healPromise.catch(() => {});
      } catch {
        // fail-soft
      }

      return handler(context);
    });

    return authenticate(context.request);
  };
}

export function withAuthAllowUnverified(handler: (context: any) => Promise<Response>) {
  return async (context: any) => {
    const env = context.env as Record<string, string | Fetcher>;
    const auth = getAuthInstance(env);

    const authenticate = auth.authenticate(async (_req: Request, authedContext: VerifiedAuthContext) => {
      context.data = context.data ?? {};
      context.data.user = authedContext.user;

      return handler(context);
    });

    return authenticate(context.request);
  };
}

export interface AuthUser extends SSOAuthUser {
  id: string;
  name?: string;
  phone?: string;
}

export function getContextUser(context: { data?: { user?: SSOAuthUser } }): AuthUser {
  const user = context.data?.user;
  if (!user) {
    throw new Error(
      "getContextUser: context.data.user is not set. Ensure this handler is wrapped with `withAuth`."
    );
  }
  return { ...user, id: user.sub };
}

export function requireRole(
  allowedRoles: string | readonly string[],
  handler?: (context: any) => Promise<Response>
) {
  const roles = Array.isArray(allowedRoles)
    ? allowedRoles
    : typeof allowedRoles === "string"
      ? [allowedRoles]
      : [];

  const run = (ctx: any, fn: (c: any) => Promise<Response>) => {
    const user = ctx.data?.user;
    if (!user || !user.roles || !roles.some((r: string) => user.roles.includes(r))) {
      return new Response(JSON.stringify({ error: "Forbidden: insufficient role" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return fn(ctx);
  };

  if (handler) {
    return (context: any) => run(context, handler);
  }
  return (fn: (c: any) => Promise<Response>) => (context: any) => run(context, fn);
}

export function requireProduct(
  allowedProducts: string | readonly string[],
  handler?: (context: any) => Promise<Response>
) {
  const products = Array.isArray(allowedProducts)
    ? allowedProducts
    : typeof allowedProducts === "string"
      ? [allowedProducts]
      : [];

  const run = (ctx: any, fn: (c: any) => Promise<Response>) => {
    const user = ctx.data?.user;
    if (!user || !user.products || !products.some((p: string) => user.products.includes(p))) {
      return new Response(JSON.stringify({ error: "Forbidden: product access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return fn(ctx);
  };

  if (handler) {
    return (context: any) => run(context, handler);
  }
  return (fn: (c: any) => Promise<Response>) => (context: any) => run(context, fn);
}

export function requireAdmin(handler: (context: any) => Promise<Response>) {
  return requireRole([...ADMIN_ROLES], handler);
}

async function entitlementCheck(context: any, keys: string[]): Promise<boolean> {
  const supabase = getServiceClient(context.env as unknown as PagesEnv);
  const userId = getContextUser(context).id;
  return hasAnyFeature(supabase, userId, keys);
}

export const requireFeatureAccess = (
  featureKey: string | string[],
  handler: (context: any) => Promise<Response> | Response
) => {
  const keys = Array.isArray(featureKey) ? featureKey : [featureKey];
  return async (context: any) => {
    const ok = await entitlementCheck(context, keys);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Forbidden: feature not available" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return handler(context);
  };
};

export { getServiceClient };
