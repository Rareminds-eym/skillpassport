/**
 * useAdaptiveAptitude React Hook
 *
 * Provides state management and actions for the adaptive aptitude test.
 * Handles test initialization, question flow, answer submission, and result display.
 *
 * Requirements: 5.2, 5.3, 7.3
 */

import { useState, useCallback, useRef } from 'react';
import {
  Question,
  TestSession,
  TestResults,
  GradeLevel,
  TestPhase,
  DifficultyLevel,
  AnswerResult,
} from '../types/adaptiveAptitude';
import {
  AdaptiveAptitudeService,
  InitializeTestResult,
  NextQuestionResult,
  ResumeTestResult,
} from '../services/adaptiveAptitudeService';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Progress information for the current test
 */
export interface TestProgress {
  /** Total questions answered across all phases */
  questionsAnswered: number;
  /** Current question index within the current phase */
  currentQuestionIndex: number;
  /** Total questions in the current phase */
  totalQuestionsInPhase: number;
  /** Current phase of the test */
  currentPhase: TestPhase;
  /** Current difficulty level */
  currentDifficulty: DifficultyLevel;
  /** Estimated total questions (varies due to adaptive nature) */
  estimatedTotalQuestions: number;
  /** Percentage completion estimate */
  completionPercentage: number;
}

/**
 * Options for the useAdaptiveAptitude hook
 */
export interface UseAdaptiveAptitudeOptions {
  /** Student ID for the test */
  studentId: string;
  /** Grade level for the test */
  gradeLevel: GradeLevel;
  /** Callback when test completes */
  onTestComplete?: (results: TestResults) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Return type for the useAdaptiveAptitude hook
 */
export interface UseAdaptiveAptitudeReturn {
  // State
  /** Current question being displayed */
  currentQuestion: Question | null;
  /** Current test session */
  session: TestSession | null;
  /** Test progress information */
  progress: TestProgress | null;
  /** Current phase of the test */
  phase: TestPhase | null;
  /** Whether the test is loading */
  loading: boolean;
  /** Whether an answer is being submitted */
  submitting: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether the test is complete */
  isTestComplete: boolean;
  /** Test results (available after completion) */
  results: TestResults | null;
  /** Time when current question was shown (for response time tracking) */
  questionStartTime: number | null;

  // Actions
  /** Start a new test */
  startTest: () => Promise<void>;
  /** Submit an answer for the current question */
  submitAnswer: (selectedAnswer: 'A' | 'B' | 'C' | 'D') => Promise<AnswerResult | null>;
  /** Resume an existing test session */
  resumeTest: (sessionId: string) => Promise<void>;
  /** Check for and resume any in-progress session */
  checkAndResumeSession: () => Promise<boolean>;
  /** Abandon the current test session */
  abandonTest: () => Promise<void>;
  /** Clear any error */
  clearError: () => void;
  /** Reset the hook state */
  reset: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Estimated questions per phase for progress calculation */
const ESTIMATED_QUESTIONS_PER_PHASE: Record<TestPhase, number> = {
  diagnostic_screener: 6, // Phase 1: 6 questions at Level 3
  adaptive_core: 11, // Phase 2: 11 adaptive questions
  stability_confirmation: 4, // Phase 3: 4 stability questions
};

/** Total estimated questions (21 = 6 + 11 + 4) */
const ESTIMATED_TOTAL_QUESTIONS =
  ESTIMATED_QUESTIONS_PER_PHASE.diagnostic_screener +
  ESTIMATED_QUESTIONS_PER_PHASE.adaptive_core +
  ESTIMATED_QUESTIONS_PER_PHASE.stability_confirmation;

/** Time limit per question in seconds */
const QUESTION_TIME_LIMIT_SECONDS = 90;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculates progress information from session state
 */
function calculateProgress(
  session: TestSession | null,
  currentQuestionIndex: number,
  totalQuestionsInPhase: number
): TestProgress | null {
  if (!session) return null;

  const questionsAnswered = session.questionsAnswered;
  const currentPhase = session.currentPhase;
  const currentDifficulty = session.currentDifficulty;

  // Calculate completion percentage based on questions answered
  const completionPercentage = Math.min(
    Math.round((questionsAnswered / ESTIMATED_TOTAL_QUESTIONS) * 100),
    100
  );

  return {
    questionsAnswered,
    currentQuestionIndex,
    totalQuestionsInPhase,
    currentPhase,
    currentDifficulty,
    estimatedTotalQuestions: ESTIMATED_TOTAL_QUESTIONS,
    completionPercentage,
  };
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * React hook for managing adaptive aptitude test state and actions
 *
 * Requirements: 5.2, 5.3, 7.3
 *
 * @param options - Hook options including studentId and gradeLevel
 * @returns Hook state and actions
 */
export function useAdaptiveAptitude(
  options: UseAdaptiveAptitudeOptions
): UseAdaptiveAptitudeReturn {
  const { studentId, gradeLevel, onTestComplete, onError } = options;

  // ==========================================================================
  // STATE
  // ==========================================================================

  // Core state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [session, setSession] = useState<TestSession | null>(null);
  const [progress, setProgress] = useState<TestProgress | null>(null);
  const [phase, setPhase] = useState<TestPhase | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Completion state
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);

  // Question timing
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);

