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
 * Educator Profile Service
 * Industrial-grade authentication and profile management for educators
 * 
 * Features:
 * - Comprehensive input validation
 * - Standardized error codes
 * - Retry logic for transient failures
 * - Secure logging
 * - Timeout handling
 * - Account status verification
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_TIMEOUT_MS = 30000;
const DB_QUERY_TIMEOUT_MS = 15000;

// ============================================================================
// GET EDUCATOR BY EMAIL
// ============================================================================

/**
 * Get educator by email from school_educators table
 * @param {string} email - Educator email
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function getEducatorByEmail(email) {
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
        .from("school_educators")
        .select("*")
        .eq("email", emailValidation.sanitized)
        .maybeSingle(),
      DB_QUERY_TIMEOUT_MS
    );

    if (error) {
      logAuthEvent('error', 'Educator lookup by email failed', { correlationId, errorCode: error.code });
      return { 
        success: false, 
        data: null,
        error: 'Unable to find educator. Please try again.',
        errorCode: mapSupabaseError(error),
      };
    }

    if (!data) {
      return { 
        success: false, 
        data: null,
        error: 'No educator account found with this email. Please check your email or contact support.',
        errorCode: AUTH_ERROR_CODES.USER_NOT_FOUND,
      };
    }

    return { success: true, data, error: null };
  } catch (err) {
    logAuthEvent('error', 'Unexpected error in getEducatorByEmail', { correlationId });
    return { 
      success: false, 
      data: null,
      error: 'Unable to find educator. Please try again later.',
      errorCode: mapSupabaseError(err),
    };
  }
}

// ============================================================================
// EDUCATOR LOGIN
// ============================================================================

/**
 * Login educator with Supabase Auth
 * @param {string} email - Educator email
 * @param {string} password - Educator password
 * @returns {Promise<{success: boolean, data: object|null, session: object|null, error: string|null}>}
 */
