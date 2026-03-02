/**
 * Adaptive Aptitude Service
 * 
 * Main service for managing adaptive aptitude tests.
 * Now acts as a wrapper around the Adaptive Session API (Cloudflare Pages Functions).
 * Replaces direct Supabase calls with API calls for better reliability and CORS handling.
 * 
 * Requirements: 1.1, 2.2, 2.3, 2.4, 3.3, 5.2, 7.3, 8.1, 8.2, 8.3, 8.4
 * Task 66: Service refactoring to use API wrapper
 */

import * as AdaptiveAptitudeApiService from './adaptiveAptitudeApiService';
import {
  TestSession,
  TestResults,
  GradeLevel,
  AnswerResult,
} from '../types/adaptiveAptitude';

// =============================================================================
// RE-EXPORT TYPES FOR BACKWARD COMPATIBILITY
// =============================================================================

export type {
  InitializeTestOptions,
  InitializeTestResult,
  SubmitAnswerOptions,
  NextQuestionResult,
  ResumeTestResult,
} from './adaptiveAptitudeApiService';

// =============================================================================
// API WRAPPER FUNCTIONS
// All functions now call the Adaptive Session API instead of Supabase directly
// =============================================================================

/**
 * Initializes a new adaptive aptitude test session
 * 
 * Requirements: 1.1
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param options - Options containing studentId and gradeLevel
 * @returns InitializeTestResult with session and first question
 */
export async function initializeTest(
  options: AdaptiveAptitudeApiService.InitializeTestOptions
): Promise<AdaptiveAptitudeApiService.InitializeTestResult> {
  console.log('🚀 [AdaptiveAptitudeService] initializeTest (API wrapper):', options);
  return AdaptiveAptitudeApiService.initializeTest(options.studentId, options.gradeLevel, options.studentCourse);
}

/**
 * Gets the next question for the current session
 * 
 * Requirements: 2.2, 2.3, 2.4
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param sessionId - The session ID
 * @returns NextQuestionResult with the next question or completion status
 */
export async function getNextQuestion(
  sessionId: string
): Promise<AdaptiveAptitudeApiService.NextQuestionResult> {
  console.log('📋 [AdaptiveAptitudeService] getNextQuestion (API wrapper):', { sessionId });
  return AdaptiveAptitudeApiService.getNextQuestion(sessionId);
}

/**
 * Submits an answer for the current question
 * 
 * Requirements: 5.2
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param options - Options containing sessionId, questionId, selectedAnswer, responseTimeMs
 * @returns AnswerResult with correctness, difficulty changes, and updated session
 */
export async function submitAnswer(
  options: AdaptiveAptitudeApiService.SubmitAnswerOptions
): Promise<AnswerResult> {
  console.log('📝 [AdaptiveAptitudeService] submitAnswer (API wrapper):', {
    sessionId: options.sessionId,
    questionId: options.questionId,
  });
  return AdaptiveAptitudeApiService.submitAnswer(options);
}

/**
 * Completes the test and calculates final results
 * 
 * Requirements: 3.3, 8.1, 8.2, 8.3, 8.4
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param sessionId - The session ID
 * @returns TestResults with all analytics
 */
export async function completeTest(sessionId: string): Promise<TestResults> {
  console.log('🏁 [AdaptiveAptitudeService] completeTest (API wrapper):', { sessionId });
  return AdaptiveAptitudeApiService.completeTest(sessionId);
}

/**
 * Resumes an existing test session
 * 
 * Requirements: 7.3
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param sessionId - The session ID to resume
 * @returns ResumeTestResult with session state and current question
 */
export async function resumeTest(
  sessionId: string
): Promise<AdaptiveAptitudeApiService.ResumeTestResult> {
  console.log('🔄 [AdaptiveAptitudeService] resumeTest (API wrapper):', { sessionId });
  return AdaptiveAptitudeApiService.resumeTest(sessionId);
}

/**
 * Finds an in-progress session for a student
 * 
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param studentId - The student ID
 * @param gradeLevel - Optional grade level filter
 * @returns The in-progress session or null
 */
