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
 * SECURITY: Uses Supabase's built-in JWT verification for production-grade security
 */
export async function authenticateUser(
  request: Request,
  env: Record<string, string>
): Promise<AuthResult | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');

  // Get Supabase URL with fallback
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration');
    return null;
  }

  // SECURITY: Use Supabase's getUser() which validates JWT signature
  // This prevents token forgery attacks
  try {
    const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      console.warn('Authentication failed:', authError?.message);
      return null;
    }

    const userId = authUser.id;
    const userEmail = authUser.email;
    
    console.log(`✓ Auth: User authenticated - ${userId}`);

    // Create Supabase clients
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    return {
      user: { id: userId, email: userEmail },
      supabase,
      supabaseAdmin,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Sanitize user input to prevent XSS, injection attacks, and limit length
 * SECURITY: Enhanced validation for production use
 */
export function sanitizeInput(input: string, maxLength: number = 2000): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove angle brackets
    .replace(/[<>]/g, '')
    // Remove control characters except newline, tab, carriage return
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize Unicode to prevent homograph attacks
    .normalize('NFKC')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
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
 * SECURITY: Strict validation to prevent injection attacks
 */
export function isValidUUID(uuid: string): boolean {
  if (typeof uuid !== 'string') return false;
  if (uuid.length !== 36) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Validate request body size to prevent memory exhaustion attacks
 * SECURITY: Enforce maximum request size
 */
export async function validateRequestSize(
  request: Request,
  maxSizeBytes: number = 1048576 // 1MB default
): Promise<{ valid: boolean; error?: string }> {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSizeBytes) {
      return {
        valid: false,
        error: `Request body too large. Maximum size: ${maxSizeBytes} bytes`
      };
    }
  }
  
  return { valid: true };
}
