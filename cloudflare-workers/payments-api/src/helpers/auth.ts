/**
 * Authentication helper functions
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Env } from '../types';
import { createSupabaseAdmin, createSupabaseClient } from './supabase';

export interface AuthResult {
  user: any;
  supabase: SupabaseClient;
}

/**
 * Authenticate user from request Authorization header
 * Returns user object and authenticated Supabase client
 */
export async function authenticateUser(
  request: Request, 
  env: Env
): Promise<AuthResult | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseAdmin = createSupabaseAdmin(env);
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const supabase = createSupabaseClient(env, authHeader);

  return { user, supabase };
}

/**
 * Get user ID from request (requires authentication)
 */
export async function getUserId(request: Request, env: Env): Promise<string | null> {
  const auth = await authenticateUser(request, env);
  return auth?.user?.id || null;
}
