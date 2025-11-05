import { supabase } from '../lib/supabaseClient';

/**
 * Authentication Service
 * Handles user authentication checks and role management
 */

/**
 * Check if user is authenticated
 * @returns {Promise<{ isAuthenticated: boolean, user: object | null, role: string | null }>}
 */
export const checkAuthentication = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking authentication:', error);
      return {
        isAuthenticated: false,
        user: null,
        role: null,
        error: error.message
      };
    }

    if (!session || !session.user) {
      return {
        isAuthenticated: false,
        user: null,
        role: null
      };
    }

    // Extract role from raw_user_meta_data
    const role = session.user.raw_user_meta_data?.role || 
                 session.user.user_metadata?.role || 
                 null;

    return {
      isAuthenticated: true,
      user: session.user,
      role: role,
      session: session
    };
  } catch (error) {
    console.error('Unexpected error checking authentication:', error);
    return {
      isAuthenticated: false,
      user: null,
      role: null,
      error: error.message
    };
  }
};

/**
 * Sign up a new user with role
 * @param {string} email 
 * @param {string} password 
 * @param {object} userData - Additional user data including role
 * @returns {Promise<{ success: boolean, user: object | null, error: string | null }>}
 */
export const signUpWithRole = async (email, password, userData = {}) => {
  try {
    // Sign up with email confirmation disabled for smooth flow
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: userData.role || 'student',
          name: userData.name || '',
          phone: userData.phone || '',
          ...userData
        },
        // This helps avoid the "Database error saving new user" issue
        emailRedirectTo: undefined
      }
    });

    if (error) {
      console.error('❌ Sign up error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Database error')) {
        return {
          success: false,
          user: null,
          error: 'Unable to create account. The email might already be registered or there is a database configuration issue. Please try a different email or contact support.'
        };
      }
      
      if (error.message.includes('already registered')) {
        return {
          success: false,
          user: null,
          error: 'This email is already registered. Please sign in instead.'
        };
      }
      
      return {
        success: false,
        user: null,
        error: error.message
      };
    }

    // Check if user was created successfully
    if (!data.user) {
      return {
        success: false,
        user: null,
        error: 'User registration failed. Please try again.'
      };
    }

    console.log('✅ User created successfully:', data.user.id);
    console.log('📧 Email:', data.user.email);
    console.log('🎭 Role:', userData.role);

    return {
      success: true,
      user: data.user,
      session: data.session,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected sign up error:', error);
    return {
      success: false,
      user: null,
      error: error.message || 'An unexpected error occurred during registration.'
    };
  }
};

/**
 * Sign in user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{ success: boolean, user: object | null, role: string | null, error: string | null }>}
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        user: null,
        role: null,
        error: error.message
      };
    }

    const role = data.user?.raw_user_meta_data?.role || 
                 data.user?.user_metadata?.role || 
                 null;

    return {
      success: true,
      user: data.user,
      role: role,
      session: data.session,
      error: null
    };
  } catch (error) {
    console.error('Unexpected sign in error:', error);
    return {
      success: false,
      user: null,
      role: null,
      error: error.message
    };
  }
};

/**
 * Sign out user
 * @returns {Promise<{ success: boolean, error: string | null }>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error('Unexpected sign out error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if user has specific role
 * @param {string} requiredRole 
 * @returns {Promise<{ hasRole: boolean, role: string | null }>}
 */
export const checkUserRole = async (requiredRole) => {
  try {
    const { isAuthenticated, role } = await checkAuthentication();

    if (!isAuthenticated) {
      return {
        hasRole: false,
        role: null
      };
    }

    return {
      hasRole: role === requiredRole,
      role: role
    };
  } catch (error) {
    console.error('Error checking user role:', error);
    return {
      hasRole: false,
      role: null
    };
  }
};

/**
 * Update user metadata including role
 * @param {object} metadata 
 * @returns {Promise<{ success: boolean, error: string | null }>}
 */
export const updateUserMetadata = async (metadata) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    });

    if (error) {
      console.error('Update metadata error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      user: data.user,
      error: null
    };
  } catch (error) {
    console.error('Unexpected update metadata error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get current authenticated user with role
 * @returns {Promise<{ user: object | null, role: string | null }>}
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return {
        user: null,
        role: null
      };
    }

    const role = user?.raw_user_meta_data?.role || 
                 user?.user_metadata?.role || 
                 null;

    return {
      user: user,
      role: role
    };
  } catch (error) {
    console.error('Unexpected error getting current user:', error);
    return {
      user: null,
      role: null
    };
  }
};