export async function findInProgressSession(
  studentId: string,
  gradeLevel?: GradeLevel
): Promise<TestSession | null> {
  console.log('🔍 [AdaptiveAptitudeService] findInProgressSession (API wrapper):', {
    studentId,
    gradeLevel,
  });
  return AdaptiveAptitudeApiService.findInProgressSession(studentId, gradeLevel);
}

/**
 * Abandons a test session
 * 
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param sessionId - The session ID to abandon
 */
export async function abandonSession(sessionId: string): Promise<void> {
  console.log('🚫 [AdaptiveAptitudeService] abandonSession (API wrapper):', { sessionId });
  return AdaptiveAptitudeApiService.abandonSession(sessionId);
}

/**
 * Gets test results for a session
 * 
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param sessionId - The session ID
 * @returns TestResults or null if not found
 */
export async function getTestResults(sessionId: string): Promise<TestResults | null> {
  console.log('📊 [AdaptiveAptitudeService] getTestResults (API wrapper):', { sessionId });
  return AdaptiveAptitudeApiService.getTestResults(sessionId);
}

/**
 * Gets all test results for a student
 * 
 * Task 66: Now calls API instead of direct Supabase
 * 
 * @param studentId - The student ID
 * @returns Array of TestResults
 */
export async function getStudentTestResults(studentId: string): Promise<TestResults[]> {
  console.log('📊 [AdaptiveAptitudeService] getStudentTestResults (API wrapper):', { studentId });
  return AdaptiveAptitudeApiService.getStudentTestResults(studentId);
}

// =============================================================================
// ADAPTIVE APTITUDE SERVICE CLASS
// =============================================================================

/**
 * AdaptiveAptitudeService class providing all test management functionality
 * Task 66: Now wraps API calls instead of direct Supabase operations
 */
export class AdaptiveAptitudeService {
  /**
   * Initializes a new test session
   * Requirements: 1.1
   */
  static async initializeTest(
    options: AdaptiveAptitudeApiService.InitializeTestOptions
  ): Promise<AdaptiveAptitudeApiService.InitializeTestResult> {
    return initializeTest(options);
  }

  /**
   * Gets the next question for a session
   * Requirements: 2.2, 2.3, 2.4
   */
  static async getNextQuestion(
    sessionId: string
  ): Promise<AdaptiveAptitudeApiService.NextQuestionResult> {
    return getNextQuestion(sessionId);
  }

  /**
   * Submits an answer for the current question
   * Requirements: 5.2
   */
  static async submitAnswer(
    options: AdaptiveAptitudeApiService.SubmitAnswerOptions
  ): Promise<AnswerResult> {
    return submitAnswer(options);
  }

  /**
   * Completes the test and calculates results
   * Requirements: 3.3, 8.1, 8.2, 8.3, 8.4
   */
  static async completeTest(sessionId: string): Promise<TestResults> {
    return completeTest(sessionId);
  }

  /**
   * Resumes an existing test session
   * Requirements: 7.3
   */
  static async resumeTest(
    sessionId: string
  ): Promise<AdaptiveAptitudeApiService.ResumeTestResult> {
    return resumeTest(sessionId);
  }

  /**
   * Finds an in-progress session for a student
   */
  static async findInProgressSession(
    studentId: string,
    gradeLevel?: GradeLevel
  ): Promise<TestSession | null> {
    return findInProgressSession(studentId, gradeLevel);
  }

  /**
   * Abandons a test session
   */
  static async abandonSession(sessionId: string): Promise<void> {
    return abandonSession(sessionId);
  }

  /**
   * Gets test results for a session
   */
  static async getTestResults(sessionId: string): Promise<TestResults | null> {
    return getTestResults(sessionId);
  }

  /**
   * Gets all test results for a student
   */
  static async getStudentTestResults(studentId: string): Promise<TestResults[]> {
    return getStudentTestResults(studentId);
  }
}

export default AdaptiveAptitudeService;
