import { supabase } from '@/shared/api/supabaseClient';
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
} from '../lib/authErrorHandler';

const AUTH_TIMEOUT_MS = 30000;

const safeSignOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign out errors
  }
};

export const loginStudent = async (email: string, password: string) => {
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
