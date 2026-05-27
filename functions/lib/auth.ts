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

  const ssoDomainRaw = env.SSO_DOMAIN;
  if (!ssoDomainRaw || typeof ssoDomainRaw !== 'string') {
    throw new Error(
      'SSO_DOMAIN is not configured. ' +
      'Set SSO_DOMAIN to your SSO worker URL (e.g., https://sso-api.example.workers.dev)'
    );
  }

  const ssoDomain = ssoDomainRaw;
  const ssoFetcherRaw = env.SSO_SERVICE;
  let ssoFetcher: Fetcher | undefined;

  if (ssoFetcherRaw !== undefined) {
    if (typeof ssoFetcherRaw !== 'object' || !ssoFetcherRaw || !('fetch' in ssoFetcherRaw)) {
      throw new Error(
        `SSO_SERVICE must be a Fetcher binding, got ${typeof ssoFetcherRaw}. ` +
        `Check wrangler.toml - SSO_SERVICE should be configured as [[services]] binding.`
      );
    }
    ssoFetcher = ssoFetcherRaw as Fetcher;
  }

  if (ssoFetcher) {
    console.info('[auth] Using SSO_SERVICE binding');
  } else {
    console.warn('[auth] Using HTTP to SSO_DOMAIN:', ssoDomain, '(configure SSO_SERVICE binding for better performance)');
  }

  try {
    initAuth({ ssoDomain, ssoFetcher });
    _authInitialized = true;
  } catch (error) {
    console.error('[auth] Failed to initialize auth-core:', {
      ssoDomain,
      hasSsoFetcher: !!ssoFetcher,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Wrapped withAuth that initializes auth-core once per isolate
 * before running the auth-core middleware.
 * 
 * Also enforces email verification - blocks unverified users from accessing
 * protected endpoints (returns 403 with EMAIL_NOT_VERIFIED error code).
 */
export function withAuth(handler: (context: AuthenticatedContext) => Promise<Response>) {
  return async (context: AuthenticatedContext) => {
    const env = context.env as Record<string, string | Fetcher>;
    ensureAuthInitialized(env);
    
    return withAuthCore(async (authContext) => {
      const user = authContext.data.user;

      // Check email verification
      if (!user.is_email_verified) {
        let isVerifiedInDb = false;

        try {
          // SECONDARY CHECK: JWT is stale or user just verified.
          // Perform a lightweight check against the database to verify status.
          const supabase = getServiceClient(env as any);
          const { data: dbUser, error } = await supabase
            .from('users')
            .select('is_email_verified')
            .eq('id', user.sub)
            .single();

          if (!error && dbUser && dbUser.is_email_verified) {
            // Token is stale but user is verified! Allow request.
            isVerifiedInDb = true;
            user.is_email_verified = true;
          }
        } catch (e) {
          console.warn('[auth] DB verification check failed:', e);
        }

        if (!isVerifiedInDb) {
          const pathname = new URL(context.request.url).pathname;
          
          console.warn('[auth] Blocked unverified user:', {
            userId: user.sub,
            email: user.email,
            path: pathname,
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
      }
      
      return handler(authContext);
    })(context);
  };
}

// ══════════════════════════════════════════════════════════════
// Legacy bridge: authenticateUser — wraps auth-core verifyJWT
// for callers that haven't migrated to withAuth yet.
// ══════════════════════════════════════════════════════════════

export interface AuthUser extends SSOAuthUser {
  id: string;
}

export interface AuthResult {
  user: AuthUser;
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
}

/**
 * Authenticate user from Authorization header using auth-core verifyJWT.
 * Bridge function for callers that haven't migrated to withAuth yet.
 *
 * Uses the module-level singleton (ensureAuthInitialized) to init auth-core
 * once per isolate — same as withAuth.
 */
export async function authenticateUser(
  request: Request,
  env: Record<string, unknown>
): Promise<AuthResult | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  ensureAuthInitialized(env);

  const supabaseUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL) as string | undefined;
  const supabaseAnonKey = (env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY) as string | undefined;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration');
    throw new Error('Server Configuration Error: Missing Supabase URL or Anon Key');
  }

  if (!supabaseServiceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY configuration');
    throw new Error('Server Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  try {
    const ssoUser = await verifyJWT(token);
    const user: AuthUser = { ...ssoUser, id: ssoUser.sub };

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    return { user, supabase: supabaseAdmin, supabaseAdmin };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('configuration') || message.includes('Missing')) {
      console.error('CRITICAL: Authentication configuration error:', message);
      throw error;
    }
    console.warn('Authentication failed:', message);
    return null;
  }
}

export { requireRole, requireProduct, getServiceClient };

