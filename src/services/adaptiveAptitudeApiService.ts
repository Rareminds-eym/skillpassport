/**
 * Adaptive Aptitude API Service
 * 
 * Frontend wrapper for the Adaptive Session API.
 * Replaces direct Supabase calls with API calls to Cloudflare Pages Functions.
 * 
 * Requirements: Task 65 - Frontend API client
 */

import { supabase } from '../lib/supabaseClient';
import {
  Question,
  TestSession,
  TestResults,
  GradeLevel,
  TestPhase,
  AnswerResult,
} from '../types/adaptiveAptitude';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for initializing a new test
 */
export interface InitializeTestOptions {
  studentId: string;
  gradeLevel: GradeLevel;
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
 * Gets the authentication token from Supabase session
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Makes an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Merge with any existing headers from options
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }
  
  const url = `/api/adaptive-session${endpoint}`;
  
  console.log(`🌐 [AdaptiveAptitudeApiService] ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || `API request failed: ${response.status}`;
    } catch {
      errorMessage = errorText || `API request failed: ${response.status}`;
    }
    
    console.error(`❌ [AdaptiveAptitudeApiService] API error:`, {
      url,
      status: response.status,
      error: errorMessage,
    });
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  console.log(`✅ [AdaptiveAptitudeApiService] API response received`);
  
  return data;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Initializes a new adaptive aptitude test session
 * 
 * @param studentId - The student ID
 * @param gradeLevel - The grade level
 * @returns InitializeTestResult with session and first question
 */
export async function initializeTest(
  studentId: string,
  gradeLevel: GradeLevel
): Promise<InitializeTestResult> {
  console.log('🚀 [AdaptiveAptitudeApiService] initializeTest:', { studentId, gradeLevel });
  
  const result = await apiRequest<InitializeTestResult>('/initialize', {
    method: 'POST',
    body: JSON.stringify({ studentId, gradeLevel }),
  });
  
  console.log('✅ [AdaptiveAptitudeApiService] Test initialized:', {
    sessionId: result.session.id,
    firstQuestionId: result.firstQuestion.id,
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
 * Gets all test results for a student
 * 
 * @param studentId - The student ID
 * @returns Array of TestResults
 */
export async function getStudentTestResults(studentId: string): Promise<TestResults[]> {
  console.log('📊 [AdaptiveAptitudeApiService] getStudentTestResults:', { studentId });
  
  const result = await apiRequest<TestResults[]>(`/results/student/${studentId}`, {
    method: 'GET',
  });
  
  console.log('✅ [AdaptiveAptitudeApiService] Student results retrieved:', {
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
 * Finds an in-progress session for a student
 * 
 * @param studentId - The student ID
 * @param gradeLevel - Optional grade level filter
 * @returns The in-progress session or null
 */
export async function findInProgressSession(
  studentId: string,
  gradeLevel?: GradeLevel
): Promise<TestSession | null> {
  console.log('🔍 [AdaptiveAptitudeApiService] findInProgressSession:', { studentId, gradeLevel });
  
  const queryParams = gradeLevel ? `?gradeLevel=${gradeLevel}` : '';
  
  try {
    const result = await apiRequest<TestSession>(`/find-in-progress/${studentId}${queryParams}`, {
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
    return initializeTest(options.studentId, options.gradeLevel);
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
    studentId: string,
    gradeLevel?: GradeLevel
  ): Promise<TestSession | null> {
    return findInProgressSession(studentId, gradeLevel);
  }

  static async abandonSession(sessionId: string): Promise<void> {
    return abandonSession(sessionId);
  }

  static async getTestResults(sessionId: string): Promise<TestResults | null> {
    return getTestResults(sessionId);
  }

  static async getStudentTestResults(studentId: string): Promise<TestResults[]> {
    return getStudentTestResults(studentId);
  }
}

export default AdaptiveAptitudeApiService;
