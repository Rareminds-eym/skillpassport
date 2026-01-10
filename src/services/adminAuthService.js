import { supabase } from '../lib/supabaseClient';
import {
    AUTH_ERROR_CODES,
    buildErrorResponse,
    generateCorrelationId,
    handleAuthError,
    logAuthEvent,
    mapSupabaseError,
    validateCredentials,
    withRetry,
    withTimeout,
} from '../utils/authErrorHandler';

/**
 * Admin Authentication Service
 * Industrial-grade authentication for school/college/university admins
 * 
 * Features:
 * - Multi-entity support (schools, colleges, universities)
 * - Approval status verification
 * - Account status checks
 * - Comprehensive error handling
 * - Secure logging
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_TIMEOUT_MS = 30000;
const DB_QUERY_TIMEOUT_MS = 15000;

// ============================================================================
// ADMIN LOGIN
// ============================================================================

/**
 * Login admin (school/college/university) with Supabase Auth
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<{success: boolean, admin: object|null, session: object|null, error: string|null}>}
 */
export const loginAdmin = async (email, password) => {
  const correlationId = generateCorrelationId();
  
  try {
    // Validate inputs
    const validation = validateCredentials(email, password);
    if (!validation.valid) {
      logAuthEvent('warn', 'Admin login validation failed', { correlationId, field: validation.field });
      const response = buildErrorResponse(validation.code);
      return { 
        success: false, 
        admin: null, 
        session: null, 
        error: response.error,
        errorCode: response.errorCode,
        correlationId,
      };
    }

    logAuthEvent('info', 'Admin login attempt', { correlationId });

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
      logAuthEvent('error', 'Admin auth failed', { correlationId, errorCode });
      
      if (errorCode === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
        return {
          success: false,
          admin: null,
          session: null,
          error: 'Invalid email or password. Please try again.',
          errorCode,
          correlationId,
        };
      }
      
      if (errorCode === AUTH_ERROR_CODES.RATE_LIMITED || errorCode === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS) {
        return {
          success: false,
          admin: null,
          session: null,
          error: 'Too many login attempts. Please wait a few minutes and try again.',
          errorCode,
          correlationId,
        };
      }
      
      const response = handleAuthError(authError, { correlationId, operation: 'adminLogin' });
      return { 
        success: false, 
        admin: null, 
        session: null, 
        error: response.error,
        errorCode: response.errorCode,
        correlationId,
      };
    }

    if (!authData.user) {
      logAuthEvent('error', 'Admin auth returned no user', { correlationId });
      return { 
        success: false, 
        admin: null, 
        session: null, 
        error: 'Authentication failed. Please try again.',
        errorCode: AUTH_ERROR_CODES.UNEXPECTED_ERROR,
        correlationId,
      };
    }

    // Step 2: Get user role from metadata
    const userRole = authData.user.user_metadata?.role || authData.user.raw_user_meta_data?.role;

    // Step 3: Fetch user data from users table (optional, for additional info)
    let userData = null;
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle(),
        DB_QUERY_TIMEOUT_MS
      );
      
      if (!error) {
        userData = data;
      }
    } catch {
      // Non-critical, continue without user data
      logAuthEvent('warn', 'Failed to fetch user data', { correlationId });
    }

    // Step 4: Check schools table
    const schoolResult = await checkSchoolAdmin(authData.user, correlationId);
    if (schoolResult.found) {
      if (!schoolResult.success) {
        await safeSignOut();
        return {
          success: false,
          admin: null,
          session: null,
          error: schoolResult.error,
          errorCode: schoolResult.errorCode,
          correlationId,
        };
      }
      
      logAuthEvent('info', 'School admin login successful', { correlationId, adminId: schoolResult.admin.id });
      return {
        success: true,
        admin: schoolResult.admin,
        session: authData.session,
        error: null,
      };
    }

    // Step 5: Check colleges table
    const collegeResult = await checkCollegeAdmin(authData.user, correlationId);
    if (collegeResult.found) {
      logAuthEvent('info', 'College admin login successful', { correlationId, adminId: collegeResult.admin.id });
      return {
        success: true,
        admin: collegeResult.admin,
        session: authData.session,
        error: null,
      };
    }

    // Step 6: Check universities table
    const universityResult = await checkUniversityAdmin(authData.user, correlationId);
    if (universityResult.found) {
      logAuthEvent('info', 'University admin login successful', { correlationId, adminId: universityResult.admin.id });
      return {
        success: true,
        admin: universityResult.admin,
        session: authData.session,
        error: null,
      };
    }

    // Step 7: Check if user has admin role in metadata (fallback)
    if (['school_admin', 'college_admin', 'university_admin'].includes(userRole)) {
      logAuthEvent('info', 'Admin login via metadata role', { correlationId, role: userRole });
      return {
        success: true,
        admin: {
          id: authData.user.id,
          user_id: authData.user.id,
          name: userData?.firstName 
            ? `${userData.firstName} ${userData.lastName || ''}`.trim() 
            : authData.user.email,
          email: authData.user.email,
          role: userRole,
        },
        session: authData.session,
        error: null,
      };
    }

    // No admin profile found
    logAuthEvent('warn', 'No admin profile found', { correlationId, userId: authData.user.id });
    await safeSignOut();
    
    return { 
      success: false, 
      admin: null, 
      session: null, 
      error: 'No admin account found. Please check if you are using the correct login portal.',
      errorCode: AUTH_ERROR_CODES.WRONG_PORTAL,
      correlationId,
    };

  } catch (err) {
    logAuthEvent('error', 'Unexpected admin login error', { correlationId, errorCode: mapSupabaseError(err) });
    const response = handleAuthError(err, { correlationId, operation: 'adminLogin' });
    return { 
      success: false, 
      admin: null, 
      session: null, 
      error: response.error,
      errorCode: response.errorCode,
      correlationId,
    };
  }
};

