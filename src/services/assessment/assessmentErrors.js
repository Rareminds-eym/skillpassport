/**
 * Error Handling Module for Career Assessment
 * Centralized error classification, messaging, and handling logic
 */

/**
 * Error types for question generation
 */
export const QuestionGenerationError = {
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  INSUFFICIENT_QUESTIONS: 'INSUFFICIENT_QUESTIONS',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

/**
 * User-friendly error messages for each error type
 */
export const ERROR_MESSAGES = {
  [QuestionGenerationError.API_UNAVAILABLE]: 'Question generation service is temporarily unavailable. Retrying...',
  [QuestionGenerationError.RATE_LIMIT]: 'Please wait, processing your request...',
  [QuestionGenerationError.INVALID_RESPONSE]: 'Received invalid response. Retrying...',
  [QuestionGenerationError.INSUFFICIENT_QUESTIONS]: 'Generating additional questions...',
  [QuestionGenerationError.DATABASE_ERROR]: 'Unable to save questions, but you can continue with the assessment.',
  [QuestionGenerationError.NETWORK_TIMEOUT]: 'Network connection timeout. Retrying...',
  [QuestionGenerationError.UNKNOWN]: 'An unexpected error occurred. Retrying...'
};

/**
 * Classify error type based on error details
 * @param {Error|Response} error - Error object or response
 * @param {number} status - HTTP status code (if available)
 * @returns {string} - Error type from QuestionGenerationError
 */
export function classifyError(error, status = null) {
  // Check HTTP status codes
  if (status === 503) return QuestionGenerationError.API_UNAVAILABLE;
  if (status === 429) return QuestionGenerationError.RATE_LIMIT;
  if (status >= 500) return QuestionGenerationError.API_UNAVAILABLE;
  if (status >= 400 && status < 500) return QuestionGenerationError.INVALID_RESPONSE;
  
  // Check error message patterns
  if (error?.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return QuestionGenerationError.NETWORK_TIMEOUT;
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return QuestionGenerationError.API_UNAVAILABLE;
    }
    if (msg.includes('json') || msg.includes('parse')) {
      return QuestionGenerationError.INVALID_RESPONSE;
    }
    if (msg.includes('database') || msg.includes('supabase')) {
      return QuestionGenerationError.DATABASE_ERROR;
    }
  }
  
  return QuestionGenerationError.UNKNOWN;
}

/**
 * Get user-friendly error message
 * @param {string} errorType - Error type from QuestionGenerationError
 * @returns {string} - User-friendly error message
 */
export function getUserErrorMessage(errorType) {
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[QuestionGenerationError.UNKNOWN];
}

/**
 * Handle API response errors with appropriate retry logic
 * @param {Response} response - Fetch response object
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} - { shouldRetry: boolean, delay: number, errorType: string }
 */
export async function handleAPIError(response, attempt, maxRetries) {
  const status = response.status;
  const errorType = classifyError(null, status);
  
  // Rate limit - wait for retry-after header or use exponential backoff
  if (status === 429) {
    const retryAfter = response.headers.get('retry-after');
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * attempt;
    console.log(`⏳ Rate limit hit, waiting ${delay}ms before retry`);
    return {
      shouldRetry: attempt < maxRetries,
      delay,
      errorType,
      message: getUserErrorMessage(errorType)
    };
  }
  
  // API unavailable - exponential backoff
  if (status === 503 || status >= 500) {
    const delay = 2000 * attempt;
    console.log(`⚠️ API unavailable (${status}), waiting ${delay}ms before retry`);
    return {
      shouldRetry: attempt < maxRetries,
      delay,
      errorType,
      message: getUserErrorMessage(errorType)
    };
  }
  
  // Client errors - don't retry
  if (status >= 400 && status < 500 && status !== 429) {
    console.error(`❌ Client error (${status}), not retrying`);
    return {
      shouldRetry: false,
      delay: 0,
      errorType,
      message: getUserErrorMessage(errorType)
    };
  }
  
  // Other errors - retry with exponential backoff
  const delay = 2000 * attempt;
  return {
    shouldRetry: attempt < maxRetries,
    delay,
    errorType,
    message: getUserErrorMessage(errorType)
  };
}

/**
 * Handle network/fetch errors with appropriate retry logic
 * @param {Error} error - Error object
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Object} - { shouldRetry: boolean, delay: number, errorType: string }
 */
export function handleNetworkError(error, attempt, maxRetries) {
  const errorType = classifyError(error);
  const delay = 2000 * attempt; // Exponential backoff
  
  console.error(`❌ Network error (attempt ${attempt}/${maxRetries}):`, error.message);
  
  return {
    shouldRetry: attempt < maxRetries,
    delay,
    errorType,
    message: getUserErrorMessage(errorType)
  };
}

/**
 * Handle database save errors gracefully
 * @param {Error} error - Database error
 * @param {string} context - Context description (e.g., 'saving aptitude questions')
 * @returns {Object} - { canContinue: boolean, errorType: string, message: string }
 */
export function handleDatabaseError(error, context) {
  const errorType = QuestionGenerationError.DATABASE_ERROR;
  const message = getUserErrorMessage(errorType);
  
  console.error(`❌ Database error while ${context}:`, error.message);
  console.log('ℹ️ Continuing with in-memory questions (resume functionality may not work)');
  
  return {
    canContinue: true, // Can continue with in-memory questions
    errorType,
    message
  };
}

/**
 * Handle insufficient questions scenario
 * NOTE: This function is currently not used but kept for potential future use
 * @param {number} actualCount - Actual number of valid questions
 * @param {number} expectedCount - Expected number of questions
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Object} - { shouldRetry: boolean, canProceed: boolean, message: string }
 */
export function handleInsufficientQuestions(actualCount, expectedCount, attempt, maxRetries) {
  const errorType = QuestionGenerationError.INSUFFICIENT_QUESTIONS;
  const percentage = (actualCount / expectedCount) * 100;
  
  // If we have at least 80% of expected questions, we can proceed
  const canProceed = percentage >= 80;
  const shouldRetry = !canProceed && attempt < maxRetries;
  
  if (canProceed) {
    console.log(`✅ Proceeding with ${actualCount}/${expectedCount} questions (${percentage.toFixed(0)}%)`);
  } else if (shouldRetry) {
    console.log(`⏳ Only ${actualCount}/${expectedCount} questions (${percentage.toFixed(0)}%), retrying...`);
  } else {
    console.warn(`⚠️ Only ${actualCount}/${expectedCount} questions (${percentage.toFixed(0)}%) after ${attempt} attempts`);
  }
  
  return {
    shouldRetry,
    canProceed,
    errorType,
    message: getUserErrorMessage(errorType)
  };
}