  // Ref to track current session ID for async operations
  const sessionIdRef = useRef<string | null>(null);

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  /**
   * Updates state from a NextQuestionResult
   */
  const updateStateFromNextQuestion = useCallback(
    (result: NextQuestionResult, currentSession: TestSession) => {
      console.log('🔄 [useAdaptiveAptitude] updateStateFromNextQuestion:', {
        hasQuestion: !!result.question,
        questionId: result.question?.id,
        questionText: result.question?.text?.substring(0, 50),
        isTestComplete: result.isTestComplete,
        currentPhase: result.currentPhase,
      });

      setCurrentQuestion(result.question);
      setPhase(result.currentPhase);
      setIsTestComplete(result.isTestComplete);
      setQuestionStartTime(result.question ? Date.now() : null);

      setProgress(
        calculateProgress(
          currentSession,
          result.progress.currentQuestionIndex,
          result.progress.totalQuestionsInPhase
        )
      );
    },
    []
  );

  /**
   * Handles errors consistently
   */
  const handleError = useCallback(
    (err: unknown, context: string) => {
      const errorMessage = err instanceof Error ? err.message : `${context} failed`;
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    },
    [onError]
  );

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  /**
   * Starts a new adaptive aptitude test
   *
   * Requirements: 1.1
   * - Initializes test session via service
   * - Loads first question
   */
  const startTest = useCallback(async () => {
    console.log('🚀 [useAdaptiveAptitude] startTest called:', { studentId, gradeLevel });
    setLoading(true);
    setError(null);

    try {
      // Initialize the test
      console.log('📡 [useAdaptiveAptitude] Calling AdaptiveAptitudeService.initializeTest...');
      const initResult: InitializeTestResult = await AdaptiveAptitudeService.initializeTest({
        studentId,
        gradeLevel,
      });
      console.log('✅ [useAdaptiveAptitude] initializeTest result:', {
        sessionId: initResult.session.id,
        phase: initResult.session.currentPhase,
        firstQuestionId: initResult.firstQuestion?.id,
        questionsCount: initResult.session.currentPhaseQuestions?.length,
      });

      // Update state
      setSession(initResult.session);
      sessionIdRef.current = initResult.session.id;
      setCurrentQuestion(initResult.firstQuestion);
      setPhase(initResult.session.currentPhase);
      setIsTestComplete(false);
      setResults(null);
      setQuestionStartTime(Date.now());

      // Calculate initial progress
      setProgress(
        calculateProgress(initResult.session, 0, initResult.session.currentPhaseQuestions.length)
      );
      console.log('✅ [useAdaptiveAptitude] State updated successfully');
    } catch (err) {
      console.error('❌ [useAdaptiveAptitude] startTest error:', err);
      handleError(err, 'Failed to start test');
    } finally {
      setLoading(false);
    }
  }, [studentId, gradeLevel, handleError]);

