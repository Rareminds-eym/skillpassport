import { supabase } from '../lib/supabaseClient';
import {
  AUTH_ERROR_CODES,
  AuthError,
  buildErrorResponse,
  generateCorrelationId,
  handleAuthError,
  logAuthEvent,
  mapSupabaseError,
  validateCredentials,
  validateEmail,
  validatePassword,
  withRetry,
  withTimeout,
} from '../utils/authErrorHandler';
import userApiService from './userApiService';

/**
 * Authentication Service
 * Industrial-grade authentication with comprehensive error handling
 *
 * Features:
 * - Input validation and sanitization
 * - Standardized error codes
 * - Retry logic for transient failures
 * - Secure logging (no sensitive data exposure)
 * - Timeout handling
 * - Rate limit detection
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 2;

// ============================================================================
// CHECK AUTHENTICATION
// ============================================================================

/**
 * Check if user is authenticated
 * @returns {Promise<{ isAuthenticated: boolean, user: object | null, role: string | null }>}
 */
export const checkAuthentication = async () => {
  const correlationId = generateCorrelationId();

  try {
    const sessionPromise = supabase.auth.getSession();
    const {
      data: { session },
      error,
    } = await withTimeout(sessionPromise, AUTH_TIMEOUT_MS);

    if (error) {
      logAuthEvent('warn', 'Session check failed', {
        correlationId,
        errorCode: mapSupabaseError(error),
      });
      return {
        isAuthenticated: false,
        user: null,
        role: null,
        error: 'Unable to verify session. Please try again.',
      };
    }

    if (!session || !session.user) {
      return {
        isAuthenticated: false,
        user: null,
        role: null,
      };
    }

    // Extract role from user metadata - check user_role first (set by UnifiedSignup)
    const role =
      session.user.user_metadata?.user_role ||
      session.user.user_metadata?.role ||
      session.user.raw_user_meta_data?.user_role ||
      session.user.raw_user_meta_data?.role ||
      null;

    logAuthEvent('info', 'Session verified', { correlationId, userId: session.user.id, role });

    return {
      isAuthenticated: true,
      user: session.user,
      role: role,
      session: session,
    };
  } catch (error) {
    const errorCode = error instanceof AuthError ? error.code : mapSupabaseError(error);
    logAuthEvent('error', 'Authentication check failed', { correlationId, errorCode });

    return {
      isAuthenticated: false,
      user: null,
      role: null,
      error: 'Unable to verify authentication status.',
    };
  }
};

// ============================================================================
// SIGN UP
// ============================================================================

/**
 * Sign up a new user with role
 * Uses the Worker API for proper rollback handling - no orphaned users
 * @param {string} email
 * @param {string} password
 * @param {object} userData - Additional user data including role
 * @returns {Promise<{ success: boolean, user: object | null, error: string | null }>}
 */
