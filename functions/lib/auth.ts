/// <reference types="@cloudflare/workers-types" />
import { initAuth, withAuth as withAuthCore, requireRole, requireProduct } from '@rareminds-eym/auth-core';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from './supabase';

/**
 * Initialize auth-core with the SSO domain from the request environment.
 * This MUST be called per-request because env vars are only available at
 * request time in Cloudflare Pages Functions, and different deployments
 * (preview, staging, production) use different SSO worker URLs.
 */
function initAuthFromEnv(env: Record<string, string | Fetcher>) {
  // Validate SSO_DOMAIN is a string
  const ssoDomainRaw = env.SSO_DOMAIN || env.VITE_SSO_URL;
  
  if (!ssoDomainRaw) {
    throw new Error(
      'SSO_DOMAIN environment variable is not configured. ' +
      'Set SSO_DOMAIN (or VITE_SSO_URL) to your SSO worker URL (e.g., https://sso-api.example.workers.dev)'
    );
  }
  
  if (typeof ssoDomainRaw !== 'string') {
    throw new Error(
      `SSO_DOMAIN must be a string URL, got ${typeof ssoDomainRaw}. ` +
      `Check your wrangler.toml - SSO_DOMAIN should be a string variable, not a service binding.`
    );
  }
  
  const ssoDomain = ssoDomainRaw;
  
  // Validate SSO_SERVICE is a Fetcher (if provided)
  const ssoFetcherRaw = env.SSO_SERVICE;
  
  if (ssoFetcherRaw !== undefined) {
    if (typeof ssoFetcherRaw !== 'object' || !ssoFetcherRaw || !('fetch' in ssoFetcherRaw)) {
      throw new Error(
        `SSO_SERVICE must be a Fetcher binding (service binding), got ${typeof ssoFetcherRaw}. ` +
        `Check your wrangler.toml - SSO_SERVICE should be configured as [[services]] binding.`
      );
    }
  }
  
  const ssoFetcher = ssoFetcherRaw as Fetcher | undefined;
  
  // Log which path we're using for observability
  if (ssoFetcher) {
    console.info('[auth] ✓ Using SSO_SERVICE binding (Method 1: Cloudflare internal network, ~10-30ms)');
  } else {
    console.warn('[auth] ⚠ Using HTTP to SSO_DOMAIN (Method 2: public internet, ~60-130ms):', ssoDomain, '(configure SSO_SERVICE binding for better performance)');
  }
  
  try {
    initAuth({ ssoDomain, ssoFetcher });
  } catch (error) {
    console.error('[auth] ❌ Failed to initialize auth-core:', {
      ssoDomain,
      hasSsoFetcher: !!ssoFetcher,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Wrapped withAuth that initializes auth-core with the correct SSO domain
 * from the request environment before running the auth-core middleware.
 */
export function withAuth(handler: (context: AuthenticatedContext) => Promise<Response>) {
  return async (context: AuthenticatedContext) => {
    const env = context.env as Record<string, string | Fetcher>;
    initAuthFromEnv(env);
    return withAuthCore(handler)(context);
  };
}

export { requireRole, requireProduct, getServiceClient };

