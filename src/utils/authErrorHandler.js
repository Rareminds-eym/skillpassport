/**
 * Industrial-Grade Authentication Error Handler
 * Production-ready error handling for all authentication flows
 * 
 * Features:
 * - Standardized error codes and messages
 * - Error sanitization (no sensitive data leakage)
 * - Retry logic with exponential backoff
 * - Rate limiting detection
 * - Network error handling
 * - Logging with correlation IDs
 * - User-friendly error messages
 */

// ============================================================================
// ERROR CODES & TYPES
// ============================================================================

export const AUTH_ERROR_CODES = {
  // Input Validation Errors (1xxx)
  INVALID_EMAIL: 'AUTH_1001',
  INVALID_PASSWORD: 'AUTH_1002',
  MISSING_CREDENTIALS: 'AUTH_1003',
  INVALID_INPUT_FORMAT: 'AUTH_1004',
  PASSWORD_TOO_WEAK: 'AUTH_1005',
  
  // Authentication Errors (2xxx)
  INVALID_CREDENTIALS: 'AUTH_2001',
  USER_NOT_FOUND: 'AUTH_2002',
  ACCOUNT_DISABLED: 'AUTH_2003',
  ACCOUNT_LOCKED: 'AUTH_2004',
  SESSION_EXPIRED: 'AUTH_2005',
  TOKEN_INVALID: 'AUTH_2006',
  EMAIL_NOT_CONFIRMED: 'AUTH_2007',
  
  // Authorization Errors (3xxx)
  INSUFFICIENT_PERMISSIONS: 'AUTH_3001',
  ROLE_MISMATCH: 'AUTH_3002',
  PROFILE_NOT_FOUND: 'AUTH_3003',
  ACCOUNT_PENDING_APPROVAL: 'AUTH_3004',
  ACCOUNT_REJECTED: 'AUTH_3005',
  WRONG_PORTAL: 'AUTH_3006',
  
  // Rate Limiting & Security (4xxx)
  RATE_LIMITED: 'AUTH_4001',
  TOO_MANY_ATTEMPTS: 'AUTH_4002',
  SUSPICIOUS_ACTIVITY: 'AUTH_4003',
  IP_BLOCKED: 'AUTH_4004',
  
  // Network & Infrastructure (5xxx)
  NETWORK_ERROR: 'AUTH_5001',
  SERVICE_UNAVAILABLE: 'AUTH_5002',
  DATABASE_ERROR: 'AUTH_5003',
  TIMEOUT: 'AUTH_5004',
  CONNECTION_REFUSED: 'AUTH_5005',
  
  // Unknown/Generic (9xxx)
  UNKNOWN_ERROR: 'AUTH_9001',
  UNEXPECTED_ERROR: 'AUTH_9002',
};

