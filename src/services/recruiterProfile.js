import { supabase } from "../lib/supabaseClient";
import {
  AUTH_ERROR_CODES,
  validateCredentials,
  validateEmail,
  mapSupabaseError,
  handleAuthError,
  logAuthEvent,
  withRetry,
  withTimeout,
  buildErrorResponse,
  generateCorrelationId,
} from '../utils/authErrorHandler';

/**
 * Recruiter Profile Service
 * Industrial-grade authentication and profile management for recruiters
 * 
 * Features:
 * - Comprehensive input validation
 * - Standardized error codes
 * - Retry logic for transient failures
 * - Secure logging
 * - Timeout handling
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_TIMEOUT_MS = 30000;
const DB_QUERY_TIMEOUT_MS = 15000;

// ============================================================================
// GET RECRUITER BY EMAIL
// ============================================================================

/**
 * Get recruiter by email
 * @param {string} email - Recruiter email
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function getRecruiterByEmail(email) {
  const correlationId = generateCorrelationId();
  
  try {
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { 
        success: false, 
        data: null,
        error: 'Please enter a valid email address.',
        errorCode: emailValidation.code,
      };
    }

    const { data, error } = await withTimeout(
      supabase
        .from("recruiters")
        .select("*")
        .eq("email", emailValidation.sanitized)
        .maybeSingle(),
      DB_QUERY_TIMEOUT_MS
    );

    if (error) {
      logAuthEvent('error', 'Recruiter lookup by email failed', { correlationId, errorCode: error.code });
      return { 
        success: false, 
        data: null,
        error: 'Unable to find recruiter. Please try again.',
        errorCode: mapSupabaseError(error),
      };
    }

    if (!data) {
      return { 
        success: false, 
        data: null,
        error: 'No recruiter account found with this email. Please check your email or contact support.',
        errorCode: AUTH_ERROR_CODES.USER_NOT_FOUND,
      };
    }

    return { success: true, data, error: null };
  } catch (err) {
    logAuthEvent('error', 'Unexpected error in getRecruiterByEmail', { correlationId });
    return { 
      success: false, 
      data: null,
      error: 'Unable to find recruiter. Please try again later.',
      errorCode: mapSupabaseError(err),
    };
  }
}

// ============================================================================
// GET RECRUITER BY USER ID
// ============================================================================

/**
 * Get recruiter by user_id (auth user id)
 * @param {string} userId - Auth user ID
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function getRecruiterByUserId(userId) {
  const correlationId = generateCorrelationId();
  
  try {
    if (!userId || typeof userId !== 'string') {
      return { 
        success: false, 
        data: null,
        error: 'Invalid user ID.',
        errorCode: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT,
      };
    }

    const { data, error } = await withTimeout(
      supabase
        .from("recruiters")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      DB_QUERY_TIMEOUT_MS
    );

    if (error) {
      logAuthEvent('error', 'Recruiter lookup by userId failed', { correlationId, errorCode: error.code });
      return { 
        success: false, 
        data: null,
        error: 'Unable to load recruiter profile.',
        errorCode: mapSupabaseError(error),
      };
    }

    if (!data) {
      return { 
        success: false, 
        data: null,
        error: 'No recruiter profile found.',
        errorCode: AUTH_ERROR_CODES.PROFILE_NOT_FOUND,
      };
    }

    return { success: true, data, error: null };
  } catch (err) {
    logAuthEvent('error', 'Unexpected error in getRecruiterByUserId', { correlationId });
    return { 
      success: false, 
      data: null,
      error: 'Unable to load recruiter profile.',
      errorCode: mapSupabaseError(err),
    };
  }
}

// ============================================================================
// RECRUITER LOGIN
// ============================================================================

/**
 * Login recruiter with Supabase Auth
 * @param {string} email - Recruiter email
 * @param {string} password - Recruiter password
 * @returns {Promise<{success: boolean, data: object|null, session: object|null, error: string|null}>}
 */
