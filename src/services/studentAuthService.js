import { supabase } from '../lib/supabaseClient';
import {
    AUTH_ERROR_CODES,
    buildErrorResponse,
    generateCorrelationId,
    handleAuthError,
    logAuthEvent,
    mapSupabaseError,
    validateCredentials,
    validateEmail,
    withRetry,
    withTimeout,
} from '../utils/authErrorHandler';

/**
 * Student Authentication Service
 * Industrial-grade authentication for students using Supabase Auth
 * 
 * Features:
 * - Comprehensive input validation
 * - Standardized error codes and messages
 * - Retry logic for transient failures
 * - Secure logging
 * - Timeout handling
 * - Approval status verification
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const AUTH_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

// ============================================================================
// STUDENT LOGIN
// ============================================================================

/**
 * Authenticate student with email and password using Supabase Auth
 * @param {string} email - Student email
 * @param {string} password - Student password
 * @returns {Promise<{success: boolean, student: object|null, session: object|null, error: string|null}>}
 */
export const loginStudent = async (email, password) => {
  const correlationId = generateCorrelationId();
  
  try {
    // Validate inputs
    const validation = validateCredentials(email, password);
    if (!validation.valid) {
      logAuthEvent('warn', 'Student login validation failed', { 
        correlationId, 
        field: validation.field,
      });
      const response = buildErrorResponse(validation.code);
      return { 
        success: false, 
        student: null, 
        session: null, 
        error: response.error,
        errorCode: response.errorCode,
        correlationId,
      };
    }

    logAuthEvent('info', 'Student login attempt', { correlationId });

    // Step 1: Authenticate with Supabase Auth (with retry for transient failures)
    const authOperation = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.email,
        password,
      });

      if (error) {
        throw error;
      }

      return data;
    };

    let authData;
    try {
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
      logAuthEvent('error', 'Student auth failed', { correlationId, errorCode });
      
      // Return user-friendly error
      if (errorCode === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
        return {
          success: false,
          student: null,
          session: null,
          error: 'Invalid email or password. Please try again.',
          errorCode,
          correlationId,
        };
      }
      
      if (errorCode === AUTH_ERROR_CODES.RATE_LIMITED || errorCode === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS) {
        return {
          success: false,
          student: null,
          session: null,
          error: 'Too many login attempts. Please wait a few minutes and try again.',
          errorCode,
          correlationId,
        };
      }
      
      const response = handleAuthError(authError, { correlationId, operation: 'studentLogin' });
      return { 
        success: false, 
        student: null, 
        session: null, 
        error: response.error,
        errorCode: response.errorCode,
        correlationId,
      };
    }

    if (!authData.user) {
      logAuthEvent('error', 'Student auth returned no user', { correlationId });
      return { 
        success: false, 
        student: null, 
        session: null, 
        error: 'Authentication failed. Please try again.',
        errorCode: AUTH_ERROR_CODES.UNEXPECTED_ERROR,
        correlationId,
      };
    }

    // Step 2: Fetch student profile from students table
    let student;
    try {
      const { data: studentData, error: studentError } = await withTimeout(
        supabase
          .from('students')
          .select(`
            id,
            user_id,
            email,
            name,
            approval_status,
            school_id,
            university_college_id,
            profile,
            school:organizations!students_school_id_fkey (
              id,
              name,
              code,
              approval_status,
              organization_type
            ),
            university_colleges:university_college_id (
              id,
              name
            )
          `)
          .eq('user_id', authData.user.id)
          .maybeSingle(),
        AUTH_TIMEOUT_MS
      );

      if (studentError) {
        throw studentError;
      }

      student = studentData;
    } catch (dbError) {
      logAuthEvent('error', 'Student profile fetch failed', { 
        correlationId, 
        errorCode: mapSupabaseError(dbError),
      });
      
      // Sign out since we couldn't get the student profile
      await safeSignOut();
      
      return { 
        success: false, 
        student: null, 
        session: null, 
        error: 'Unable to load your profile. Please try again later.',
        errorCode: AUTH_ERROR_CODES.DATABASE_ERROR,
        correlationId,
      };
    }

    if (!student) {
      logAuthEvent('warn', 'No student profile found for authenticated user', { 
        correlationId, 
        userId: authData.user.id,
      });
      
      // User exists in auth but not in students table - wrong portal
      await safeSignOut();
      
      return { 
        success: false, 
        student: null, 
        session: null, 
        error: 'No student account found. Please check if you are using the correct login portal.',
        errorCode: AUTH_ERROR_CODES.WRONG_PORTAL,
        correlationId,
      };
    }

    // Step 3: Check approval status
    if (student.approval_status === 'pending') {
      logAuthEvent('warn', 'Student account pending approval', { correlationId });
      await safeSignOut();
      
      return {
        success: false,
        student: null,
        session: null,
        error: 'Your account is pending approval. Please wait for confirmation from your institution.',
        errorCode: AUTH_ERROR_CODES.ACCOUNT_PENDING_APPROVAL,
        correlationId,
      };
    }

    if (student.approval_status === 'rejected') {
      logAuthEvent('warn', 'Student account rejected', { correlationId });
      await safeSignOut();
      
      return {
        success: false,
        student: null,
        session: null,
        error: 'Your account registration was not approved. Please contact your institution for more information.',
        errorCode: AUTH_ERROR_CODES.ACCOUNT_REJECTED,
        correlationId,
      };
    }

    logAuthEvent('info', 'Student login successful', { 
      correlationId, 
      studentId: student.id,
    });

    return { 
      success: true, 
      student, 
      session: authData.session, 
      error: null,
    };

  } catch (err) {
    logAuthEvent('error', 'Unexpected student login error', { 
      correlationId, 
      errorCode: mapSupabaseError(err),
    });
    
    const response = handleAuthError(err, { correlationId, operation: 'studentLogin' });
    return { 
      success: false, 
      student: null, 
      session: null, 
      error: response.error,
      errorCode: response.errorCode,
      correlationId,
    };
  }
};