export async function loginEducator(email, password) {
  const correlationId = generateCorrelationId();
  
  try {
    // Validate inputs
    const validation = validateCredentials(email, password);
    if (!validation.valid) {
      logAuthEvent('warn', 'Educator login validation failed', { correlationId, field: validation.field });
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

    logAuthEvent('info', 'Educator login attempt', { correlationId });

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
      logAuthEvent('error', 'Educator auth failed', { correlationId, errorCode });
      
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
      
      const response = handleAuthError(authError, { correlationId, operation: 'educatorLogin' });
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
      logAuthEvent('error', 'Educator auth returned no user', { correlationId });
      return { 
        success: false, 
        data: null,
        session: null,
        error: 'Authentication failed. Please try again.',
        errorCode: AUTH_ERROR_CODES.UNEXPECTED_ERROR,
        correlationId,
      };
    }

    // Step 2: Fetch educator profile from school_educators table
    let educator;
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("school_educators")
          .select("*")
          .eq("user_id", authData.user.id)
          .maybeSingle(),
        DB_QUERY_TIMEOUT_MS
      );

      if (error) throw error;
      educator = data;
    } catch (dbError) {
      logAuthEvent('error', 'Educator profile fetch failed', { correlationId, errorCode: mapSupabaseError(dbError) });
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

    // If not found by user_id, try by email (fallback for legacy accounts)
    if (!educator) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from("school_educators")
            .select("*")
            .eq("email", validation.email)
            .maybeSingle(),
          DB_QUERY_TIMEOUT_MS
        );

        if (!error && data) {
          educator = data;
          
          // Update the user_id for future logins
          try {
            await supabase
              .from("school_educators")
              .update({ user_id: authData.user.id })
              .eq("id", data.id);
          } catch {
            // Non-critical, continue
            logAuthEvent('warn', 'Failed to update educator user_id', { correlationId });
          }
        }
      } catch {
        // Fallback failed, continue with original result
      }
    }

    if (!educator) {
      logAuthEvent('warn', 'No educator profile found for authenticated user', { correlationId, userId: authData.user.id });
      await safeSignOut();
      return { 
        success: false, 
        data: null,
        session: null,
        error: 'No educator account found. Please check if you are using the correct login portal.',
        errorCode: AUTH_ERROR_CODES.WRONG_PORTAL,
        correlationId,
      };
    }

    // Step 3: Check account status
    if (educator.account_status === 'deactivated' || educator.account_status === 'suspended') {
      logAuthEvent('warn', 'Educator account deactivated/suspended', { correlationId, educatorId: educator.id });
      await safeSignOut();
      return {
        success: false,
        data: null,
        session: null,
        error: 'Your account is inactive. Please contact your school administrator.',
        errorCode: AUTH_ERROR_CODES.ACCOUNT_DISABLED,
        correlationId,
      };
    }

    // Step 4: Check verification status
    if (educator.verification_status === 'Rejected') {
      logAuthEvent('warn', 'Educator account rejected', { correlationId, educatorId: educator.id });
      await safeSignOut();
      return {
        success: false,
        data: null,
        session: null,
        error: 'Your account verification was rejected. Please contact your school administrator.',
        errorCode: AUTH_ERROR_CODES.ACCOUNT_REJECTED,
        correlationId,
      };
    }

    logAuthEvent('info', 'Educator login successful', { correlationId, educatorId: educator.id });

    return {
      success: true,
      data: {
        id: educator.id,
        user_id: authData.user.id,
        name: educator.first_name && educator.last_name 
          ? `${educator.first_name} ${educator.last_name}`
          : educator.first_name || "Educator",
        email: educator.email,
        school_id: educator.school_id,
        specialization: educator.specialization,
        qualification: educator.qualification,
        experience_years: educator.experience_years,
        designation: educator.designation,
        department: educator.department,
        verification_status: educator.verification_status || "Pending",
        account_status: educator.account_status || "active",
      },
      session: authData.session,
      error: null,
    };

  } catch (err) {
    logAuthEvent('error', 'Unexpected educator login error', { correlationId, errorCode: mapSupabaseError(err) });
    const response = handleAuthError(err, { correlationId, operation: 'educatorLogin' });
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
// CREATE EDUCATOR PROFILE
// ============================================================================

/**
 * Create new educator profile (for signup)
 * @param {object} educatorData - Educator registration data
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function createEducatorProfile(educatorData) {
  const correlationId = generateCorrelationId();
  
  try {
    // Validate required fields
    if (!educatorData.email) {
      return {
        success: false,
        data: null,
        error: 'Email is required.',
        errorCode: AUTH_ERROR_CODES.MISSING_CREDENTIALS,
      };
    }

    if (!educatorData.school_id) {
      return {
        success: false,
        data: null,
        error: 'School ID is required.',
        errorCode: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT,
      };
    }

    if (!educatorData.user_id) {
      return {
        success: false,
        data: null,
        error: 'User ID is required.',
        errorCode: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT,
      };
    }

    // Validate email format
    const emailValidation = validateEmail(educatorData.email);
    if (!emailValidation.valid) {
      return {
        success: false,
        data: null,
        error: 'Please enter a valid email address.',
        errorCode: emailValidation.code,
      };
    }

    logAuthEvent('info', 'Creating educator profile', { correlationId });

    const { data, error } = await withTimeout(
      supabase
        .from("school_educators")
        .insert([
          {
            first_name: educatorData.first_name || '',
            last_name: educatorData.last_name || '',
            email: emailValidation.sanitized,
            phone_number: educatorData.phone_number || null,
            specialization: educatorData.specialization || null,
            qualification: educatorData.qualification || null,
            experience_years: educatorData.experience_years || null,
            designation: educatorData.designation || null,
            department: educatorData.department || null,
            school_id: educatorData.school_id,
            user_id: educatorData.user_id,
            account_status: "active",
            verification_status: "Pending",
          }
        ])
        .select()
        .single(),
      AUTH_TIMEOUT_MS
    );

    if (error) {
      logAuthEvent('error', 'Educator profile creation failed', { correlationId, errorCode: error.code });
      
      // Check for duplicate email
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        return {
          success: false,
          data: null,
          error: 'An educator with this email already exists.',
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        };
      }
      
      return {
        success: false,
        data: null,
        error: 'Unable to create educator profile. Please try again.',
        errorCode: mapSupabaseError(error),
      };
    }

    logAuthEvent('info', 'Educator profile created', { correlationId, educatorId: data.id });

    return {
      success: true,
      data: {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`.trim(),
        email: data.email,
        specialization: data.specialization,
        qualification: data.qualification,
        verification_status: data.verification_status,
        account_status: data.account_status,
      },
      error: null,
    };
  } catch (err) {
    logAuthEvent('error', 'Unexpected error creating educator', { correlationId });
    return {
      success: false,
      data: null,
      error: 'Unable to create educator profile. Please try again later.',
      errorCode: mapSupabaseError(err),
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
