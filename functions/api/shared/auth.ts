// Authentication utilities for Cloudflare Pages Functions
// Shared across all APIs

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { initAuth, verifyJWT } from '@rareminds-eym/auth-core';
import type { AuthUser as SSOAuthUser } from '@rareminds-eym/auth-core';

/**
 * Full SSO user with an `id` alias for `sub` so callers can use either.
 * Extends auth-core's AuthUser — do not redefine locally.
 */
export interface AuthUser extends SSOAuthUser {
  /** Alias for `sub` — the user's UUID from the SSO JWT. */
  id: string;
}

export interface AuthResult {
  user: AuthUser;
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
}

// ---------------------------------------------------------------------------
// Module-level lazy singleton for auth-core initialization.
//
// initAuth() resets the JWKS cache via _onReset callbacks. Calling it on
// every request creates a race condition in concurrent Cloudflare Worker
// isolates: Request A clears JWKS → Request B clears JWKS → Request A
// verifies against a null cache. Since ssoDomain is static config it must
// only be initialized once per isolate lifetime.
// ---------------------------------------------------------------------------
let _authInitialized = false;

function ensureAuthInitialized(env: Record<string, string>): void {
  if (_authInitialized) return;
  const ssoDomain = env.SSO_DOMAIN || env.VITE_SSO_URL;
  if (!ssoDomain) throw new Error('Missing SSO_DOMAIN / VITE_SSO_URL configuration');
  initAuth({ ssoDomain });
  _authInitialized = true;
}

/**
 * Authenticate user from Authorization header.
 *
 * Uses auth-core's SSO JWT verification (RS256 via JWKS from SSO worker)
 * instead of Supabase's getUser() — because tokens are issued by the SSO
 * worker, not Supabase Auth.
 */
export async function authenticateUser(
  request: Request,
  env: Record<string, string>
): Promise<AuthResult | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  // Resolve Supabase config
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration');
    return null;
  }

  if (!supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY configuration');
    return null;
  }

  try {
    // Initialize auth-core once per isolate — calling initAuth on every request
    // resets the JWKS cache and creates a race condition under concurrent load.
    ensureAuthInitialized(env);

    // Verify the SSO JWT via JWKS — same as withAuth in functions/lib/auth.ts
    const ssoUser = await verifyJWT(token);

    console.log(`✓ Auth: User authenticated via SSO JWT - ${ssoUser.sub}`);

    // Build Supabase clients for downstream handlers that need DB access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Expose the full SSO AuthUser so callers have access to roles, products,
    // membership_status, etc. `id` is an alias for `sub` for backwards
    // compatibility with existing callers that use auth.user.id.
    const user: AuthUser = { ...ssoUser, id: ssoUser.sub };

    return { user, supabase, supabaseAdmin };
  } catch (error) {
    console.warn('Authentication failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Sanitize user input to prevent XSS, injection attacks, and limit length
 * SECURITY: Enhanced validation for production use
 */
export function sanitizeInput(input: string, maxLength: number = 2000): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove angle brackets
    .replace(/[<>]/g, '')
    // Remove control characters except newline, tab, carriage return
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize Unicode to prevent homograph attacks
    .normalize('NFKC')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Generate a conversation title from the first message
 */
export function generateConversationTitle(message: string): string {
  const cleaned = message.replace(/[^\w\s]/g, '').trim();
  return cleaned.length > 50 ? cleaned.slice(0, 47) + '...' : cleaned;
}

/**
 * Validate UUID format
 * SECURITY: Strict validation to prevent injection attacks
 */
export function isValidUUID(uuid: string): boolean {
  if (typeof uuid !== 'string') return false;
  if (uuid.length !== 36) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Validate request body size to prevent memory exhaustion attacks
 * SECURITY: Enforce maximum request size
 */
export async function validateRequestSize(
  request: Request,
  maxSizeBytes: number = 1048576 // 1MB default
): Promise<{ valid: boolean; error?: string }> {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSizeBytes) {
      return {
        valid: false,
        error: `Request body too large. Maximum size: ${maxSizeBytes} bytes`
      };
    }
  }
  
  return { valid: true };
}