// ============================================================================
// STUDENT SIGNUP
// ============================================================================

/**
 * Sign up a new student
 * @param {object} studentData - Student registration data
 * @returns {Promise<{success: boolean, student: object|null, user: object|null, error: string|null}>}
 */
export const signupStudent = async (studentData) => {
  const correlationId = generateCorrelationId();
  
  try {
    const { email, password, name, school_id, university_college_id, ...additionalData } = studentData;

    // Validate credentials
    const validation = validateCredentials(email, password);
    if (!validation.valid) {
      logAuthEvent('warn', 'Student signup validation failed', { correlationId, field: validation.field });
      const response = buildErrorResponse(validation.code);
      return {
        success: false,
        student: null,
        user: null,
        error: response.error,
        errorCode: response.errorCode,
        correlationId,
      };
    }

    // Validate institution association
    if (school_id && university_college_id) {
      return {
        success: false,
        student: null,
        user: null,
        error: 'Please select either a school or a university/college, not both.',
        errorCode: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT,
        correlationId,
      };
    }

    if (!school_id && !university_college_id) {
      return {
        success: false,
        student: null,
        user: null,
        error: 'Please select your school or university/college.',
        errorCode: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT,
        correlationId,
      };
    }

    logAuthEvent('info', 'Student signup attempt', { correlationId });

    // Step 1: Create auth user
    let authData;
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: validation.email,
          password,
          options: {
            data: {
              name: name || '',
              role: 'student',
            },
          },
        }),
        AUTH_TIMEOUT_MS
      );

      if (error) {
        throw error;
      }

      authData = data;
    } catch (authError) {
      const errorCode = mapSupabaseError(authError);
      logAuthEvent('error', 'Student signup auth failed', { correlationId, errorCode });

      if (authError.message?.includes('already registered')) {
        return {
          success: false,
          student: null,
          user: null,
          error: 'This email is already registered. Please sign in instead.',
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          correlationId,
        };
      }

      const response = handleAuthError(authError, { correlationId, operation: 'studentSignup' });
      return {
        success: false,
        student: null,
        user: null,
        error: response.error,
        errorCode: response.errorCode,
        correlationId,
      };
    }

    if (!authData.user) {
      logAuthEvent('error', 'Student signup returned no user', { correlationId });
      return {
        success: false,
        student: null,
        user: null,
        error: 'Unable to create account. Please try again.',
        errorCode: AUTH_ERROR_CODES.UNEXPECTED_ERROR,
        correlationId,
      };
    }

    // Step 2: Create student record in students table
    const studentRecord = {
      user_id: authData.user.id,
      email: validation.email,
      name: name || '',
      school_id: school_id || null,
      university_college_id: university_college_id || null,
      approval_status: 'pending',
      profile: {
        name: name || '',
        ...additionalData,
      },
      ...additionalData,
    };

    let newStudent;
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('students')
          .insert([studentRecord])
          .select()
          .single(),
        AUTH_TIMEOUT_MS
      );

      if (error) {
        throw error;
      }

      newStudent = data;
    } catch (dbError) {
      logAuthEvent('error', 'Student record creation failed', { 
        correlationId, 
        errorCode: mapSupabaseError(dbError),
      });

      // Cleanup: attempt to delete auth user (best effort)
      try {
        await supabase.auth.admin?.deleteUser(authData.user.id);
      } catch {
        logAuthEvent('warn', 'Failed to cleanup auth user after student record creation failure', { correlationId });
      }

      return {
        success: false,
        student: null,
        user: null,
        error: 'Unable to complete registration. Please try again.',
        errorCode: AUTH_ERROR_CODES.DATABASE_ERROR,
        correlationId,
      };
    }

    logAuthEvent('info', 'Student signup successful', { 
      correlationId, 
      studentId: newStudent.id,
    });

    return {
      success: true,
      student: newStudent,
      user: authData.user,
      error: null,
      message: 'Account created successfully. Please wait for approval from your institution.',
    };

  } catch (error) {
    logAuthEvent('error', 'Unexpected student signup error', { correlationId });
    const response = handleAuthError(error, { correlationId, operation: 'studentSignup' });
    return {
      success: false,
      student: null,
      user: null,
      error: response.error,
      errorCode: response.errorCode,
      correlationId,
    };
  }
};