  /**
   * Submits an answer for the current question
   *
   * Requirements: 5.2
   * - Submits answer to service
   * - Updates progress and loads next question
   * - Handles test completion
   */
  const submitAnswer = useCallback(
    async (selectedAnswer: 'A' | 'B' | 'C' | 'D'): Promise<AnswerResult | null> => {
      console.log('📝 [useAdaptiveAptitude] submitAnswer called:', {
        selectedAnswer,
        hasSession: !!session,
        sessionId: session?.id,
        hasCurrentQuestion: !!currentQuestion,
        questionId: currentQuestion?.id,
        submitting,
      });

      if (!session || !currentQuestion || submitting) {
        console.warn('⚠️ [useAdaptiveAptitude] Cannot submit - missing requirements:', {
          hasSession: !!session,
          hasCurrentQuestion: !!currentQuestion,
          submitting,
        });
        return null;
      }

      setSubmitting(true);
      setError(null);

      try {
        // Calculate response time
        const responseTimeMs = questionStartTime ? Date.now() - questionStartTime : 0;

        console.log('📡 [useAdaptiveAptitude] Calling AdaptiveAptitudeService.submitAnswer...');

        // Submit the answer
        const answerResult = await AdaptiveAptitudeService.submitAnswer({
          sessionId: session.id,
          questionId: currentQuestion.id,
          selectedAnswer,
          responseTimeMs,
        });

        console.log('✅ [useAdaptiveAptitude] Answer submitted:', {
          isCorrect: answerResult.isCorrect,
          testComplete: answerResult.testComplete,
          phaseComplete: answerResult.phaseComplete,
          newDifficulty: answerResult.newDifficulty,
        });

        // Update session state
        setSession(answerResult.updatedSession);

        // Check if test is complete
        if (answerResult.testComplete) {
          console.log('🏁 [useAdaptiveAptitude] Test complete, fetching results...');
          // Complete the test and get results
          const testResults = await AdaptiveAptitudeService.completeTest(session.id);
          setResults(testResults);
          setIsTestComplete(true);
          setCurrentQuestion(null);
          setQuestionStartTime(null);
          onTestComplete?.(testResults);
        } else {
          console.log('📋 [useAdaptiveAptitude] Getting next question...');
          // Get next question
          const nextQuestionResult = await AdaptiveAptitudeService.getNextQuestion(session.id);
          console.log('✅ [useAdaptiveAptitude] Next question result:', {
            hasQuestion: !!nextQuestionResult.question,
            questionId: nextQuestionResult.question?.id,
            isTestComplete: nextQuestionResult.isTestComplete,
            currentPhase: nextQuestionResult.currentPhase,
          });
          updateStateFromNextQuestion(nextQuestionResult, answerResult.updatedSession);
        }

        return answerResult;
      } catch (err) {
        handleError(err, 'Failed to submit answer');
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [
      session,
      currentQuestion,
      submitting,
      questionStartTime,
      onTestComplete,
      handleError,
      updateStateFromNextQuestion,
    ]
  );

  /**
   * Resumes an existing test session
   *
   * Requirements: 7.3
   * - Restores session from database
   * - Continues from saved position
   */
  const resumeTest = useCallback(
    async (sessionId: string) => {
      setLoading(true);
      setError(null);

      try {
        // Resume the session
        const resumeResult: ResumeTestResult = await AdaptiveAptitudeService.resumeTest(sessionId);

        // Update state
        setSession(resumeResult.session);
        sessionIdRef.current = resumeResult.session.id;
        setCurrentQuestion(resumeResult.currentQuestion);
        setPhase(resumeResult.session.currentPhase);
        setIsTestComplete(resumeResult.isTestComplete);
        setQuestionStartTime(resumeResult.currentQuestion ? Date.now() : null);

        // If test is complete, fetch results
        if (resumeResult.isTestComplete) {
          const testResults = await AdaptiveAptitudeService.getTestResults(sessionId);
          setResults(testResults);
        } else {
          setResults(null);
        }

        // Calculate progress
        setProgress(
          calculateProgress(
            resumeResult.session,
            resumeResult.session.currentQuestionIndex,
            resumeResult.session.currentPhaseQuestions.length
          )
        );
      } catch (err) {
        handleError(err, 'Failed to resume test');
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  /**
   * Checks for and resumes any in-progress session for the student
   *
   * @returns true if a session was found and resumed, false otherwise
   */
  const checkAndResumeSession = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Check for existing in-progress session
      const existingSession = await AdaptiveAptitudeService.findInProgressSession(
        studentId,
        gradeLevel
      );

      if (existingSession) {
        // Resume the existing session
        await resumeTest(existingSession.id);
        return true;
      }

      return false;
    } catch (err) {
      handleError(err, 'Failed to check for existing session');
      return false;
    } finally {
      setLoading(false);
    }
  }, [studentId, gradeLevel, resumeTest, handleError]);

  /**
   * Abandons the current test session
   */
  const abandonTest = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      await AdaptiveAptitudeService.abandonSession(session.id);

      // Reset state
      setSession(null);
      sessionIdRef.current = null;
      setCurrentQuestion(null);
      setPhase(null);
      setProgress(null);
      setIsTestComplete(false);
      setResults(null);
      setQuestionStartTime(null);
    } catch (err) {
      handleError(err, 'Failed to abandon test');
    } finally {
      setLoading(false);
    }
  }, [session, handleError]);

  /**
   * Clears any error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Resets the hook state
   */
  const reset = useCallback(() => {
    setCurrentQuestion(null);
    setSession(null);
    setProgress(null);
    setPhase(null);
    setLoading(false);
    setSubmitting(false);
    setError(null);
    setIsTestComplete(false);
    setResults(null);
    setQuestionStartTime(null);
    sessionIdRef.current = null;
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    currentQuestion,
    session,
    progress,
    phase,
    loading,
    submitting,
    error,
    isTestComplete,
    results,
    questionStartTime,

    // Actions
    startTest,
    submitAnswer,
    resumeTest,
    checkAndResumeSession,
    abandonTest,
    clearError,
    reset,
  };
}

export default useAdaptiveAptitude;
