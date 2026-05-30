import * as AdaptiveAptitudeApiService from './adaptiveAptitudeApiService';
import {
  TestSession,
  TestResults,
  GradeLevel,
  AnswerResult,
} from '@/shared/types/adaptiveAptitude';

export type {
  InitializeTestOptions,
  InitializeTestResult,
  SubmitAnswerOptions,
  NextQuestionResult,
  ResumeTestResult,
} from './adaptiveAptitudeApiService';

export async function initializeTest(
  options: AdaptiveAptitudeApiService.InitializeTestOptions
): Promise<AdaptiveAptitudeApiService.InitializeTestResult> {
  return AdaptiveAptitudeApiService.initializeTest(options.learnerId, options.gradeLevel, options.learnerCourse);
}

export async function getNextQuestion(
  sessionId: string
): Promise<AdaptiveAptitudeApiService.NextQuestionResult> {
  return AdaptiveAptitudeApiService.getNextQuestion(sessionId);
}

export async function submitAnswer(
  options: AdaptiveAptitudeApiService.SubmitAnswerOptions
): Promise<AnswerResult> {
  return AdaptiveAptitudeApiService.submitAnswer(options);
}

export async function completeTest(sessionId: string): Promise<TestResults> {
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
  return AdaptiveAptitudeApiService.resumeTest(sessionId);
}

export async function findInProgressSession(
  learnerId: string,
  gradeLevel?: GradeLevel
): Promise<TestSession | null> {
  return AdaptiveAptitudeApiService.findInProgressSession(learnerId, gradeLevel);
}

export async function abandonSession(sessionId: string): Promise<void> {
  return AdaptiveAptitudeApiService.abandonSession(sessionId);
}

export async function getTestResults(sessionId: string): Promise<TestResults | null> {
  return AdaptiveAptitudeApiService.getTestResults(sessionId);
}

export async function getlearnerTestResults(learnerId: string): Promise<TestResults[]> {
  return AdaptiveAptitudeApiService.getlearnerTestResults(learnerId);
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
   * Finds an in-progress session for a learner
   */
  static async findInProgressSession(
    learnerId: string,
    gradeLevel?: GradeLevel
  ): Promise<TestSession | null> {
    return findInProgressSession(learnerId, gradeLevel);
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
   * Gets all test results for a learner
   */
  static async getlearnerTestResults(learnerId: string): Promise<TestResults[]> {
    return getlearnerTestResults(learnerId);
  }
}

export default AdaptiveAptitudeService;
