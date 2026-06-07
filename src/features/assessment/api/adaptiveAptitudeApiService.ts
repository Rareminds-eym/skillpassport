/**
 * Adaptive Aptitude API Service
 *
 * Frontend wrapper for the Adaptive Session API.
 * Replaces direct Supabase calls with API calls to Cloudflare Pages Functions.
 *
 * Pattern: Component → Hook → Service (this file) → Backend API
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';
import {
  Question,
  TestSession,
  TestResults,
  GradeLevel,
  TestPhase,
  AnswerResult,
} from '@/shared/types/adaptiveAptitude';

const logger = getLogger('AdaptiveAptitudeApiService');

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for initializing a new test
 */
export interface InitializeTestOptions {
  learnerId: string;
  gradeLevel: GradeLevel;
  learnerCourse?: string | null;
}

/**
 * Result of test initialization
 */
export interface InitializeTestResult {
  session: TestSession;
  firstQuestion: Question;
}

/**
 * Options for submitting an answer
 */
export interface SubmitAnswerOptions {
  sessionId: string;
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  responseTimeMs: number;
}

/**
 * Result of getting the next question
 */
export interface NextQuestionResult {
  question: Question | null;
  isTestComplete: boolean;
  currentPhase: TestPhase;
  progress: {
    questionsAnswered: number;
    currentQuestionIndex: number;
    totalQuestionsInPhase: number;
  };
}

/**
 * Result of resuming a test
 */
export interface ResumeTestResult {
  session: TestSession;
  currentQuestion: Question | null;
  isTestComplete: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Makes an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge with any existing headers from options
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }

  const url = `/api/adaptive-session${endpoint}`;
  const method = options.method || 'GET';

  logger.info(`🌐 [apiRequest] Making request`, { method, url });

  try {
    const response = await ssoClient.fetch(url, {
      ...options,
      headers,
    });

    logger.info(`📨 [apiRequest] Response received`, {
      method,
      url,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorText);
        // Error responses may be either the standard envelope
        // ({ error: { code, message } }) or a plain { error/message } object.
        errorMessage =
          errorJson.error?.message ||
          (typeof errorJson.error === 'string' ? errorJson.error : undefined) ||
          errorJson.message ||
          `API request failed: ${response.status}`;
      } catch {
        errorMessage = errorText || `API request failed: ${response.status}`;
      }

      logger.error(`❌ [apiRequest] API error response`, {
        method,
        url,
        status: response.status,
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }

    const json = await response.json();
    logger.info(`✅ [apiRequest] Response parsed successfully`, {
      method,
      url,
      hasData: !!json,
    });

    // All adaptive-session handlers return the standard envelope
    // ({ success, data, error, meta }). Unwrap to the payload so consumers
    // (e.g. result.question, result.session, result.isCorrect) work directly.
    // Defensive fallback to `json` for any non-enveloped response.
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return (json as { data: T }).data;
    }
    return json as T;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(`❌ [apiRequest] Request failed`, {
      method,
      url,
      error: errorMsg,
    });
    throw error;
  }
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Initializes a new adaptive aptitude test session
 * 
 * @param learnerId - The learner ID
 * @param gradeLevel - The grade level
 * @returns InitializeTestResult with session and first question
 */
export async function initializeTest(
  learnerId: string,
  gradeLevel: GradeLevel,
  learnerCourse?: string | null
): Promise<InitializeTestResult> {
  logger.info('🚀 [initializeTest] Starting test initialization', {
    learnerId,
    gradeLevel,
    learnerCourse,
  });

  const result = await apiRequest<InitializeTestResult>('/initialize', {
    method: 'POST',
    body: JSON.stringify({ learnerId, gradeLevel, learnerCourse }),
  });

  logger.info('✅ [initializeTest] Test initialized successfully', {
    sessionId: result.session.id,
    firstQuestionId: result.firstQuestion.id,
    phase: result.session.currentPhase,
    difficulty: result.session.currentDifficulty,
  });

  return result;
}

