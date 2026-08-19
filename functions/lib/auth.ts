/// <reference types="@cloudflare/workers-types" />
import type { VerifiedAuthUser as SSOAuthUser } from "@rareminds-eym/auth-core";
import { createAuth } from "@rareminds-eym/auth-core";
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
      approvedOrigins: [
        "https://skillpassport.rareminds.in",
        "http://localhost:3000",
        "http://localhost:8787",
        "http://localhost:8788",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:4173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8787",
        "http://127.0.0.1:8788",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:4173"
      ],
      credentialedCors: {
        origins: [
          "https://skillpassport.rareminds.in",
          "http://localhost:3000",
          "http://localhost:8787",
          "http://localhost:8788",
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:4173",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:8787",
          "http://127.0.0.1:8788",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174",
          "http://127.0.0.1:4173"
        ]
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
    const env = context.env as Record<string, string | Fetcher>;
    const auth = getAuthInstance(env);

    const authenticate = auth.authenticate(async (req, authedContext) => {
      context.data = context.data ?? {};
      context.data.user = authedContext.user;

      const blocked = requireVerifiedEmail(authedContext.user);
      if (blocked) return blocked;

      return handler(context);
    });

    return authenticate(context.request);
  };
}

export function withAuthAllowUnverified(handler: (context: any) => Promise<Response>) {
  return async (context: any) => {
    const env = context.env as Record<string, string | Fetcher>;
    const auth = getAuthInstance(env);

    const authenticate = auth.authenticate(async (req, authedContext) => {
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

export function requireAdmin(handler: (context: any) => Promise<Response> | Response) {
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
