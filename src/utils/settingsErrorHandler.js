/**
 * Industrial-grade error handling for student settings
 * Provides validation, error mapping, retry logic, and user-friendly messages
 */

// ============================================================================
// ERROR CODES
// ============================================================================

export const SETTINGS_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  CONFLICT: 'CONFLICT',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
};

// ============================================================================
// ERROR CLASS
// ============================================================================

export class SettingsError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'SettingsError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    pattern: /^[6-9]\d{9}$/,
    message: 'Please enter a valid 10-digit Indian mobile number',
  },
  pincode: {
    pattern: /^\d{6}$/,
    message: 'Please enter a valid 6-digit pincode',
  },
  aadhar: {
    pattern: /^[2-9]\d{11}$/,
    message: 'Aadhar must be 12 digits and cannot start with 0 or 1',
    validate: (value) => {
      if (!value) return { valid: true };
      if (value.length !== 12) return { valid: false, message: 'Aadhar must be exactly 12 digits' };
      if (value.startsWith('0') || value.startsWith('1')) {
        return { valid: false, message: 'Aadhar cannot start with 0 or 1' };
      }
      return { valid: true };
    },
  },
  url: {
    pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    message: 'Please enter a valid URL',
  },
  cgpa: {
    validate: (value) => {
      if (!value) return { valid: true };
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 10) {
        return { valid: false, message: 'CGPA must be between 0 and 10' };
      }
      return { valid: true };
    },
  },
  age: {
    validate: (value) => {
      if (!value) return { valid: true };
      const num = parseInt(value);
      if (isNaN(num) || num < 10 || num > 100) {
        return { valid: false, message: 'Age must be between 10 and 100' };
      }
      return { valid: true };
    },
  },
};

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

export const validateField = (fieldName, value, rules = VALIDATION_RULES) => {
  if (!value || value.toString().trim() === '') {
    return { valid: true }; // Empty fields are valid (unless required)
  }

  const rule = rules[fieldName];
  if (!rule) return { valid: true };

  // Custom validation function
  if (rule.validate) {
    return rule.validate(value);
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(value)) {
    return { valid: false, message: rule.message };
  }

  return { valid: true };
};