// User-friendly messages (safe to display)
const USER_FRIENDLY_MESSAGES = {
  [AUTH_ERROR_CODES.INVALID_EMAIL]: 'Please enter a valid email address.',
  [AUTH_ERROR_CODES.INVALID_PASSWORD]: 'Password does not meet requirements.',
  [AUTH_ERROR_CODES.MISSING_CREDENTIALS]: 'Email and password are required.',
  [AUTH_ERROR_CODES.INVALID_INPUT_FORMAT]: 'Please check your input and try again.',
  [AUTH_ERROR_CODES.PASSWORD_TOO_WEAK]: 'Password must be at least 8 characters with a mix of letters and numbers.',
  
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: 'No account found with this email.',
  [AUTH_ERROR_CODES.ACCOUNT_DISABLED]: 'Your account has been disabled. Please contact support.',
  [AUTH_ERROR_CODES.ACCOUNT_LOCKED]: 'Your account is temporarily locked. Please try again later or reset your password.',
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AUTH_ERROR_CODES.TOKEN_INVALID]: 'Authentication token is invalid. Please sign in again.',
  [AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]: 'Please verify your email address before signing in.',
  
  [AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action.',
  [AUTH_ERROR_CODES.ROLE_MISMATCH]: 'Please use the correct login portal for your account type.',
  [AUTH_ERROR_CODES.PROFILE_NOT_FOUND]: 'Account profile not found. Please contact support.',
  [AUTH_ERROR_CODES.ACCOUNT_PENDING_APPROVAL]: 'Your account is pending approval. Please wait for confirmation.',
  [AUTH_ERROR_CODES.ACCOUNT_REJECTED]: 'Your account registration was not approved. Please contact support.',
  [AUTH_ERROR_CODES.WRONG_PORTAL]: 'No account found. Please check if you are using the correct login portal.',
  
  [AUTH_ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
  [AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS]: 'Too many failed attempts. Please wait before trying again.',
  [AUTH_ERROR_CODES.SUSPICIOUS_ACTIVITY]: 'Unusual activity detected. Please try again later.',
  [AUTH_ERROR_CODES.IP_BLOCKED]: 'Access temporarily restricted. Please try again later.',
  
  [AUTH_ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [AUTH_ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.',
  [AUTH_ERROR_CODES.DATABASE_ERROR]: 'A system error occurred. Please try again later.',
  [AUTH_ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again.',
  [AUTH_ERROR_CODES.CONNECTION_REFUSED]: 'Unable to connect to server. Please try again later.',
  
  [AUTH_ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [AUTH_ERROR_CODES.UNEXPECTED_ERROR]: 'Something went wrong. Please try again later.',
};

// ============================================================================
// CORRELATION ID GENERATOR
// ============================================================================

export const generateCorrelationId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `auth_${timestamp}_${randomPart}`;
};

// ============================================================================
// ERROR CLASS
// ============================================================================

export class AuthError extends Error {
  constructor(code, originalError = null, context = {}) {
    const userMessage = USER_FRIENDLY_MESSAGES[code] || USER_FRIENDLY_MESSAGES[AUTH_ERROR_CODES.UNKNOWN_ERROR];
    super(userMessage);
    
    this.name = 'AuthError';
    this.code = code;
    this.userMessage = userMessage;
    this.correlationId = generateCorrelationId();
    this.timestamp = new Date().toISOString();
    this.context = context;
    this.isRetryable = this.determineRetryable(code);
    this.httpStatus = this.determineHttpStatus(code);
    
    // Store original error for logging (never expose to user)
    this.originalError = originalError;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }
  
  determineRetryable(code) {
    const retryableCodes = [
      AUTH_ERROR_CODES.NETWORK_ERROR,
      AUTH_ERROR_CODES.SERVICE_UNAVAILABLE,
      AUTH_ERROR_CODES.TIMEOUT,
      AUTH_ERROR_CODES.CONNECTION_REFUSED,
      AUTH_ERROR_CODES.DATABASE_ERROR,
    ];
    return retryableCodes.includes(code);
  }
  
  determineHttpStatus(code) {
    const statusMap = {
      [AUTH_ERROR_CODES.INVALID_EMAIL]: 400,
      [AUTH_ERROR_CODES.INVALID_PASSWORD]: 400,
      [AUTH_ERROR_CODES.MISSING_CREDENTIALS]: 400,
      [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 401,
      [AUTH_ERROR_CODES.USER_NOT_FOUND]: 401,
      [AUTH_ERROR_CODES.ACCOUNT_DISABLED]: 403,
      [AUTH_ERROR_CODES.ACCOUNT_LOCKED]: 403,
      [AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 403,
      [AUTH_ERROR_CODES.RATE_LIMITED]: 429,
      [AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS]: 429,
      [AUTH_ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
      [AUTH_ERROR_CODES.DATABASE_ERROR]: 500,
    };
    return statusMap[code] || 500;
  }
  
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.userMessage,
        correlationId: this.correlationId,
        timestamp: this.timestamp,
        isRetryable: this.isRetryable,
      }
    };
  }
  
  toUserResponse() {
    return {
      success: false,
      error: this.userMessage,
      errorCode: this.code,
      correlationId: this.correlationId,
      isRetryable: this.isRetryable,
    };
  }
}

// ============================================================================
// ERROR MAPPING FROM SUPABASE
// ============================================================================

const SUPABASE_ERROR_MAP = {
  'Invalid login credentials': AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  'Email not confirmed': AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED,
  'User not found': AUTH_ERROR_CODES.USER_NOT_FOUND,
  'Invalid email or password': AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  'Email rate limit exceeded': AUTH_ERROR_CODES.RATE_LIMITED,
  'For security purposes': AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
  'over_email_send_rate_limit': AUTH_ERROR_CODES.RATE_LIMITED,
  'over_request_rate_limit': AUTH_ERROR_CODES.RATE_LIMITED,
  'User already registered': AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  'Password should be at least': AUTH_ERROR_CODES.PASSWORD_TOO_WEAK,
  'Unable to validate email address': AUTH_ERROR_CODES.INVALID_EMAIL,
  'Database error': AUTH_ERROR_CODES.DATABASE_ERROR,
  'Network request failed': AUTH_ERROR_CODES.NETWORK_ERROR,
  'Failed to fetch': AUTH_ERROR_CODES.NETWORK_ERROR,
  'PGRST': AUTH_ERROR_CODES.DATABASE_ERROR,
  'timeout': AUTH_ERROR_CODES.TIMEOUT,
  'ECONNREFUSED': AUTH_ERROR_CODES.CONNECTION_REFUSED,
};

export const mapSupabaseError = (error) => {
  if (!error) return AUTH_ERROR_CODES.UNKNOWN_ERROR;
  
  const errorMessage = error.message || error.toString();
  const errorCode = error.code || '';
  
  // Check for specific error patterns
  for (const [pattern, code] of Object.entries(SUPABASE_ERROR_MAP)) {
    if (errorMessage.includes(pattern) || errorCode.includes(pattern)) {
      return code;
    }
  }
  
  // Check HTTP status codes
  if (error.status === 429 || error.statusCode === 429) {
    return AUTH_ERROR_CODES.RATE_LIMITED;
  }
  if (error.status === 401 || error.statusCode === 401) {
    return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  }
  if (error.status === 403 || error.statusCode === 403) {
    return AUTH_ERROR_CODES.INSUFFICIENT_PERMISSIONS;
  }
  if (error.status >= 500 || error.statusCode >= 500) {
    return AUTH_ERROR_CODES.SERVICE_UNAVAILABLE;
  }
  
  return AUTH_ERROR_CODES.UNKNOWN_ERROR;
};

// ============================================================================
// INPUT VALIDATION
// ============================================================================

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, code: AUTH_ERROR_CODES.MISSING_CREDENTIALS };
  }
  
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { valid: false, code: AUTH_ERROR_CODES.MISSING_CREDENTIALS };
  }
  
  if (trimmed.length > 254) {
    return { valid: false, code: AUTH_ERROR_CODES.INVALID_EMAIL };
  }
  
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, code: AUTH_ERROR_CODES.INVALID_EMAIL };
  }
  
  return { valid: true, sanitized: trimmed.toLowerCase() };
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, code: AUTH_ERROR_CODES.MISSING_CREDENTIALS };
  }
  
  if (password.length === 0) {
    return { valid: false, code: AUTH_ERROR_CODES.MISSING_CREDENTIALS };
  }
  
  if (password.length < 6) {
    return { valid: false, code: AUTH_ERROR_CODES.PASSWORD_TOO_WEAK };
  }
  
  if (password.length > 128) {
    return { valid: false, code: AUTH_ERROR_CODES.INVALID_PASSWORD };
  }
  
  return { valid: true };
};