// ============================================================================
// ENTITY CHECKERS
// ============================================================================

/**
 * Check if user is a school admin (using unified organizations table)
 */
const checkSchoolAdmin = async (user, correlationId) => {
  try {
    const { data: org, error } = await withTimeout(
      supabase
        .from('organizations')
        .select('*')
        .eq('organization_type', 'school')
        .or(`admin_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle(),
      DB_QUERY_TIMEOUT_MS
    );

    if (error && error.code !== 'PGRST116') {
      logAuthEvent('error', 'School lookup failed', { correlationId, errorCode: error.code });
      return { found: false };
    }

    if (!org) {
      return { found: false };
    }

    // Check approval status
    if (org.approval_status !== 'approved') {
      let statusMessage;
      
      if (org.approval_status === 'pending') {
        statusMessage = 'Your school registration is pending approval. Please contact RareMinds admin.';
      } else if (org.approval_status === 'rejected') {
        statusMessage = org.rejection_reason
          ? `Your school registration was rejected: ${org.rejection_reason}. Please contact RareMinds admin.`
          : 'Your school registration was rejected. Please contact RareMinds admin.';
      } else {
        statusMessage = 'Your school account is not approved. Please contact RareMinds admin.';
      }

      return {
        found: true,
        success: false,
        error: statusMessage,
        errorCode: org.approval_status === 'pending' 
          ? AUTH_ERROR_CODES.ACCOUNT_PENDING_APPROVAL 
          : AUTH_ERROR_CODES.ACCOUNT_REJECTED,
      };
    }

    // Check account status
    if (org.account_status !== 'active' && org.account_status !== 'pending') {
      return {
        found: true,
        success: false,
        error: 'Your school account is inactive. Please contact RareMinds admin.',
        errorCode: AUTH_ERROR_CODES.ACCOUNT_DISABLED,
      };
    }

    return {
      found: true,
      success: true,
      admin: {
        id: org.id,
        user_id: user.id,
        name: org.name,
        email: org.email,
        role: 'school_admin',
        schoolId: org.id,
        schoolName: org.name,
        organizationId: org.id,
      },
    };
  } catch (error) {
    logAuthEvent('error', 'School admin check failed', { correlationId });
    return { found: false };
  }
};

/**
 * Check if user is a college admin (using unified organizations table)
 */
const checkCollegeAdmin = async (user, correlationId) => {
  try {
    const { data: org, error } = await withTimeout(
      supabase
        .from('organizations')
        .select('*')
        .eq('organization_type', 'college')
        .or(`admin_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle(),
      DB_QUERY_TIMEOUT_MS
    );

    if (error && error.code !== 'PGRST116') {
      logAuthEvent('error', 'College lookup failed', { correlationId, errorCode: error.code });
      return { found: false };
    }

    if (!org) {
      return { found: false };
    }

    return {
      found: true,
      success: true,
      admin: {
        id: org.id,
        user_id: user.id,
        name: org.name,
        email: org.email || user.email,
        role: 'college_admin',
        collegeId: org.id,
        collegeName: org.name,
        organizationId: org.id,
      },
    };
  } catch (error) {
    logAuthEvent('error', 'College admin check failed', { correlationId });
    return { found: false };
  }
};

/**
 * Check if user is a university admin (using unified organizations table)
 */
const checkUniversityAdmin = async (user, correlationId) => {
  try {
    const { data: org, error } = await withTimeout(
      supabase
        .from('organizations')
        .select('*')
        .eq('organization_type', 'university')
        .or(`admin_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle(),
      DB_QUERY_TIMEOUT_MS
    );

    if (error && error.code !== 'PGRST116') {
      logAuthEvent('error', 'University lookup failed', { correlationId, errorCode: error.code });
      return { found: false };
    }

    if (!org) {
      return { found: false };
    }

    return {
      found: true,
      success: true,
      admin: {
        id: org.id,
        user_id: user.id,
        name: org.name,
        email: org.email || user.email,
        role: 'university_admin',
        universityId: org.id,
        universityName: org.name,
        organizationId: org.id,
      },
    };
  } catch (error) {
    logAuthEvent('error', 'University admin check failed', { correlationId });
    return { found: false };
  }
};

// ============================================================================
// GET CURRENT ADMIN
// ============================================================================

/**
 * Get current admin profile (using unified organizations table)
 * @returns {Promise<{success: boolean, admin: object|null, error: string|null}>}
 */
export const getCurrentAdmin = async () => {
  const correlationId = generateCorrelationId();
  
  try {
    const { data: { user }, error: authError } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_TIMEOUT_MS
    );

    if (authError || !user) {
      return { 
        success: false, 
        admin: null, 
        error: 'Not authenticated',
        errorCode: AUTH_ERROR_CODES.SESSION_EXPIRED,
      };
    }

    // Check organizations table for school admin
    const schoolResult = await checkSchoolAdmin(user, correlationId);
    if (schoolResult.found && schoolResult.success) {
      return {
        success: true,
        admin: schoolResult.admin,
        error: null,
      };
    }

    // Check organizations table for college admin
    const collegeResult = await checkCollegeAdmin(user, correlationId);
    if (collegeResult.found) {
      return {
        success: true,
        admin: collegeResult.admin,
        error: null,
      };
    }

    // Check organizations table for university admin
    const universityResult = await checkUniversityAdmin(user, correlationId);
    if (universityResult.found) {
      return {
        success: true,
        admin: universityResult.admin,
        error: null,
      };
    }

    return { 
      success: false, 
      admin: null, 
      error: 'Admin profile not found',
      errorCode: AUTH_ERROR_CODES.PROFILE_NOT_FOUND,
    };

  } catch (error) {
    logAuthEvent('error', 'Get current admin failed', { correlationId });
    return { 
      success: false, 
      admin: null, 
      error: 'Unable to load admin profile',
      errorCode: mapSupabaseError(error),
    };
  }
};

// ============================================================================
// ADMIN LOGOUT
// ============================================================================

/**
 * Sign out admin
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const logoutAdmin = async () => {
  const correlationId = generateCorrelationId();
  
  try {
    logAuthEvent('info', 'Admin logout', { correlationId });
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logAuthEvent('warn', 'Admin logout error', { correlationId });
      // Still return success as local session should be cleared
    }
    
    return { success: true, error: null };
  } catch {
    return { success: true, error: null };
  }
};

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