export const validateFields = (data, fieldNames) => {
  const errors = {};
  
  for (const fieldName of fieldNames) {
    const value = data[fieldName];
    const result = validateField(fieldName, value);
    
    if (!result.valid) {
      errors[fieldName] = result.message;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

// ============================================================================
// ERROR MAPPING
// ============================================================================

export const mapSupabaseError = (error) => {
  if (!error) return SETTINGS_ERROR_CODES.UNEXPECTED_ERROR;

  const msg = error.message?.toLowerCase() || '';
  const code = error.code;
  const status = error.status;

  // Session/Auth errors
  if (code === 'PGRST303' || msg.includes('jwt expired')) {
    return SETTINGS_ERROR_CODES.SESSION_EXPIRED;
  }
  if (status === 401 || msg.includes('unauthorized')) {
    return SETTINGS_ERROR_CODES.UNAUTHORIZED;
  }

  // Rate limiting
  if (status === 429 || msg.includes('rate limit')) {
    return SETTINGS_ERROR_CODES.RATE_LIMITED;
  }

  // Network errors
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
    return SETTINGS_ERROR_CODES.NETWORK_ERROR;
  }

  // Database errors
  if (msg.includes('duplicate') || msg.includes('unique constraint')) {
    return SETTINGS_ERROR_CODES.CONFLICT;
  }
  if (msg.includes('not found') || status === 404) {
    return SETTINGS_ERROR_CODES.NOT_FOUND;
  }
  if (code?.startsWith('PGRST') || msg.includes('database')) {
    return SETTINGS_ERROR_CODES.DATABASE_ERROR;
  }

  // Timeout
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return SETTINGS_ERROR_CODES.TIMEOUT;
  }

  return SETTINGS_ERROR_CODES.UNEXPECTED_ERROR;
};

// ============================================================================
// USER-FRIENDLY MESSAGES
// ============================================================================

const ERROR_MESSAGES = {
  [SETTINGS_ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again',
  [SETTINGS_ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection and try again',
  [SETTINGS_ERROR_CODES.DATABASE_ERROR]: 'Unable to save changes. Please try again',
  [SETTINGS_ERROR_CODES.UNAUTHORIZED]: 'You are not authorized to perform this action',
  [SETTINGS_ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please refresh the page',
  [SETTINGS_ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again',
  [SETTINGS_ERROR_CODES.CONFLICT]: 'This information already exists. Please use different values',
  [SETTINGS_ERROR_CODES.NOT_FOUND]: 'The requested information was not found',
  [SETTINGS_ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again',
  [SETTINGS_ERROR_CODES.UNEXPECTED_ERROR]: 'An unexpected error occurred. Please try again',
};

const SUCCESS_MESSAGES = {
  personal: 'Personal information updated successfully',
  additional: 'Additional information updated successfully',
  institution: 'Institution details updated successfully',
  academic: 'Academic details updated successfully',
  guardian: 'Guardian information updated successfully',
  social: 'Social links updated successfully',
  skills: 'Skills updated successfully',
  experience: 'Experience updated successfully',
  certificates: 'Certificates updated successfully',
  projects: 'Projects updated successfully',
  password: 'Password updated successfully',
  notifications: 'Notification preferences updated successfully',
  privacy: 'Privacy settings updated successfully',
};

// ============================================================================
// RETRY LOGIC
// ============================================================================

export const withRetry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 5000,
    shouldRetry = (error) => {
      const code = mapSupabaseError(error);
      return [
        SETTINGS_ERROR_CODES.NETWORK_ERROR,
        SETTINGS_ERROR_CODES.TIMEOUT,
        SETTINGS_ERROR_CODES.DATABASE_ERROR,
      ].includes(code);
    },
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries - 1 || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3 * delay;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
};

// ============================================================================
// TIMEOUT WRAPPER
// ============================================================================

export const withTimeout = (promise, ms = 30000) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Operation timed out')), ms)
  );
  return Promise.race([promise, timeout]);
};

// ============================================================================
// RESPONSE BUILDERS
// ============================================================================

export const buildSuccessResponse = (section, data = {}, customMessage = null) => {
  return {
    success: true,
    message: customMessage || SUCCESS_MESSAGES[section] || 'Changes saved successfully',
    data,
    timestamp: new Date().toISOString(),
  };
};

export const buildErrorResponse = (error, context = {}) => {
  const code = error instanceof SettingsError 
    ? error.code 
    : mapSupabaseError(error);

  const message = error instanceof SettingsError
    ? error.message
    : ERROR_MESSAGES[code] || 'An error occurred while saving changes';

  return {
    success: false,
    error: code,
    message,
    details: {
      originalError: error.message,
      ...context,
      ...(error.details || {}),
    },
    timestamp: new Date().toISOString(),
  };
};

// ============================================================================
// LOGGING
// ============================================================================

export const logSettingsEvent = (level, section, action, details = {}) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level: level.toUpperCase(),
    section,
    action,
    ...details,
  };

  if (import.meta.env.DEV) {
    console.log(`[SETTINGS] [${level.toUpperCase()}]`, logData);
  }

  // Could send to analytics/monitoring service here
  return logData;
};

// ============================================================================
// MAIN ERROR HANDLER
// ============================================================================

export const handleSettingsError = (error, context = {}) => {
  const { section, action, showToast, toast } = context;

  // Log the error
  logSettingsEvent('error', section, action, {
    error: error.message,
    code: error.code,
    stack: error.stack,
  });

  // Build error response
  const response = buildErrorResponse(error, { section, action });

  // Show toast if provided
  if (showToast && toast) {
    toast({
      title: 'Error',
      description: response.message,
      variant: 'destructive',
    });
  }

  return response;
};

// ============================================================================
// SAFE SAVE WRAPPER
// ============================================================================

export const safeSave = async (saveFunction, options = {}) => {
  const {
    section,
    action = 'save',
    validationFields = [],
    data = {},
    toast,
    onSuccess,
    onError,
    enableRetry = true,
    timeout = 30000,
  } = options;

  try {
    // Validate fields if specified
    if (validationFields.length > 0) {
      const validation = validateFields(data, validationFields);
      if (!validation.valid) {
        const firstError = Object.values(validation.errors)[0];
        throw new SettingsError(
          SETTINGS_ERROR_CODES.VALIDATION_ERROR,
          firstError,
          { validationErrors: validation.errors }
        );
      }
    }

    // Log start
    logSettingsEvent('info', section, `${action}_start`, { data });

    // Execute save with optional retry and timeout
    let result;
    if (enableRetry) {
      result = await withRetry(() => withTimeout(saveFunction(), timeout));
    } else {
      result = await withTimeout(saveFunction(), timeout);
    }

    // Check if result indicates failure (for services that return {success: false})
    if (result && result.success === false) {
      throw new SettingsError(
        SETTINGS_ERROR_CODES.DATABASE_ERROR,
        result.error || 'Failed to save changes',
        { originalError: result.error }
      );
    }

    // Log success
    logSettingsEvent('info', section, `${action}_success`, { result });

    // Build success response
    const response = buildSuccessResponse(section, result);

    // Show success toast
    if (toast) {
      toast({
        title: 'Success',
        description: response.message,
      });
    }

    // Call success callback
    if (onSuccess) {
      onSuccess(response);
    }

    return response;

  } catch (error) {
    // Handle error
    const response = handleSettingsError(error, {
      section,
      action,
      showToast: true,
      toast,
    });

    // Call error callback
    if (onError) {
      onError(response);
    }

    return response;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  SETTINGS_ERROR_CODES,
  SettingsError,
  VALIDATION_RULES,
  validateField,
  validateFields,
  mapSupabaseError,
  withRetry,
  withTimeout,
  buildSuccessResponse,
  buildErrorResponse,
  logSettingsEvent,
  handleSettingsError,
  safeSave,
};