export const signUpWithRole = async (email, password, userData = {}) => {
  const correlationId = generateCorrelationId();

  try {
    // Validate inputs
    const validation = validateCredentials(email, password);
    if (!validation.valid) {
      logAuthEvent('warn', 'Signup validation failed', { correlationId, field: validation.field });
      return buildErrorResponse(validation.code, { field: validation.field });
    }

    // Additional password strength check for signup
    if (password.length < 6) {
      return buildErrorResponse(AUTH_ERROR_CODES.PASSWORD_TOO_WEAK);
    }

    logAuthEvent('info', 'Signup attempt via Worker API', {
      correlationId,
      email: validation.email,
    });

    // Parse name into firstName and lastName
    const nameParts = (userData.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Map role to worker API expected format
    const roleMapping = {
      student: userData.studentType === 'college' ? 'college_student' : 'school_student',
      school_student: 'school_student',
      college_student: 'college_student',
      educator: 'school_educator',
      school_educator: 'school_educator',
      college_educator: 'college_educator',
      recruiter: 'recruiter',
      admin: 'school_admin',
      school_admin: 'school_admin',
      college_admin: 'college_admin',
      university_admin: 'university_admin',
    };

    const mappedRole = roleMapping[userData.role] || 'school_student';

    // Use Worker API for signup with proper rollback
    const result = await userApiService.unifiedSignup({
      email: validation.email,
      password,
      firstName,
      lastName,
      role: mappedRole,
      phone: userData.phone || null,
      dateOfBirth: userData.dateOfBirth || null,
      country: userData.country || null,
      state: userData.state || null,
      city: userData.city || null,
      preferredLanguage: userData.preferredLanguage || null,
      referralCode: userData.referralCode || null,
    });

    logAuthEvent('info', 'Signup successful via Worker API', {
      correlationId,
      userId: result.data?.userId,
    });

    // Return in the expected format for compatibility
    return {
      success: true,
      user: {
        id: result.data?.userId,
        email: result.data?.email,
        user_metadata: {
          name: result.data?.name,
          role: result.data?.role,
        },
      },
      session: null, // Worker API doesn't return session, user needs to login
      requiresEmailConfirmation: false, // Worker API confirms email automatically
      error: null,
    };
  } catch (error) {
    const errorCode = mapSupabaseError(error);
    logAuthEvent('error', 'Signup failed', { correlationId, errorCode, message: error.message });

    // Handle specific signup errors with user-friendly messages
    if (error.message?.includes('already registered')) {
      return buildErrorResponse(AUTH_ERROR_CODES.INVALID_CREDENTIALS, {
        customMessage: 'This email is already registered. Please sign in instead.',
      });
    }

    if (error.message?.includes('phone number is already registered')) {
      return {
        success: false,
        user: null,
        error: error.message,
        errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        correlationId,
      };
    }

    return {
      success: false,
      user: null,
      error: error.message || 'Unable to create account. Please try again.',
      errorCode: errorCode,
      correlationId,
    };
  }
};

// ============================================================================
// SIGN IN
// ============================================================================

/**
 * Sign in user with comprehensive error handling
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, user: object | null, role: string | null, error: string | null }>}
 */
export const signIn = async (email, password) => {
  const correlationId = generateCorrelationId();

  try {
    // Validate inputs
    const validation = validateCredentials(email, password);
    if (!validation.valid) {
      logAuthEvent('warn', 'Sign-in validation failed', { correlationId, field: validation.field });
      return buildErrorResponse(validation.code, { field: validation.field });
    }

    logAuthEvent('info', 'Sign-in attempt', { correlationId });

    // Perform sign-in with retry for transient failures
    const signInOperation = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.email,
        password,
      });

      if (error) {
        throw error;
      }

      return data;
    };

    // withRetry returns a function, so we need to call it to get the promise
    const retryableSignIn = withRetry(signInOperation, {
      maxRetries: 1, // Fewer retries for login to prevent lockouts
      shouldRetry: (err) => {
        // Don't retry on invalid credentials or rate limits
        const code = err.code || mapSupabaseError(err);
        return ![
          AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          AUTH_ERROR_CODES.RATE_LIMITED,
          AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
          AUTH_ERROR_CODES.ACCOUNT_LOCKED,
        ].includes(code);
      },
    });

    const data = await withTimeout(
      retryableSignIn(), // Call the function to get the promise
      AUTH_TIMEOUT_MS
    );

    const role =
      data.user?.user_metadata?.user_role ||
      data.user?.user_metadata?.role ||
      data.user?.raw_user_meta_data?.user_role ||
      data.user?.raw_user_meta_data?.role ||
      null;

    logAuthEvent('info', 'Sign-in successful', { correlationId, userId: data.user.id, role });

    return {
      success: true,
      user: data.user,
      role: role,
      session: data.session,
      error: null,
    };
  } catch (error) {
    const errorCode = mapSupabaseError(error);
    logAuthEvent('error', 'Sign-in failed', { correlationId, errorCode });

    // Return user-friendly error response
    return handleAuthError(error, { correlationId, operation: 'signin' });
  }
};

// ============================================================================
// SIGN OUT
// ============================================================================

/**
 * Sign out user
 * @returns {Promise<{ success: boolean, error: string | null }>}
 */
export const signOut = async () => {
  const correlationId = generateCorrelationId();

  try {
    logAuthEvent('info', 'Sign-out attempt', { correlationId });

    const { error } = await withTimeout(supabase.auth.signOut(), AUTH_TIMEOUT_MS);

    if (error) {
      logAuthEvent('warn', 'Sign-out error', { correlationId, errorCode: mapSupabaseError(error) });
      // Still return success as the local session should be cleared
      return {
        success: true,
        error: null,
        warning: 'Session cleared locally. Server-side sign-out may have failed.',
      };
    }

    logAuthEvent('info', 'Sign-out successful', { correlationId });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    logAuthEvent('error', 'Sign-out failed', { correlationId });
    // For sign-out, we generally want to proceed even on error
    return {
      success: true,
      error: null,
      warning: 'Sign-out completed with warnings.',
    };
  }
};

// ============================================================================
// ROLE CHECKING
// ============================================================================

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
        role: null,
      };
    }

    return {
      hasRole: role === requiredRole,
      role: role,
    };
  } catch (error) {
    logAuthEvent('error', 'Role check failed', { errorCode: mapSupabaseError(error) });
    return {
      hasRole: false,
      role: null,
    };
  }
};

// ============================================================================
// USER METADATA
// ============================================================================

/**
 * Update user metadata including role
 * @param {object} metadata
 * @returns {Promise<{ success: boolean, error: string | null }>}
 */
