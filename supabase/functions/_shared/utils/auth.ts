// Authentication utilities for Edge Functions

import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

export interface AuthUser {
  id: string;
}

/**
 * Authenticate user from Authorization header
 * Tries JWT decode first, then falls back to Supabase auth
 */
export async function authenticateUser(
  authHeader: string | null,
  supabaseUrl: string,
  serviceRoleKey?: string
): Promise<AuthUser | null> {
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  let user: AuthUser | null = null;

  // Method 1: Decode JWT directly
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.sub) {
        user = { id: payload.sub };
        console.log(`Auth: User authenticated via JWT - ${user.id}`);
        return user;
      }
    }
  } catch (jwtErr) {
    console.warn('JWT decode failed:', jwtErr);
  }

  // Method 2: Fallback to Supabase auth with service role
  if (!user && serviceRoleKey) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (!authError && authUser) {
        user = { id: authUser.id };
        console.log(`Auth: User authenticated via service role - ${user.id}`);
        return user;
      }
    } catch (authErr) {
      console.warn('Service role auth error:', authErr);
    }
  }

  return null;
}