// ============================================================================
// GET CURRENT STUDENT
// ============================================================================

/**
 * Get current authenticated student
 * @returns {Promise<{success: boolean, student: object|null, error: string|null}>}
 */
export const getCurrentStudent = async () => {
  const correlationId = generateCorrelationId();
  
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await withTimeout(
      supabase.auth.getUser(),
      AUTH_TIMEOUT_MS
    );

    if (authError || !user) {
      return {
        success: false,
        student: null,
        error: 'Not authenticated',
        errorCode: AUTH_ERROR_CODES.SESSION_EXPIRED,
      };
    }

    // Fetch student profile
    const { data: studentData, error: studentError } = await withTimeout(
      supabase
        .from('students')
        .select(`
          *,
          school:organizations!students_school_id_fkey (
            id,
            name,
            code,
            organization_type
          )
        `)
        .eq('user_id', user.id)
        .single(),
      AUTH_TIMEOUT_MS
    );

    if (studentError || !studentData) {
      logAuthEvent('warn', 'Student profile not found', { correlationId, userId: user.id });
      return {
        success: false,
        student: null,
        error: 'Student profile not found',
        errorCode: AUTH_ERROR_CODES.PROFILE_NOT_FOUND,
      };
    }

    return {
      success: true,
      student: studentData,
      error: null,
    };

  } catch (error) {
    logAuthEvent('error', 'Get current student failed', { correlationId });
    return {
      success: false,
      student: null,
      error: 'Unable to load profile. Please try again.',
      errorCode: mapSupabaseError(error),
    };
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

// ============================================================================
// ADDITIONAL EXPORTS (maintaining backward compatibility)
// ============================================================================

/**
 * Get student by email (for validation)
 */
export const getStudentByEmail = async (email) => {
  const correlationId = generateCorrelationId();
  
  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return {
        success: false,
        student: null,
        error: 'Invalid email format',
      };
    }

    const { data: studentData, error } = await withTimeout(
      supabase
        .from('students')
        .select(`
          *,
          school:organizations!students_school_id_fkey (
            id,
            name,
            code,
            organization_type
          )
        `)
        .eq('email', emailValidation.sanitized)
        .single(),
      AUTH_TIMEOUT_MS
    );

    if (error || !studentData) {
      return {
        success: false,
        student: null,
        error: 'Student not found',
      };
    }

    return {
      success: true,
      student: studentData,
      error: null,
    };

  } catch (error) {
    logAuthEvent('error', 'Get student by email failed', { correlationId });
    return {
      success: false,
      student: null,
      error: 'Unable to find student',
    };
  }
};