export const updateUserMetadata = async (metadata) => {
  const correlationId = generateCorrelationId();

  try {
    if (!metadata || typeof metadata !== 'object') {
      return buildErrorResponse(AUTH_ERROR_CODES.INVALID_INPUT_FORMAT);
    }

    logAuthEvent('info', 'Metadata update attempt', { correlationId });

    const { data, error } = await withTimeout(
      supabase.auth.updateUser({ data: metadata }),
      AUTH_TIMEOUT_MS
    );

    if (error) {
      logAuthEvent('error', 'Metadata update failed', {
        correlationId,
        errorCode: mapSupabaseError(error),
      });
      return handleAuthError(error, { correlationId, operation: 'updateMetadata' });
    }

    logAuthEvent('info', 'Metadata update successful', { correlationId });

    return {
      success: true,
      user: data.user,
      error: null,
    };
  } catch (error) {
    return handleAuthError(error, { correlationId, operation: 'updateMetadata' });
  }
};

// ============================================================================
// GET CURRENT USER
// ============================================================================

/**
 * Get current authenticated user with role
 * @returns {Promise<{ user: object | null, role: string | null }>}
 */
export const getCurrentUser = async () => {
  const correlationId = generateCorrelationId();

  try {
    const {
      data: { user },
      error,
    } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS);

    if (error) {
      logAuthEvent('warn', 'Get current user failed', {
        correlationId,
        errorCode: mapSupabaseError(error),
      });
      return {
        user: null,
        role: null,
      };
    }

    const role =
      user?.user_metadata?.user_role ||
      user?.user_metadata?.role ||
      user?.raw_user_meta_data?.user_role ||
      user?.raw_user_meta_data?.role ||
      null;

    return {
      user: user,
      role: role,
    };
  } catch (error) {
    logAuthEvent('error', 'Get current user error', { correlationId });
    return {
      user: null,
      role: null,
    };
  }
};

// ============================================================================
// PASSWORD RESET
// ============================================================================

/**
 * Send password reset OTP via Edge Function
 * @param {string} email
 * @returns {Promise<{ success: boolean, error: string | null }>}
 */
export const sendPasswordResetOtp = async (email) => {
  const correlationId = generateCorrelationId();

  try {
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return buildErrorResponse(emailValidation.code);
    }

    logAuthEvent('info', 'Password reset OTP request', { correlationId });

    const { data, error } = await withTimeout(
      (async () => {
        try {
          const result = await userApiService.resetPassword({
            action: 'send',
            email: emailValidation.sanitized,
          });
          return { data: result, error: null };
        } catch (err) {
          return { data: null, error: err };
        }
      })(),
      AUTH_TIMEOUT_MS
    );

    if (error) {
      logAuthEvent('error', 'Password reset OTP failed', {
        correlationId,
        errorCode: mapSupabaseError(error),
      });
      return handleAuthError(error, { correlationId, operation: 'sendResetOtp' });
    }

    if (!data?.success) {
      return {
        success: false,
        error: 'Unable to send reset code. Please try again later.',
        correlationId,
      };
    }

    logAuthEvent('info', 'Password reset OTP sent', { correlationId });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return handleAuthError(error, { correlationId, operation: 'sendResetOtp' });
  }
};

/**
 * Verify OTP and reset password via Edge Function
 * @param {string} email
 * @param {string} otp
 * @param {string} newPassword
 * @returns {Promise<{ success: boolean, error: string | null }>}
 */
export const verifyOtpAndResetPassword = async (email, otp, newPassword) => {
  const correlationId = generateCorrelationId();

  try {
    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return buildErrorResponse(emailValidation.code);
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return buildErrorResponse(passwordValidation.code);
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length === 0) {
      return buildErrorResponse(AUTH_ERROR_CODES.INVALID_INPUT_FORMAT, {
        customMessage: 'Please enter the verification code.',
      });
    }

    logAuthEvent('info', 'Password reset verification', { correlationId });

    const { data, error } = await withTimeout(
      (async () => {
        try {
          const result = await userApiService.resetPassword({
            action: 'verify',
            email: emailValidation.sanitized,
            otp: otp.trim(),
            newPassword,
          });
          return { data: result, error: null };
        } catch (err) {
          return { data: null, error: err };
        }
      })(),
      AUTH_TIMEOUT_MS
    );

    if (error) {
      logAuthEvent('error', 'Password reset verification failed', { correlationId });
      return handleAuthError(error, { correlationId, operation: 'verifyResetOtp' });
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || 'Invalid or expired verification code.',
        correlationId,
      };
    }

    // Attempt auto-login after successful reset
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailValidation.sanitized,
        password: newPassword,
      });

      if (signInError) {
        logAuthEvent('warn', 'Auto-login after reset failed', { correlationId });
        return {
          success: true,
          error: null,
          message: 'Password reset successful. Please log in with your new password.',
        };
      }
    } catch {
      // Auto-login failed, but password reset was successful
      return {
        success: true,
        error: null,
        message: 'Password reset successful. Please log in with your new password.',
      };
    }

    logAuthEvent('info', 'Password reset and auto-login successful', { correlationId });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    return handleAuthError(error, { correlationId, operation: 'verifyResetOtp' });
  }
};
