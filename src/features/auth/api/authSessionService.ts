import { supabase } from '@/shared/api/supabaseClient';
import { logAuthEvent, generateCorrelationId, mapSupabaseError } from '@/features/auth/lib';

/**
 * Auth Session Service
 * Centralized service for all Supabase auth session operations
 * Extracted from page components to maintain FSD architecture
 */

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Get current session
 * @returns {Promise<{ session: object | null, error: any | null }>}
 */
export const getSession = async () => {
  const correlationId = generateCorrelationId();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logAuthEvent('warn', 'Get session failed', { correlationId, errorCode: mapSupabaseError(error) });
      return { session: null, error };
    }
    
    return { session, error: null };
  } catch (error) {
    logAuthEvent('error', 'Get session error', { correlationId });
    return { session: null, error };
  }
};

/**
 * Get current authenticated user
 * @returns {Promise<{ user: object | null, error: any | null }>}
 */
export const getUser = async () => {
  const correlationId = generateCorrelationId();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logAuthEvent('warn', 'Get user failed', { correlationId, errorCode: mapSupabaseError(error) });
      return { user: null, error };
    }
    
    return { user, error: null };
  } catch (error) {
    logAuthEvent('error', 'Get user error', { correlationId });
    return { user: null, error };
  }
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {object} Subscription object with unsubscribe method
 */
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
};

/**
 * Sign in with password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ data: object | null, error: any | null }>}
 */
export const signInWithPassword = async (email: string, password: string) => {
  const correlationId = generateCorrelationId();
  
  try {
    logAuthEvent('info', 'Sign in with password attempt', { correlationId });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logAuthEvent('error', 'Sign in with password failed', { correlationId, errorCode: mapSupabaseError(error) });
      return { data: null, error };
    }
    
    logAuthEvent('info', 'Sign in with password successful', { correlationId, userId: data.user?.id });
    return { data, error: null };
  } catch (error) {
    logAuthEvent('error', 'Sign in with password error', { correlationId });
    return { data: null, error };
  }
};

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

/**
 * List all users (admin only)
 * @returns {Promise<{ users: array | null, error: any | null }>}
 */
export const listUsers = async () => {
  const correlationId = generateCorrelationId();
  
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      logAuthEvent('error', 'List users failed', { correlationId, errorCode: mapSupabaseError(error) });
      return { users: null, error };
    }
    
    return { users: data?.users || [], error: null };
  } catch (error) {
    logAuthEvent('error', 'List users error', { correlationId });
    return { users: null, error };
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export const authSessionService = {
  getSession,
  getUser,
  onAuthStateChange,
  signInWithPassword,
  listUsers,
};
