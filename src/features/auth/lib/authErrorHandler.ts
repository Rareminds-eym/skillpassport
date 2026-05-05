// ============================================================================
// CONSTANTS
// ============================================================================

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  INVALID_INPUT_FORMAT: 'INVALID_INPUT_FORMAT',
  RATE_LIMITED: 'RATE_LIMITED',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class AuthError extends Error {
  code: AuthErrorCode;
  details: Record<string, any>;

  constructor(code: AuthErrorCode, message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.details = details;
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

interface ValidationResult {
  valid: boolean;
  code?: AuthErrorCode;
  sanitized?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email || typeof email !== 'string') {
    return { valid: false, code: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT };
  }
  
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return { valid: false, code: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT };
  }
  
  return { valid: true, sanitized };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password || typeof password !== 'string') {
    return { valid: false, code: AUTH_ERROR_CODES.INVALID_INPUT_FORMAT };
  }
  
  if (password.length < 8) {
    return { valid: false, code: AUTH_ERROR_CODES.PASSWORD_TOO_WEAK };
  }
  
  return { valid: true };
};

interface CredentialsValidationResult {
  valid: boolean;
  field?: string;
  code?: AuthErrorCode;
  email?: string;
}

export const validateCredentials = (email: string, password: string): CredentialsValidationResult => {
  const emailVal = validateEmail(email);
  if (!emailVal.valid) return { valid: false, field: 'email', code: emailVal.code };
  
  const passVal = validatePassword(password);
  if (!passVal.valid) return { valid: false, field: 'password', code: passVal.code };
  
  return { valid: true, email: emailVal.sanitized };
};

// ============================================================================
// ERROR MAPPING & HANDLING
// ============================================================================

/**
 * Maps Supabase errors to standardized internal error codes
 */
export const mapSupabaseError = (error: any): AuthErrorCode => {
  if (!error) return AUTH_ERROR_CODES.UNEXPECTED_ERROR;
  
  const msg = error.message?.toLowerCase() || '';
  const code = error.code;
  
  if (code === 'PGRST303' || msg.includes('jwt expired')) return AUTH_ERROR_CODES.SESSION_EXPIRED;
  if (msg.includes('invalid login credentials')) return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  if (msg.includes('user not found')) return AUTH_ERROR_CODES.USER_NOT_FOUND;
  if (msg.includes('email not confirmed')) return AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED;
  if (msg.includes('rate limit') || error.status === 429) return AUTH_ERROR_CODES.RATE_LIMITED;
  
  return AUTH_ERROR_CODES.UNEXPECTED_ERROR;
};

/**
 * Checks if an error is a JWT expiration error
 */
export const isJwtExpiryError = (error: any): boolean => {
  if (!error) return false;
  
  // Check for PGRST303 code (JWT expired)
  if (error.code === 'PGRST303') return true;
  
  // Check typical 401/403 messages
  if (error.message && (
    error.message.includes('JWT expired') || 
    error.message.includes('Invalid token') ||
    error.message.includes('token is expired')
  )) {
    return true;
  }
  
  return false;
};

interface AuthErrorHandlerResult {
  success: boolean;
  session?: any;
  error?: string;
  originalError?: string;
}

/**
 * Handles authentication errors by checking session validity
 * Returns true if session is valid, false if user needs to re-authenticate
 */
export const handleAuthError = async (error: any, context: Record<string, any> = {}): Promise<AuthErrorHandlerResult> => {
  // Check if it's a JWT expiry error
  if (isJwtExpiryError(error)) {
    console.warn('JWT expired detected, checking session validity...');
    
    // In SSO mode, auth-client handles token refresh automatically.
    // If we get here, the session is likely still valid (auth-client retried).
    const { useAuthStore } = await import('@/shared/model/authStore');
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    if (isAuthenticated) {
      console.log('✅ Session is valid (SSO auth-client handles refresh)');
      return { success: true, session: null };
    }
    
    // Session is truly invalid - user needs to re-authenticate
    console.warn('❌ Session invalid, user needs to re-authenticate');
    return { success: false, error: 'Session expired. Please log in again.' };
  }

  // Generic error return for non-fatal errors
  return buildErrorResponse(mapSupabaseError(error), { 
    originalError: error.message,
    ...context 
  });
};

// ============================================================================
// LOGGING & UTILS
// ============================================================================

export const logAuthEvent = (level: string, message: string, details: Record<string, any> = {}): void => {
  // Simple console logging for now, could be enhanced
  if (import.meta.env.DEV) {
    console.log(`[AUTH] [${level.toUpperCase()}] ${message}`, details);
  }
};

export const generateCorrelationId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// ============================================================================
// ASYNC HELPERS
// ============================================================================

export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<T>((_, reject) => 
    setTimeout(() => reject(new Error('Operation timed out')), ms)
  );
  return Promise.race([promise, timeout]);
};

interface RetryOptions {
  maxRetries?: number;
  shouldRetry?: (error: any) => boolean;
}

export const withRetry = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T => {
  const maxRetries = options.maxRetries || 3;
  const shouldRetry = options.shouldRetry || (() => true);
  
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error)) throw error;
        // Exponential backoff
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      }
    }
    
    throw lastError;
  }) as T;
};

// ============================================================================
// RESPONSE BUILDERS
// ============================================================================

// User-friendly messages for each error code
const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password. Please check your credentials and try again.',
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: 'No account found with this email. Please sign up first.',
  [AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]: 'Please verify your email address before signing in.',
  [AUTH_ERROR_CODES.PASSWORD_TOO_WEAK]: 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.',
  [AUTH_ERROR_CODES.INVALID_INPUT_FORMAT]: 'Please check your input and try again.',
  [AUTH_ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
  [AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS]: 'Too many failed attempts. Please try again later.',
  [AUTH_ERROR_CODES.ACCOUNT_LOCKED]: 'Your account has been locked. Please contact support.',
  [AUTH_ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [AUTH_ERROR_CODES.DATABASE_ERROR]: 'A database error occurred. Please try again later.',
  [AUTH_ERROR_CODES.UNEXPECTED_ERROR]: 'An unexpected error occurred. Please try again.',
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AUTH_ERROR_CODES.UNAUTHORIZED]: 'You are not authorized to perform this action.',
};

interface SuccessResponse {
  success: true;
  [key: string]: any;
}

export const buildSuccessResponse = (data: Record<string, any>, meta: Record<string, any> = {}): SuccessResponse => {
  return { success: true, ...data, ...meta };
};

interface ErrorResponse {
  success: false;
  error: AuthErrorCode;
  message: string;
  details: Record<string, any>;
}

export const buildErrorResponse = (code: AuthErrorCode, details: Record<string, any> = {}): ErrorResponse => {
  const defaultMessage = ERROR_MESSAGES[code] || 'An authentication error occurred';
  return {
    success: false,
    error: code,
    message: details.customMessage || defaultMessage,
    details
  };
};
