/**
 * Supabase client factory for Cloudflare Pages Functions
 * Creates Supabase clients with proper configuration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Environment variables interface for Pages Functions
 */
export interface PagesEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

/**
 * Create a Supabase client with anon key (for authenticated requests)
 */
export function createSupabaseClient(env: PagesEnv): SupabaseClient {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required Supabase environment variables');
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
 */
export function createSupabaseAdminClient(env: PagesEnv): SupabaseClient {
  if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required Supabase admin environment variables');
  }

  return createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
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

/**
 * Authenticate a request and return user info
 */
export async function authenticateRequest(
  request: Request,
  env: PagesEnv
): Promise<{ user: any; supabase: SupabaseClient } | null> {
  const token = getAuthToken(request);
  if (!token) return null;

  const supabase = createSupabaseClient(env);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  return { user, supabase };
}
