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
} as const;

export type QuestionGenerationErrorType =
  (typeof QuestionGenerationError)[keyof typeof QuestionGenerationError];

/**
 * Error types for cluster generation
 */
export const ClusterGenerationError = {
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  RAG_SEARCH_FAILED: 'RAG_SEARCH_FAILED',
  CLUSTER_VALIDATION_FAILED: 'CLUSTER_VALIDATION_FAILED',
  LLM_ERROR: 'LLM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  UNKNOWN: 'UNKNOWN'
} as const;

export type ClusterGenerationErrorType =
  (typeof ClusterGenerationError)[keyof typeof ClusterGenerationError];

/**
 * User-friendly error messages for each error type
 */
export const ERROR_MESSAGES: Record<string, string> = {
  [QuestionGenerationError.API_UNAVAILABLE]: 'Question generation service is temporarily unavailable. Retrying...',
  [QuestionGenerationError.RATE_LIMIT]: 'Please wait, processing your request...',
  [QuestionGenerationError.INVALID_RESPONSE]: 'Received invalid response. Retrying...',
  [QuestionGenerationError.INSUFFICIENT_QUESTIONS]: 'Generating additional questions...',
  [QuestionGenerationError.DATABASE_ERROR]: 'Unable to save questions, but you can continue with the assessment.',
  [QuestionGenerationError.NETWORK_TIMEOUT]: 'Network connection timeout. Retrying...',
  [QuestionGenerationError.UNKNOWN]: 'An unexpected error occurred. Retrying...',
  // Cluster generation errors
  [ClusterGenerationError.API_UNAVAILABLE]: 'Career matching service is temporarily unavailable.',
  [ClusterGenerationError.RATE_LIMIT]: 'Processing your career recommendations...',
  [ClusterGenerationError.INVALID_RESPONSE]: 'Received invalid career data. Please try again.',
  [ClusterGenerationError.RAG_SEARCH_FAILED]: 'Failed to search occupations. Please try again.',
  [ClusterGenerationError.CLUSTER_VALIDATION_FAILED]: 'Failed to generate valid career clusters. Please try again.',
  [ClusterGenerationError.LLM_ERROR]: 'Career analysis service error. Please try again.',
  [ClusterGenerationError.DATABASE_ERROR]: 'Unable to save career recommendations. Please try again.',
  [ClusterGenerationError.NETWORK_TIMEOUT]: 'Network timeout during career analysis. Please try again.',
  [ClusterGenerationError.UNKNOWN]: 'An unexpected error occurred during career analysis.'
};

export interface ErrorHandlingResult {
  shouldRetry: boolean;
  delay: number;
  errorType: string;
  message: string;
}

/**
 * Classify error type based on error details
 * @param error - Error object or response
 * @param status - HTTP status code (if available)
 * @returns Error type from QuestionGenerationError
 */
export function classifyError(error: any, status: number | null = null): string {
  // Check HTTP status codes
  const s = status ?? NaN;
  if (s === 503) return QuestionGenerationError.API_UNAVAILABLE;
  if (s === 429) return QuestionGenerationError.RATE_LIMIT;
  if (s >= 500) return QuestionGenerationError.API_UNAVAILABLE;
  if (s >= 400 && s < 500) return QuestionGenerationError.INVALID_RESPONSE;

  // Check error message patterns
  if (error?.message) {
    const msg = String(error.message).toLowerCase();
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
 * @param errorType - Error type from QuestionGenerationError
 * @returns User-friendly error message
 */
export function getUserErrorMessage(errorType: string): string {
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[QuestionGenerationError.UNKNOWN];
}

/**
 * Handle API response errors with appropriate retry logic
 * @param response - Fetch response object
 * @param attempt - Current attempt number
 * @param maxRetries - Maximum retry attempts
 * @returns { shouldRetry, delay, errorType }
 */
export async function handleAPIError(
  response: Response,
  attempt: number,
  maxRetries: number
): Promise<ErrorHandlingResult> {
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
 * @param error - Error object
 * @param attempt - Current attempt number
 * @param maxRetries - Maximum retry attempts
 * @returns { shouldRetry, delay, errorType }
 */
export function handleNetworkError(
  error: Error,
  attempt: number,
  maxRetries: number
): ErrorHandlingResult {
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
 * @param error - Database error
 * @param context - Context description (e.g., 'saving aptitude questions')
 * @returns { canContinue, errorType, message }
 */
export function handleDatabaseError(
  error: Error,
  context: string
): { canContinue: boolean; errorType: string; message: string } {
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
 * @param actualCount - Actual number of valid questions
 * @param expectedCount - Expected number of questions
 * @param attempt - Current attempt number
 * @param maxRetries - Maximum retry attempts
 * @returns { shouldRetry, canProceed, message }
 */
export function handleInsufficientQuestions(
  actualCount: number,
  expectedCount: number,
  attempt: number,
  maxRetries: number
): { shouldRetry: boolean; canProceed: boolean; errorType: string; message: string } {
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
