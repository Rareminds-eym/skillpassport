/**
 * Authentication utilities for the Assessment API
 */

import { createClient } from '@supabase/supabase-js';
import type { Env, AuthResult } from '../types';

/**
 * Authenticate user from JWT token in Authorization header
 */
export async function authenticateUser(request: Request, env: Env): Promise<AuthResult | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  const supabaseAdmin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  return { user, supabase, supabaseAdmin };
}

/**
 * Get OpenRouter API key from environment
 */
export const getOpenRouterKey = (env: Env): string | undefined => {
  return env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
};
