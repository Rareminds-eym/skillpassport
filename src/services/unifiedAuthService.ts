import { supabase } from '../lib/supabaseClient';

/**
 * Unified Authentication Service
 * Handles authentication for all user roles through a single interface
 */

export type UserRole = 'student' | 'recruiter' | 'educator' | 'school_admin' | 'college_admin' | 'university_admin';

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role?: UserRole;
    metadata?: Record<string, any>;
  };
  error?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  metadata?: Record<string, any>;
}

/**
 * Sign in user with email and password
 * @param email - User email
 * @param password - User password
 * @returns AuthResult with user data or error
 */
export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      console.error('Authentication error:', error);
      
      // Return user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }
      
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Please verify your email address'
        };
      }

      return {
        success: false,
        error: 'Network error. Please try again'
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Authentication failed. Please try again'
      };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || '',
        metadata: data.user.user_metadata
      }
    };
  } catch (error) {
    console.error('Unexpected authentication error:', error);
    return {
      success: false,
      error: 'Network error. Please try again'
    };
  }
};

/**
 * Sign out current user
 * @returns Promise with success status
 */
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
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
      success: true
    };
  } catch (error) {
    console.error('Unexpected sign out error:', error);
    return {
      success: false,
      error: 'Failed to sign out'
    };
  }
};

/**
 * Send password reset email
 * @param email - User email
 * @returns Promise with success status
 */
export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!email) {
      return {
        success: false,
        error: 'Email is required'
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Failed to send reset email. Please try again'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Unexpected password reset error:', error);
    return {
      success: false,
      error: 'Network error. Please try again'
    };
  }
};

/**
 * Update user password
 * @param newPassword - New password
 * @returns Promise with success status
 */
export const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!newPassword) {
      return {
        success: false,
        error: 'Password is required'
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Password update error:', error);
      return {
        success: false,
        error: 'Failed to update password'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Unexpected password update error:', error);
    return {
      success: false,
      error: 'Failed to update password'
    };
  }
};
