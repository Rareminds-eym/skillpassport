// Authentication utilities for Cloudflare Pages Functions
// Shared across all APIs

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthResult {
  user: AuthUser;
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
}

/**
 * Authenticate user from Authorization header
 * Tries JWT decode first, then falls back to Supabase auth
 */
export async function authenticateUser(
  request: Request,
  env: Record<string, string>
): Promise<AuthResult | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  let userId: string | null = null;

  // Method 1: Decode JWT directly (faster)
  let userEmail: string | undefined;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.sub) {
        userId = payload.sub;
        userEmail = payload.email;
        console.log(`Auth: User authenticated via JWT - ${userId}`);
      }
    }
  } catch (jwtErr) {
    console.warn('JWT decode failed:', jwtErr);
  }

  // Get Supabase URL with fallback
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  
  // Debug logging
  console.log('🔍 Auth Debug - Available env vars:', {
    hasSupabaseUrl: !!env.SUPABASE_URL,
    hasViteSupabaseUrl: !!env.VITE_SUPABASE_URL,
    hasSupabaseAnonKey: !!env.SUPABASE_ANON_KEY,
    hasViteSupabaseAnonKey: !!env.VITE_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
    resolvedUrl: supabaseUrl ? 'present' : 'missing',
    resolvedAnonKey: supabaseAnonKey ? 'present' : 'missing'
  });
  
  if (!supabaseUrl) {
    console.error('❌ Missing SUPABASE_URL or VITE_SUPABASE_URL environment variable');
    return null;
  }

  // Method 2: Fallback to Supabase auth with service role
  if (!userId && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (!authError && authUser) {
        userId = authUser.id;
        userEmail = authUser.email;
        console.log(`Auth: User authenticated via service role - ${userId}`);
      }
    } catch (authErr) {
      console.warn('Service role auth error:', authErr);
    }
  }

  if (!userId) return null;

  // Create Supabase clients
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  return {
    user: { id: userId, email: userEmail },
    supabase,
    supabaseAdmin,
  };
}

/**
 * Sanitize user input to prevent XSS and limit length
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, 2000); // Limit length
}

/**
 * Generate a conversation title from the first message
 */
export function generateConversationTitle(message: string): string {
  const cleaned = message.replace(/[^\w\s]/g, '').trim();
  return cleaned.length > 50 ? cleaned.slice(0, 47) + '...' : cleaned;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}
