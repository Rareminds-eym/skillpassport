/**
 * Supabase Client Factory
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types';

/**
 * Create a read-only Supabase client using anon key
 */
export function getReadClient(env: Env): SupabaseClient {
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
}

/**
 * Create a write-enabled Supabase client
 * Uses service role key if available, falls back to anon key
 */
export function getWriteClient(env: Env): SupabaseClient {
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
  const key = serviceKey || env.VITE_SUPABASE_ANON_KEY;
  
  if (!serviceKey) {
    console.warn('⚠️ [getWriteClient] Service role key not configured, falling back to anon key. Cache writes may fail due to RLS policies.');
  } else {
    console.log('✅ [getWriteClient] Using service role key for write operations');
  }
  
  return createClient(env.VITE_SUPABASE_URL, key);
}
