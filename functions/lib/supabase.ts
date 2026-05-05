import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client using the service_role key.
 * This bypasses RLS and should only be used in Pages Functions
 * after the request has been authenticated via withAuth.
 */
export function getServiceClient(env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
