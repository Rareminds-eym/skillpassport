import { supabase } from '../lib/supabaseClient';
import { sendPasswordResetOTP as sendOTP, verifyOTPAndResetPassword as verifyOTP } from './passwordResetService';

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
 * Send password reset OTP via email
 * @param email - User email
 * @returns Promise with success status
 */
export const sendPasswordResetOTP = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!email) {
      return {
        success: false,
        error: 'Email is required'
      };
    }

    return await sendOTP(email);
  } catch (error) {
    console.error('Password reset OTP error:', error);
    return {
      success: false,
      error: 'Network error. Please try again'
    };
  }
};

/**
 * Verify OTP and reset password
 * @param email - User email
 * @param otp - 6-digit OTP code
 * @param newPassword - New password
 * @returns Promise with success status
 */
export const verifyOTPAndResetPassword = async (
  email: string, 
  otp: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!email || !otp || !newPassword) {
      return {
        success: false,
        error: 'Email, OTP, and new password are required'
      };
    }

    if (!/^\d{6}$/.test(otp)) {
      return {
        success: false,
        error: 'OTP must be 6 digits'
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long'
      };
    }

    return await verifyOTP(email, otp, newPassword);
  } catch (error) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      error: 'Network error. Please try again'
    };
  }
};

/**
 * Send password reset email (legacy method - kept for backward compatibility)
 * @param email - User email
 * @returns Promise with success status
 */
export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  // For now, redirect to the new OTP-based method
  return sendPasswordResetOTP(email);
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
