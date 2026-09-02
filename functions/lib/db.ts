import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from './types';

export interface DbClient {
  from: SupabaseClient['from'];
  rpc: SupabaseClient['rpc'];
}

/**
 * Creates a Supabase client with service role key for server-side operations
 */
export function createDb(env: PagesEnv): DbClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return {
    from: client.from.bind(client),
    rpc: client.rpc.bind(client),
  };
}
