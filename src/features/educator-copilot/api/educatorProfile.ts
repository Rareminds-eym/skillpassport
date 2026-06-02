import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import { apiPost } from '@/shared/api/apiClient';
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
} from "@/features/auth/lib/authErrorHandler";

const AUTH_TIMEOUT_MS = 30000;

export async function getEducatorByEmail(email) {
  const correlationId = generateCorrelationId();

  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { success: false, data: null, error: 'Please enter a valid email address.', errorCode: emailValidation.code };
    }

    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getEducatorByEmail',
      email: emailValidation.sanitized,
    });

    if (result?.error) {
      logAuthEvent('error', 'Educator lookup by email failed', { correlationId, errorCode: result.error.code });
      return { success: false, data: null, error: 'Unable to find educator. Please try again.', errorCode: result.error.code };
    }

    if (!result?.data) {
      return { success: false, data: null, error: 'No educator account found with this email. Please check your email or contact support.', errorCode: AUTH_ERROR_CODES.USER_NOT_FOUND };
    }

    return { success: true, data: result.data, error: null };
  } catch (err) {
    logAuthEvent('error', 'Unexpected error in getEducatorByEmail', { correlationId });
    return { success: false, data: null, error: 'Unable to find educator. Please try again later.', errorCode: mapSupabaseError(err) };
  }
}

export async function loginEducator(email, password) {
  const correlationId = generateCorrelationId();

  try {
    const validation = validateCredentials(email, password);
    if (!validation.valid) {
      logAuthEvent('warn', 'Educator login validation failed', { correlationId, field: validation.field });
      const response = buildErrorResponse(validation.code);
      return { success: false, data: null, session: null, error: response.error, errorCode: response.errorCode, correlationId };
    }

    logAuthEvent('info', 'Educator login attempt', { correlationId });

    let authData;
    try {
      authData = await ssoClient.login({ email: validation.email, password });
    } catch (authError) {
      const errorCode = mapSupabaseError(authError);
      logAuthEvent('error', 'Educator auth failed', { correlationId, errorCode });
      if (errorCode === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
        return { success: false, data: null, session: null, error: 'Invalid email or password. Please try again.', errorCode, correlationId };
      }
      if (errorCode === AUTH_ERROR_CODES.RATE_LIMITED || errorCode === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS) {
        return { success: false, data: null, session: null, error: 'Too many login attempts. Please wait a few minutes and try again.', errorCode, correlationId };
      }
      const response = handleAuthError(authError, { correlationId, operation: 'educatorLogin' });
      return { success: false, data: null, session: null, error: response.error, errorCode: response.errorCode, correlationId };
    }

    if (!authData.user) {
      logAuthEvent('error', 'Educator auth returned no user', { correlationId });
      return { success: false, data: null, session: null, error: 'Authentication failed. Please try again.', errorCode: AUTH_ERROR_CODES.UNEXPECTED_ERROR, correlationId };
    }

    const userId = authData.user.id;

    let educator;
    try {
      const profileResult: any = await apiPost('/educator-copilot/actions', {
        action: 'fetchEducatorProfileByUserId',
        userId,
      });
      educator = profileResult?.data;
    } catch (dbError) {
      logAuthEvent('error', 'Educator profile fetch failed', { correlationId, errorCode: mapSupabaseError(dbError) });
      await safeSignOut();
      return { success: false, data: null, session: null, error: 'Unable to load your profile. Please try again later.', errorCode: AUTH_ERROR_CODES.DATABASE_ERROR, correlationId };
    }

    if (!educator) {
      try {
        const profileByEmailResult: any = await apiPost('/educator-copilot/actions', {
          action: 'fetchEducatorProfileByEmail',
          email: validation.email,
        });
        const educatorByEmail = profileByEmailResult?.data;
        if (educatorByEmail) {
          educator = educatorByEmail;
          try {
            await apiPost('/educator-copilot/actions', {
              action: 'updateEducatorUserId',
              educatorId: educatorByEmail.id,
              userId,
            });
          } catch { }
        }
      } catch { }
    }

    if (!educator) {
      logAuthEvent('warn', 'No educator profile found for authenticated user', { correlationId, userId });
      await safeSignOut();
      return { success: false, data: null, session: null, error: 'No educator account found. Please check if you are using the correct login portal.', errorCode: AUTH_ERROR_CODES.WRONG_PORTAL, correlationId };
    }

    if (educator.account_status === 'deactivated' || educator.account_status === 'suspended') {
      logAuthEvent('warn', 'Educator account deactivated/suspended', { correlationId, educatorId: educator.id });
      await safeSignOut();
      return { success: false, data: null, session: null, error: 'Your account is inactive. Please contact your school administrator.', errorCode: AUTH_ERROR_CODES.ACCOUNT_DISABLED, correlationId };
    }

    if (educator.verification_status === 'Rejected') {
      logAuthEvent('warn', 'Educator account rejected', { correlationId, educatorId: educator.id });
      await safeSignOut();
      return { success: false, data: null, session: null, error: 'Your account verification was rejected. Please contact your school administrator.', errorCode: AUTH_ERROR_CODES.ACCOUNT_REJECTED, correlationId };
    }

    logAuthEvent('info', 'Educator login successful', { correlationId, educatorId: educator.id });

    return {
      success: true,
      data: {
        id: educator.id,
        user_id: userId,
        name: educator.first_name && educator.last_name ? `${educator.first_name} ${educator.last_name}` : educator.first_name || "Educator",
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
    return { success: false, data: null, session: null, error: response.error, errorCode: response.errorCode, correlationId };
  }
}

export async function createEducatorProfile(educatorData) {
  const correlationId = generateCorrelationId();

  try {
    if (!educatorData.email) {
      return { success: false, data: null, error: 'Email is required.', errorCode: AUTH_ERROR_CODES.MISSING_CREDENTIALS };
    }
    if (!educatorData.school_id) {
      return { success: false, data: null, error: 'School ID is required.', errorCode: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT };
    }
    if (!educatorData.user_id) {
      return { success: false, data: null, error: 'User ID is required.', errorCode: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT };
    }

    const emailValidation = validateEmail(educatorData.email);
    if (!emailValidation.valid) {
      return { success: false, data: null, error: 'Please enter a valid email address.', errorCode: emailValidation.code };
    }

    logAuthEvent('info', 'Creating educator profile', { correlationId });

    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'createEducatorProfile',
      educatorData: { ...educatorData, email: emailValidation.sanitized },
    });

    if (result?.error) {
      logAuthEvent('error', 'Educator profile creation failed', { correlationId, errorCode: result.error.code });
      if (result.error.code === 'DUPLICATE') {
        return { success: false, data: null, error: 'An educator with this email already exists.', errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS };
      }
      return { success: false, data: null, error: 'Unable to create educator profile. Please try again.', errorCode: mapSupabaseError(result.error) };
    }

    logAuthEvent('info', 'Educator profile created', { correlationId, educatorId: result?.data?.id });

    return { success: true, data: result?.data, error: null };
  } catch (err) {
    logAuthEvent('error', 'Unexpected error creating educator', { correlationId });
    return { success: false, data: null, error: 'Unable to create educator profile. Please try again later.', errorCode: mapSupabaseError(err) };
  }
}

const safeSignOut = async () => {
  try {
    await useAuthStore.getState().logout();
  } catch { }
};
