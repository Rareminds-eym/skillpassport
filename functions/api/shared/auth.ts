// Authentication utilities for Cloudflare Pages Functions
// Shared across all APIs

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { initAuth, verifyJWT } from '@rareminds-eym/auth-core';

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthResult {
  user: AuthUser;
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
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

  // Resolve SSO domain — same logic as functions/lib/auth.ts
  const ssoDomain = env.SSO_DOMAIN || env.VITE_SSO_URL;
  if (!ssoDomain) {
    console.error('❌ Missing SSO_DOMAIN configuration');
    return null;
  }

  // Resolve Supabase config
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration');
    return null;
  }

  try {
    // Initialize auth-core with the SSO domain (safe to call per-request)
    initAuth({ ssoDomain });

    // Verify the SSO JWT via JWKS — same as withAuth in functions/lib/auth.ts
    const authUser = await verifyJWT(token);

    console.log(`✓ Auth: User authenticated via SSO JWT - ${authUser.sub}`);

    // Build Supabase clients for downstream handlers that need DB access
    const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    return {
      user: { id: authUser.sub, email: authUser.email },
      supabase,
      supabaseAdmin,
    };
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
