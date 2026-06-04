import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import { apiPost } from '@/shared/api/apiClient';
import {
  AUTH_ERROR_CODES, validateCredentials, validateEmail,
  mapSupabaseError, handleAuthError, logAuthEvent,
  withRetry, withTimeout, buildErrorResponse, generateCorrelationId,
} from '@/features/auth';

const AUTH_TIMEOUT_MS = 30000;
const DB_QUERY_TIMEOUT_MS = 15000;

export async function getRecruiterByEmail(email: string) {
  const correlationId = generateCorrelationId();

  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return {
        success: false, data: null,
        error: 'Please enter a valid email address.',
        errorCode: emailValidation.code,
      };
    }

    const data = await withTimeout(
      apiPost<any | null>('/recruiter-copilot', {
        action: 'fetch-recruiter-by-email',
        email: emailValidation.sanitized,
      }),
      DB_QUERY_TIMEOUT_MS
    );

    if (!data) {
      return {
        success: false, data: null,
        error: 'No recruiter account found with this email. Please check your email or contact support.',
        errorCode: AUTH_ERROR_CODES.USER_NOT_FOUND,
      };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logAuthEvent('error', 'Unexpected error in getRecruiterByEmail', { correlationId });
    return {
      success: false, data: null,
      error: 'Unable to find recruiter. Please try again later.',
      errorCode: mapSupabaseError(err),
    };
  }
}

export async function getRecruiterByUserId(userId: string) {
  const correlationId = generateCorrelationId();

  try {
    if (!userId || typeof userId !== 'string') {
      return {
        success: false, data: null,
        error: 'Invalid user ID.',
        errorCode: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT,
      };
    }

    const data = await withTimeout(
      apiPost<any | null>('/recruiter-copilot', {
        action: 'fetch-recruiter-by-user-id',
        user_id: userId,
      }),
      DB_QUERY_TIMEOUT_MS
    );

    if (!data) {
      return {
        success: false, data: null,
        error: 'No recruiter profile found.',
        errorCode: AUTH_ERROR_CODES.PROFILE_NOT_FOUND,
      };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logAuthEvent('error', 'Unexpected error in getRecruiterByUserId', { correlationId });
    return {
      success: false, data: null,
      error: 'Unable to load recruiter profile.',
      errorCode: mapSupabaseError(err),
    };
  }
}

export async function loginRecruiter(email: string, password: string) {
  const correlationId = generateCorrelationId();

  try {
    const validation = validateCredentials(email, password);
    if (!validation.valid) {
      logAuthEvent('warn', 'Recruiter login validation failed', { correlationId, field: validation.field });
      const response = buildErrorResponse(validation.code);
      return {
        success: false, data: null, session: null,
        error: response.error, errorCode: response.errorCode, correlationId,
      };
    }

    logAuthEvent('info', 'Recruiter login attempt', { correlationId });

    let authData: any;
    try {
      const authOperation = async () => {
        const loginResult = await ssoClient.login({
          email: validation.email,
          password,
        });
        return loginResult;
      };

      authData = await withTimeout(
        withRetry(authOperation, {
          maxRetries: 1,
          shouldRetry: (err: any) => {
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
    } catch (authError: any) {
      const errorCode = mapSupabaseError(authError);
      logAuthEvent('error', 'Recruiter auth failed', { correlationId, errorCode });

      if (errorCode === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
        return {
          success: false, data: null, session: null,
          error: 'Invalid email or password. Please try again.', errorCode, correlationId,
        };
      }

      if (errorCode === AUTH_ERROR_CODES.RATE_LIMITED || errorCode === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS) {
        return {
          success: false, data: null, session: null,
          error: 'Too many login attempts. Please wait a few minutes and try again.', errorCode, correlationId,
        };
      }

      const response = handleAuthError(authError, { correlationId, operation: 'recruiterLogin' });
      return {
        success: false, data: null, session: null,
        error: response.error, errorCode: response.errorCode, correlationId,
      };
    }

    if (!authData.user) {
      logAuthEvent('error', 'Recruiter auth returned no user', { correlationId });
      return {
        success: false, data: null, session: null,
        error: 'Authentication failed. Please try again.',
        errorCode: AUTH_ERROR_CODES.UNEXPECTED_ERROR, correlationId,
      };
    }

    let recruiter: any;
    try {
      recruiter = await withTimeout(
        apiPost<any | null>('/recruiter-copilot', {
          action: 'fetch-recruiter-by-user-id',
          user_id: authData.user.id,
        }),
        DB_QUERY_TIMEOUT_MS
      );
    } catch (dbError: any) {
      logAuthEvent('error', 'Recruiter profile fetch failed', { correlationId, errorCode: mapSupabaseError(dbError) });
      await safeSignOut();
      return {
        success: false, data: null, session: null,
        error: 'Unable to load your profile. Please try again later.',
        errorCode: AUTH_ERROR_CODES.DATABASE_ERROR, correlationId,
      };
    }

    if (!recruiter) {
      logAuthEvent('warn', 'No recruiter profile found for authenticated user', { correlationId, userId: authData.user.id });
      await safeSignOut();
      return {
        success: false, data: null, session: null,
        error: 'No recruiter account found. Please check if you are using the correct login portal.',
        errorCode: AUTH_ERROR_CODES.WRONG_PORTAL, correlationId,
      };
    }

    if (recruiter.isactive === false) {
      logAuthEvent('warn', 'Recruiter account inactive', { correlationId, recruiterId: recruiter.id });
      await safeSignOut();
      return {
        success: false, data: null, session: null,
        error: 'Your account is inactive. Please contact support.',
        errorCode: AUTH_ERROR_CODES.ACCOUNT_DISABLED, correlationId,
      };
    }

    if (recruiter.verificationstatus === 'rejected') {
      logAuthEvent('warn', 'Recruiter account rejected', { correlationId, recruiterId: recruiter.id });
      await safeSignOut();
      return {
        success: false, data: null, session: null,
        error: 'Your account verification was rejected. Please contact support.',
        errorCode: AUTH_ERROR_CODES.ACCOUNT_REJECTED, correlationId,
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
  } catch (err: any) {
    logAuthEvent('error', 'Unexpected recruiter login error', { correlationId, errorCode: mapSupabaseError(err) });
    const response = handleAuthError(err, { correlationId, operation: 'recruiterLogin' });
    return {
      success: false, data: null, session: null,
      error: response.error, errorCode: response.errorCode, correlationId,
    };
  }
}

const safeSignOut = async () => {
  try {
    await useAuthStore.getState().logout();
  } catch {
    // Ignore sign out errors
  }
};