export const validateCredentials = (email, password) => {
  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    return { valid: false, code: emailResult.code, field: 'email' };
  }
  
  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) {
    return { valid: false, code: passwordResult.code, field: 'password' };
  }
  
  return { valid: true, email: emailResult.sanitized };
};

// ============================================================================
// SECURE LOGGING
// ============================================================================

const sanitizeForLogging = (data) => {
  if (!data) return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
  
  if (typeof data === 'string') {
    return data;
  }
  
  if (typeof data === 'object') {
    const sanitized = { ...data };
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    // Partially mask email
    if (sanitized.email && typeof sanitized.email === 'string') {
      const [local, domain] = sanitized.email.split('@');
      if (local && domain) {
        sanitized.email = `${local.substring(0, 2)}***@${domain}`;
      }
    }
    return sanitized;
  }
  
  return data;
};

export const logAuthEvent = (level, message, context = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: sanitizeForLogging(context),
  };
  
  // In production, this would send to a logging service
  // For now, use console with appropriate level
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    // In production, only log warnings and errors to console
    // Full logs should go to a logging service
    if (level === 'error') {
      console.error(`[AUTH ERROR] ${message}`, logEntry.context);
    } else if (level === 'warn') {
      console.warn(`[AUTH WARN] ${message}`, logEntry.context);
    }
    // Info and debug logs suppressed in production console
  } else {
    // In development, log everything
    switch (level) {
      case 'error':
        console.error(`[AUTH ERROR] ${message}`, logEntry.context);
        break;
      case 'warn':
        console.warn(`[AUTH WARN] ${message}`, logEntry.context);
        break;
      case 'info':
        console.info(`[AUTH INFO] ${message}`, logEntry.context);
        break;
      default:
        console.log(`[AUTH DEBUG] ${message}`, logEntry.context);
    }
  }
  
  return logEntry;
};

