import { initAuth, withAuth as withAuthCore, requireRole, requireProduct } from '@rareminds-eym/auth-core';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from './supabase';

/**
 * Initialize auth-core with the SSO domain from the request environment.
 * This MUST be called per-request because env vars are only available at
 * request time in Cloudflare Pages Functions, and different deployments
 * (preview, staging, production) use different SSO worker URLs.
 */
function initAuthFromEnv(env: Record<string, string>) {
  const ssoDomain = env.SSO_DOMAIN || env.VITE_SSO_URL;
  if (!ssoDomain) {
    throw new Error(
      'SSO_DOMAIN environment variable is not configured. ' +
      'Set SSO_DOMAIN (or VITE_SSO_URL) to your SSO worker URL (e.g., https://sso-api.example.workers.dev)'
    );
  }
  initAuth({ ssoDomain });
}

/**
 * Wrapped withAuth that initializes auth-core with the correct SSO domain
 * from the request environment before running the auth-core middleware.
 */
export function withAuth(handler: (context: AuthenticatedContext) => Promise<Response>) {
  return async (context: AuthenticatedContext) => {
    const env = context.env as Record<string, string>;
    initAuthFromEnv(env);
    return withAuthCore(handler)(context);
  };
}

export { requireRole, requireProduct, getServiceClient };