export async function loginRecruiter(email, password) {
  const correlationId = generateCorrelationId();
  
  try {
    // Validate inputs
    const validation = validateCredentials(email, password);
    if (!validation.valid) {
      logAuthEvent('warn', 'Recruiter login validation failed', { correlationId, field: validation.field });
      const response = buildErrorResponse(validation.code);
      return { 
        success: false, 
        data: null,
        session: null,
        error: response.error,
        errorCode: response.errorCode,
        correlationId,
      };
    }

    logAuthEvent('info', 'Recruiter login attempt', { correlationId });

    // Step 1: Authenticate with Supabase Auth
    let authData;
    try {
      const authOperation = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validation.email,
          password,
        });

        if (error) throw error;
        return data;
      };

      authData = await withTimeout(
        withRetry(authOperation, {
          maxRetries: 1,
          shouldRetry: (err) => {
            const code = err.code || mapSupabaseError(err);
            return ![
              AUTH_ERROR_CODES.INVALID_CREDENTIALS,
              AUTH_ERROR_CODES.RATE_LIMITED,
              AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
            ].includes(code);
          },
        }),
        AUTH_TIMEOUT_MS
      );
    } catch (authError) {
      const errorCode = mapSupabaseError(authError);
      logAuthEvent('error', 'Recruiter auth failed', { correlationId, errorCode });
      
      if (errorCode === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
        return {
          success: false,
          data: null,
          session: null,
          error: 'Invalid email or password. Please try again.',
          errorCode,
          correlationId,
        };
      }
      
      if (errorCode === AUTH_ERROR_CODES.RATE_LIMITED || errorCode === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS) {
        return {
          success: false,
          data: null,
          session: null,
          error: 'Too many login attempts. Please wait a few minutes and try again.',
          errorCode,
          correlationId,
        };
      }
      
      const response = handleAuthError(authError, { correlationId, operation: 'recruiterLogin' });
      return { 
        success: false, 
        data: null,
        session: null,
        error: response.error,
        errorCode: response.errorCode,
        correlationId,
      };
    }

    if (!authData.user) {
      logAuthEvent('error', 'Recruiter auth returned no user', { correlationId });
      return { 
        success: false, 
        data: null,
        session: null,
        error: 'Authentication failed. Please try again.',
        errorCode: AUTH_ERROR_CODES.UNEXPECTED_ERROR,
        correlationId,
      };
    }

    // Step 2: Fetch recruiter profile
    let recruiter;
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("recruiters")
          .select("*")
          .eq("user_id", authData.user.id)
          .maybeSingle(),
        DB_QUERY_TIMEOUT_MS
      );

      if (error) throw error;
      recruiter = data;
    } catch (dbError) {
      logAuthEvent('error', 'Recruiter profile fetch failed', { correlationId, errorCode: mapSupabaseError(dbError) });
      await safeSignOut();
      return { 
        success: false, 
        data: null,
        session: null,
        error: 'Unable to load your profile. Please try again later.',
        errorCode: AUTH_ERROR_CODES.DATABASE_ERROR,
        correlationId,
      };
    }

    if (!recruiter) {
      logAuthEvent('warn', 'No recruiter profile found for authenticated user', { correlationId, userId: authData.user.id });
      await safeSignOut();
      return { 
        success: false, 
        data: null,
        session: null,
        error: 'No recruiter account found. Please check if you are using the correct login portal.',
        errorCode: AUTH_ERROR_CODES.WRONG_PORTAL,
        correlationId,
      };
    }

    // Step 3: Check account status
    if (recruiter.isactive === false) {
      logAuthEvent('warn', 'Recruiter account inactive', { correlationId, recruiterId: recruiter.id });
      await safeSignOut();
      return {
        success: false,
        data: null,
        session: null,
        error: 'Your account is inactive. Please contact support.',
        errorCode: AUTH_ERROR_CODES.ACCOUNT_DISABLED,
        correlationId,
      };
    }

    // Step 4: Check verification status
    if (recruiter.verificationstatus === 'rejected') {
      logAuthEvent('warn', 'Recruiter account rejected', { correlationId, recruiterId: recruiter.id });
      await safeSignOut();
      return {
        success: false,
        data: null,
        session: null,
        error: 'Your account verification was rejected. Please contact support.',
        errorCode: AUTH_ERROR_CODES.ACCOUNT_REJECTED,
        correlationId,
      };
    }

    logAuthEvent('info', 'Recruiter login successful', { correlationId, recruiterId: recruiter.id });

    return {
      success: true,
      data: {
        id: recruiter.id,
        user_id: authData.user.id,
        name: recruiter.name,
        email: recruiter.email,
        state: recruiter.state,
        website: recruiter.website,
        verificationStatus: recruiter.verificationstatus,
        isActive: recruiter.isactive,
      },
      session: authData.session,
      error: null,
    };

  } catch (err) {
    logAuthEvent('error', 'Unexpected recruiter login error', { correlationId, errorCode: mapSupabaseError(err) });
    const response = handleAuthError(err, { correlationId, operation: 'recruiterLogin' });
    return { 
      success: false, 
      data: null,
      session: null,
      error: response.error,
      errorCode: response.errorCode,
      correlationId,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safe sign out - doesn't throw on error
 */
const safeSignOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign out errors
  }
};
