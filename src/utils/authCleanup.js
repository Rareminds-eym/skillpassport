/**
 * Auth Cleanup Utilities
 * Handles cleanup of stale localStorage data for authentication
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Clear all stale authentication data from localStorage
 * Call this when user is not authenticated or session is invalid
 */
export const clearStaleAuthData = () => {
  console.log('🧹 Clearing stale auth data from localStorage');
  localStorage.removeItem('user');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('pendingUser');
  localStorage.removeItem('payment_plan_details');
};

/**
 * Validate that localStorage user matches Supabase session
 * Returns true if valid, false if stale data was cleared
 */
export const validateLocalStorageUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      // No valid session - clear any stale localStorage data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Allow demo users
          if (parsedUser.isDemoMode || parsedUser.id?.includes('-001')) {
            return true;
          }
        } catch (e) {
          // Parse error - clear data
        }
        clearStaleAuthData();
        return false;
      }
      return true; // No stored user, nothing to clear
    }

    // Session exists - verify localStorage matches
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const userMatches = 
          parsedUser.id === session.user.id ||
          parsedUser.user_id === session.user.id ||
          parsedUser.email === session.user.email;
        
        if (!userMatches) {
          console.warn('⚠️ localStorage user does not match session user');
          clearStaleAuthData();
          return false;
        }
      } catch (e) {
        clearStaleAuthData();
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating localStorage user:', error);
    return true; // Don't clear on error
  }
};

/**
 * Check if user exists in database
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} True if user exists
 */
export const userExistsInDatabase = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    return !error && !!data;
  } catch (error) {
    console.error('Error checking user in database:', error);
    return false;
  }
};

/**
 * Clean up pending user data after successful payment/registration
 */
export const clearPendingUserData = () => {
  localStorage.removeItem('pendingUser');
  localStorage.removeItem('payment_plan_details');
};

export default {
  clearStaleAuthData,
  validateLocalStorageUser,
  userExistsInDatabase,
  clearPendingUserData,
};
