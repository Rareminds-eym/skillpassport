/**
 * Supabase helper functions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env } from '../types';
import { isValidHttpUrl } from '../utils';

/**
 * Get Supabase URL with fallback and validation
 */
export function getSupabaseUrl(env: Env): string {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL is not configured. Set it as a Cloudflare secret via: wrangler secret put SUPABASE_URL');
  }
  if (!isValidHttpUrl(url)) {
    throw new Error(`Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL. Got: "${url.substring(0, 50)}...". Ensure SUPABASE_URL is set correctly as a Cloudflare secret.`);
  }
  return url;
}

/**
 * Get Supabase Anon Key with fallback
 */
export function getSupabaseAnonKey(env: Env): string {
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('SUPABASE_ANON_KEY is not configured. Set it as a Cloudflare secret via: wrangler secret put SUPABASE_ANON_KEY');
  }
  return key;
}

/**
 * Create a Supabase admin client (with service role key)
 */
export function createSupabaseAdmin(env: Env): SupabaseClient {
  const supabaseUrl = getSupabaseUrl(env);
  return createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Create a Supabase client with user's auth token
 */
export function createSupabaseClient(env: Env, authHeader: string): SupabaseClient {
  const supabaseUrl = getSupabaseUrl(env);
  return createClient(supabaseUrl, getSupabaseAnonKey(env), {
    global: { headers: { Authorization: authHeader } },
  });
}
