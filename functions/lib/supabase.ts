import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from './types';

/**
 * Create a Supabase client with anon key (for authenticated requests with RLS)
 * This client respects Row Level Security policies.
 * 
 * @param env - Pages environment variables
 * @returns Supabase client using the native package types
 */
export function createSupabaseClient(env: PagesEnv): SupabaseClient {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create a Supabase admin client with service role key (for privileged operations)
 * This client bypasses Row Level Security - use with caution!
 * 
 * 🔐 SECURITY: This should only be used in server-side Pages Functions after
 * authentication has been verified via withAuth middleware.
 * 
 * @param env - Pages environment variables
 * @param context - Optional user context for audit logging (userId, orgId, etc.)
 * @returns Supabase client using the native package types
 */
export function createSupabaseAdminClient(
  env: PagesEnv,
  context?: {
    userId?: string;
    orgId?: string;
    ipAddress?: string;
    requestId?: string;
  }
): SupabaseClient {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required Supabase admin environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create a Supabase client using the service_role key.
 * This bypasses RLS and should only be used in Pages Functions
 * after the request has been authenticated via withAuth.
 * 
 * @deprecated Use createSupabaseAdminClient instead for better type safety and audit logging
 */
export function getServiceClient(env: PagesEnv): SupabaseClient {
  return createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Extract authorization token from request headers
 */
export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}