// ============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const withRetry = async (
  operation,
  options = {}
) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => error.isRetryable,
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const authError = error instanceof AuthError 
        ? error 
        : new AuthError(mapSupabaseError(error), error);
      
      if (attempt === maxRetries || !shouldRetry(authError)) {
        throw authError;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      logAuthEvent('warn', `Retry attempt ${attempt + 1}/${maxRetries}`, {
        correlationId: authError.correlationId,
        delay,
      });
      
      await sleep(delay);
    }
  }
  
  throw lastError;
};

// ============================================================================
// MAIN ERROR HANDLER
// ============================================================================

export const handleAuthError = (error, context = {}) => {
  const correlationId = generateCorrelationId();
  
  // Map to AuthError if not already
  let authError;
  if (error instanceof AuthError) {
    authError = error;
  } else {
    const errorCode = mapSupabaseError(error);
    authError = new AuthError(errorCode, error, context);
  }
  
  // Log the error (with sanitization)
  logAuthEvent('error', 'Authentication error occurred', {
    correlationId: authError.correlationId,
    errorCode: authError.code,
    context: sanitizeForLogging(context),
    // Only include original error details in non-production
    ...(import.meta.env.DEV && { originalError: error?.message }),
  });
  
  return authError.toUserResponse();
};

// ============================================================================
// STANDARDIZED RESPONSE BUILDERS
// ============================================================================

export const buildSuccessResponse = (data, message = null) => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
});

export const buildErrorResponse = (code, context = {}) => {
  const authError = new AuthError(code, null, context);
  return authError.toUserResponse();
};

// ============================================================================
// TIMEOUT WRAPPER
// ============================================================================

export const withTimeout = async (promise, timeoutMs = 30000) => {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AuthError(AUTH_ERROR_CODES.TIMEOUT));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  AUTH_ERROR_CODES,
  AuthError,
  generateCorrelationId,
  mapSupabaseError,
  validateEmail,
  validatePassword,
  validateCredentials,
  logAuthEvent,
  withRetry,
  withTimeout,
  handleAuthError,
  buildSuccessResponse,
  buildErrorResponse,
};