/**
 * Gets the next question for a session
 * 
 * @param sessionId - The session ID
 * @returns NextQuestionResult with the next question or completion status
 */
export async function getNextQuestion(sessionId: string): Promise<NextQuestionResult> {
  console.log('📋 [AdaptiveAptitudeApiService] getNextQuestion:', { sessionId });
  
  const result = await apiRequest<NextQuestionResult>(`/next-question/${sessionId}`, {
    method: 'GET',
  });
  
  console.log('✅ [AdaptiveAptitudeApiService] Next question retrieved:', {
    hasQuestion: !!result.question,
    isTestComplete: result.isTestComplete,
  });
  
  return result;
}

/**
 * Submits an answer for the current question
 * 
 * @param options - Options containing sessionId, questionId, selectedAnswer, responseTimeMs
 * @returns AnswerResult with correctness, difficulty changes, and updated session
 */
export async function submitAnswer(options: SubmitAnswerOptions): Promise<AnswerResult> {
  console.log('📝 [AdaptiveAptitudeApiService] submitAnswer:', {
    sessionId: options.sessionId,
    questionId: options.questionId,
    selectedAnswer: options.selectedAnswer,
  });
  
  const result = await apiRequest<AnswerResult>('/submit-answer', {
    method: 'POST',
    body: JSON.stringify(options),
  });
  
  console.log('✅ [AdaptiveAptitudeApiService] Answer submitted:', {
    isCorrect: result.isCorrect,
    testComplete: result.testComplete,
  });
  
  return result;
}

/**
 * Completes the test and calculates final results
 * 
 * @param sessionId - The session ID
 * @returns TestResults with all analytics
 */
export async function completeTest(sessionId: string): Promise<TestResults> {
  console.log('🏁 [AdaptiveAptitudeApiService] completeTest:', { sessionId });
  
  const result = await apiRequest<TestResults>(`/complete/${sessionId}`, {
    method: 'POST',
  });
  
  console.log('✅ [AdaptiveAptitudeApiService] Test completed:', {
    aptitudeLevel: result.aptitudeLevel,
    confidenceTag: result.confidenceTag,
  });
  
  return result;
}

/**
 * Gets test results for a session
 * 
 * @param sessionId - The session ID
 * @returns TestResults or null if not found
 */
export async function getTestResults(sessionId: string): Promise<TestResults | null> {
  console.log('📊 [AdaptiveAptitudeApiService] getTestResults:', { sessionId });
  
  try {
    const result = await apiRequest<TestResults>(`/results/${sessionId}`, {
      method: 'GET',
    });
    
    console.log('✅ [AdaptiveAptitudeApiService] Results retrieved');
    return result;
  } catch (error) {
    // Return null if results not found (404)
    if (error instanceof Error && error.message.includes('404')) {
      console.log('ℹ️ [AdaptiveAptitudeApiService] Results not found');
      return null;
    }
    throw error;
  }
}

/**
 * Gets all test results for a learner
 * 
 * @param learnerId - The learner ID
 * @returns Array of TestResults
 */
export async function getlearnerTestResults(learnerId: string): Promise<TestResults[]> {
  console.log('📊 [AdaptiveAptitudeApiService] getlearnerTestResults:', { learnerId });
  
  const result = await apiRequest<TestResults[]>(`/results/learner/${learnerId}`, {
    method: 'GET',
  });
  
  console.log('✅ [AdaptiveAptitudeApiService] Learner results retrieved:', {
    count: result.length,
  });
  
  return result;
}

/**
 * Resumes an existing test session
 * 
 * @param sessionId - The session ID to resume
 * @returns ResumeTestResult with session state and current question
 */
export async function resumeTest(sessionId: string): Promise<ResumeTestResult> {
  console.log('🔄 [AdaptiveAptitudeApiService] resumeTest:', { sessionId });
  
  const result = await apiRequest<ResumeTestResult>(`/resume/${sessionId}`, {
    method: 'GET',
  });
  
  console.log('✅ [AdaptiveAptitudeApiService] Test resumed:', {
    isTestComplete: result.isTestComplete,
    hasCurrentQuestion: !!result.currentQuestion,
  });
  
  return result;
}