/**
 * Get students by school_id
 */
export const getStudentsBySchool = async (schoolId) => {
  try {
    if (!schoolId) {
      return { success: false, students: [], error: 'School ID is required' };
    }

    const { data, error } = await withTimeout(
      supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false }),
      AUTH_TIMEOUT_MS
    );

    if (error) {
      return { success: false, students: [], error: 'Unable to fetch students' };
    }

    return { success: true, students: data || [], error: null };
  } catch {
    return { success: false, students: [], error: 'Unable to fetch students' };
  }
};

/**
 * Get students by university_college_id
 */
export const getStudentsByUniversityCollege = async (universityCollegeId) => {
  try {
    if (!universityCollegeId) {
      return { success: false, students: [], error: 'University/College ID is required' };
    }

    const { data, error } = await withTimeout(
      supabase
        .from('students')
        .select('*')
        .eq('university_college_id', universityCollegeId)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false }),
      AUTH_TIMEOUT_MS
    );

    if (error) {
      return { success: false, students: [], error: 'Unable to fetch students' };
    }

    return { success: true, students: data || [], error: null };
  } catch {
    return { success: false, students: [], error: 'Unable to fetch students' };
  }
};

/**
 * Update student profile
 */
export const updateStudentProfile = async (studentId, updates) => {
  const correlationId = generateCorrelationId();
  
  try {
    if (!studentId) {
      return { success: false, student: null, error: 'Student ID is required' };
    }

    const { data, error } = await withTimeout(
      supabase
        .from('students')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', studentId)
        .select()
        .single(),
      AUTH_TIMEOUT_MS
    );

    if (error) {
      logAuthEvent('error', 'Student profile update failed', { correlationId });
      return { success: false, student: null, error: 'Unable to update profile' };
    }

    return { success: true, student: data, error: null };
  } catch {
    return { success: false, student: null, error: 'Unable to update profile' };
  }
};

/**
 * Sign out student
 */
export const logoutStudent = async () => {
  const correlationId = generateCorrelationId();
  
  try {
    logAuthEvent('info', 'Student logout', { correlationId });
    const { error } = await supabase.auth.signOut();

    if (error) {
      logAuthEvent('warn', 'Student logout error', { correlationId });
      // Still return success as local session should be cleared
      return { success: true, error: null };
    }

    return { success: true, error: null };
  } catch {
    return { success: true, error: null };
  }
};

/**
 * Validate student credentials
 */
export const validateStudentCredentials = async (email, schoolId = null, universityCollegeId = null) => {
  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { success: false, valid: false, student: null, error: 'Invalid email format' };
    }

    let query = supabase
      .from('students')
      .select('*')
      .eq('email', emailValidation.sanitized)
      .eq('approval_status', 'approved');

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    if (universityCollegeId) {
      query = query.eq('university_college_id', universityCollegeId);
    }

    const { data, error } = await withTimeout(query.single(), AUTH_TIMEOUT_MS);

    if (error || !data) {
      return { success: false, valid: false, student: null, error: 'Student not found or not approved' };
    }

    return { success: true, valid: true, student: data, error: null };
  } catch {
    return { success: false, valid: false, student: null, error: 'Validation failed' };
  }
};
