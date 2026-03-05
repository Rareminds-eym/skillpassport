/**
 * Supabase helper functions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types';
import { isValidHttpUrl } from './helpers';

/**
 * Get Supabase URL with fallback and validation
 */
export function getSupabaseUrl(env: Env): string {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL is not configured');
  }
  if (!isValidHttpUrl(url)) {
    throw new Error(`Invalid SUPABASE_URL: Must be a valid HTTP or HTTPS URL`);
  }
  return url;
}

/**
 * Get Supabase Anon Key with fallback
 */
export function getSupabaseAnonKey(env: Env): string {
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('SUPABASE_ANON_KEY is not configured');
  }
  return key;
}

/**
 * Create a Supabase admin client (with service role key)
 */
export function createSupabaseAdmin(env: Env): SupabaseClient {
  const supabaseUrl = getSupabaseUrl(env);
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return createClient(supabaseUrl, serviceRoleKey);
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
