/**
 * Supabase client utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env, AuthResult } from '../types';

/**
 * Get Supabase URL from environment
 */
export function getSupabaseUrl(env: Env): string {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is not configured');
  return url;
}

/**
 * Create Supabase admin client with service role key
 */
export function getSupabaseAdmin(env: Env): SupabaseClient {
  return createClient(getSupabaseUrl(env), env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Authenticate user from request Authorization header
 */
export async function authenticateUser(
  request: Request,
  env: Env
): Promise<AuthResult | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseAdmin = getSupabaseAdmin(env);

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  return { user, supabaseAdmin };
}

/**
 * Check if email exists in auth users
 */
export async function checkEmailExists(
  supabaseAdmin: SupabaseClient,
  email: string
): Promise<boolean> {
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  return existingUsers?.users?.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  ) ?? false;
}

/**
 * Create auth user with metadata
 */
export async function createAuthUser(
  supabaseAdmin: SupabaseClient,
  email: string,
  password: string,
  metadata: Record<string, any>
): Promise<{ user: any; error: any }> {
  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

  return { user: authUser?.user, error: authError };
}

/**
 * Delete auth user (for rollback)
 */
export async function deleteAuthUser(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<void> {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}