/**
 * Finds an in-progress session for a learner
 * 
 * @param learnerId - The learner ID
 * @param gradeLevel - Optional grade level filter
 * @returns The in-progress session or null
 */
export async function findInProgressSession(
  learnerId: string,
  gradeLevel?: GradeLevel
): Promise<TestSession | null> {
  console.log('🔍 [AdaptiveAptitudeApiService] findInProgressSession:', { learnerId, gradeLevel });
  
  const queryParams = gradeLevel ? `?gradeLevel=${gradeLevel}` : '';
  
  try {
    const result = await apiRequest<TestSession>(`/find-in-progress/${learnerId}${queryParams}`, {
      method: 'GET',
    });
    
    console.log('✅ [AdaptiveAptitudeApiService] In-progress session found:', {
      sessionId: result.id,
    });
    
    return result;
  } catch (error) {
    // Return null if no session found (404)
    if (error instanceof Error && error.message.includes('404')) {
      console.log('ℹ️ [AdaptiveAptitudeApiService] No in-progress session found');
      return null;
    }
    throw error;
  }
}

/**
 * Abandons a test session
 * 
 * @param sessionId - The session ID to abandon
 */
export async function abandonSession(sessionId: string): Promise<void> {
  console.log('🚫 [AdaptiveAptitudeApiService] abandonSession:', { sessionId });
  
  await apiRequest<{ success: boolean }>(`/abandon/${sessionId}`, {
    method: 'POST',
  });
  
  console.log('✅ [AdaptiveAptitudeApiService] Session abandoned');
}

// =============================================================================
// ADAPTIVE APTITUDE API SERVICE CLASS
// =============================================================================

/**
 * AdaptiveAptitudeApiService class providing all API client functionality
 */
export class AdaptiveAptitudeApiService {
  static async initializeTest(options: InitializeTestOptions): Promise<InitializeTestResult> {
    return initializeTest(options.learnerId, options.gradeLevel, options.learnerCourse);
  }

  static async getNextQuestion(sessionId: string): Promise<NextQuestionResult> {
    return getNextQuestion(sessionId);
  }

  static async submitAnswer(options: SubmitAnswerOptions): Promise<AnswerResult> {
    return submitAnswer(options);
  }

  static async completeTest(sessionId: string): Promise<TestResults> {
    return completeTest(sessionId);
  }

  static async resumeTest(sessionId: string): Promise<ResumeTestResult> {
    return resumeTest(sessionId);
  }

  static async findInProgressSession(
    learnerId: string,
    gradeLevel?: GradeLevel
  ): Promise<TestSession | null> {
    return findInProgressSession(learnerId, gradeLevel);
  }

  static async abandonSession(sessionId: string): Promise<void> {
    return abandonSession(sessionId);
  }

  static async getTestResults(sessionId: string): Promise<TestResults | null> {
    return getTestResults(sessionId);
  }

  static async getlearnerTestResults(learnerId: string): Promise<TestResults[]> {
    return getlearnerTestResults(learnerId);
  }
}

export default AdaptiveAptitudeApiService;

/**
 * Links an adaptive aptitude session to a personal assessment attempt
 * 
 * @param attemptId - The personal assessment attempt ID
 * @param sessionId - The adaptive aptitude session ID
 */
export async function linkSessionToAttempt(
  attemptId: string,
  sessionId: string
): Promise<void> {
  console.log('🔗 [AdaptiveAptitudeApiService] linkSessionToAttempt:', { attemptId, sessionId });
  
  await apiRequest(`/link-to-attempt`, {
    method: 'POST',
    body: JSON.stringify({ attemptId, sessionId }),
  });
  
  console.log('✅ [AdaptiveAptitudeApiService] Session linked to attempt successfully');
}
