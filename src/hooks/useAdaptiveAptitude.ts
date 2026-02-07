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
  /** Assessment attempt ID to link the adaptive session to */
  attemptId?: string;
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
  diagnostic_screener: 8,  // Phase 1: 8 questions at Level 3
  adaptive_core: 36,       // Phase 2: Exactly 36 adaptive questions (FIXED)
  stability_confirmation: 6, // Phase 3: 6 stability questions
};

/** Total estimated questions (EXACTLY 50 = 8 + 36 + 6) */
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
  const { studentId, gradeLevel, attemptId, onTestComplete, onError } = options;

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
  const updateStateFromNextQuestion = useCallback((
    result: NextQuestionResult,
    currentSession: TestSession
  ) => {
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
    
    setProgress(calculateProgress(
      currentSession,
      result.progress.currentQuestionIndex,
      result.progress.totalQuestionsInPhase
    ));
  }, []);

  /**
   * Handles errors consistently
   */
  const handleError = useCallback((err: unknown, context: string) => {
    const errorMessage = err instanceof Error ? err.message : `${context} failed`;
    setError(errorMessage);
    onError?.(err instanceof Error ? err : new Error(errorMessage));
  }, [onError]);

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
    console.log('🚀🚀🚀 [useAdaptiveAptitude] ========== START TEST CALLED ==========');
    console.log('🚀 [useAdaptiveAptitude] Parameters:', { 
      studentId, 
      gradeLevel, 
      attemptId,
      hasAttemptId: !!attemptId,
      attemptIdType: typeof attemptId
    });
    setLoading(true);
    setError(null);
    
    try {
      // Initialize the test
      console.log('📡 [useAdaptiveAptitude] Step 1: Calling AdaptiveAptitudeService.initializeTest...');
      const initResult: InitializeTestResult = await AdaptiveAptitudeService.initializeTest({
        studentId,
        gradeLevel,
      });
      console.log('✅ [useAdaptiveAptitude] Step 1 Complete: initializeTest result:', {
        sessionId: initResult.session.id,
        phase: initResult.session.currentPhase,
        firstQuestionId: initResult.firstQuestion?.id,
        questionsCount: initResult.session.currentPhaseQuestions?.length,
      });

      // CRITICAL: Link the adaptive session to the assessment attempt immediately
      // This ensures the session ID is in the attempt BEFORE results are saved
      console.log('🔗 [useAdaptiveAptitude] Step 2: Checking if we should link session to attempt...');
      console.log('🔗 [useAdaptiveAptitude] attemptId:', attemptId);
      console.log('🔗 [useAdaptiveAptitude] session.id:', initResult.session.id);
      console.log('🔗 [useAdaptiveAptitude] Will link?', !!(attemptId && initResult.session.id));
      
      if (attemptId && initResult.session.id) {
        console.log('🔗🔗🔗 [useAdaptiveAptitude] LINKING SESSION TO ATTEMPT NOW!');
        console.log('🔗 [useAdaptiveAptitude] Session ID:', initResult.session.id);
        console.log('🔗 [useAdaptiveAptitude] Attempt ID:', attemptId);
        
        try {
          // Import assessmentService dynamically to avoid circular dependencies
          console.log('📦 [useAdaptiveAptitude] Importing assessmentService...');
          const assessmentService = await import('../services/assessmentService');
          console.log('📦 [useAdaptiveAptitude] assessmentService imported successfully');
          
          console.log('🔗 [useAdaptiveAptitude] Calling updateAttemptAdaptiveSession...');
          const linkResult = await assessmentService.updateAttemptAdaptiveSession(attemptId, initResult.session.id);
          console.log('🔗 [useAdaptiveAptitude] updateAttemptAdaptiveSession returned:', linkResult);
          
          console.log('✅✅✅ [useAdaptiveAptitude] SESSION LINKED TO ATTEMPT SUCCESSFULLY!');
          console.log('✅ [useAdaptiveAptitude] The session ID should now be in personal_assessment_attempts table');
        } catch (linkError) {
          console.error('❌❌❌ [useAdaptiveAptitude] FAILED TO LINK SESSION TO ATTEMPT!');
          console.error('❌ [useAdaptiveAptitude] Error:', linkError);
          console.error('❌ [useAdaptiveAptitude] Error message:', linkError instanceof Error ? linkError.message : 'Unknown');
          console.error('❌ [useAdaptiveAptitude] Error stack:', linkError instanceof Error ? linkError.stack : 'No stack');
          // Don't throw - continue with test even if linking fails
        }
      } else {
        console.warn('⚠️⚠️⚠️ [useAdaptiveAptitude] SESSION WILL NOT BE LINKED TO ATTEMPT!');
        console.warn('⚠️ [useAdaptiveAptitude] Reason: Missing attemptId or session.id');
        console.warn('⚠️ [useAdaptiveAptitude] attemptId:', attemptId);
        console.warn('⚠️ [useAdaptiveAptitude] session.id:', initResult.session.id);
      }

      // Update state
      console.log('🔄 [useAdaptiveAptitude] Step 3: Updating component state...');
      setSession(initResult.session);
      sessionIdRef.current = initResult.session.id;
      setCurrentQuestion(initResult.firstQuestion);
      setPhase(initResult.session.currentPhase);
      setIsTestComplete(false);
      setResults(null);
      setQuestionStartTime(Date.now());
      
      // Calculate initial progress
      setProgress(calculateProgress(
        initResult.session,
        0,
        initResult.session.currentPhaseQuestions.length
      ));
      console.log('✅ [useAdaptiveAptitude] Step 3 Complete: State updated successfully');
      console.log('🚀🚀🚀 [useAdaptiveAptitude] ========== START TEST COMPLETE ==========');
    } catch (err) {
      console.error('❌❌❌ [useAdaptiveAptitude] ========== START TEST FAILED ==========');
      console.error('❌ [useAdaptiveAptitude] Error:', err);
      console.error('❌ [useAdaptiveAptitude] Error message:', err instanceof Error ? err.message : 'Unknown');
      console.error('❌ [useAdaptiveAptitude] Error stack:', err instanceof Error ? err.stack : 'No stack');
      handleError(err, 'Failed to start test');
    } finally {
      setLoading(false);
    }
  }, [studentId, gradeLevel, attemptId, handleError]);

  /**
   * Submits an answer for the current question
   * 
   * Requirements: 5.2
   * - Submits answer to service
   * - Updates progress and loads next question
   * - Handles test completion
   */
  const submitAnswer = useCallback(async (
    selectedAnswer: 'A' | 'B' | 'C' | 'D'
  ): Promise<AnswerResult | null> => {
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
      const responseTimeMs = questionStartTime 
        ? Date.now() - questionStartTime 
        : 0;
      
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
        console.log('🏁 [useAdaptiveAptitude] Test complete, calling completeTest API...');
        console.log('🏁 [useAdaptiveAptitude] Session ID:', session.id);
        
        try {
          // Complete the test and get results
          const testResults = await AdaptiveAptitudeService.completeTest(session.id);
          console.log('✅ [useAdaptiveAptitude] completeTest API succeeded');
          console.log('✅ [useAdaptiveAptitude] Results:', {
            id: testResults.id,
            sessionId: testResults.sessionId,
            aptitudeLevel: testResults.aptitudeLevel,
            totalQuestions: testResults.totalQuestions,
            totalCorrect: testResults.totalCorrect,
          });
          
          setResults(testResults);
          setIsTestComplete(true);
          setCurrentQuestion(null);
          setQuestionStartTime(null);
          onTestComplete?.(testResults);
        } catch (completeError) {
          console.error('❌ [useAdaptiveAptitude] completeTest API FAILED:', completeError);
          console.error('❌ [useAdaptiveAptitude] This means results were NOT saved to adaptive_aptitude_results table');
          console.error('❌ [useAdaptiveAptitude] Error details:', {
            message: completeError instanceof Error ? completeError.message : 'Unknown error',
            stack: completeError instanceof Error ? completeError.stack : undefined,
          });
          
          // Still mark test as complete in UI, but show error
          setIsTestComplete(true);
          setCurrentQuestion(null);
          setQuestionStartTime(null);
          handleError(completeError, 'Failed to save test results');
        }
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
  }, [session, currentQuestion, submitting, questionStartTime, onTestComplete, handleError, updateStateFromNextQuestion]);

  /**
   * Resumes an existing test session
   * 
   * Requirements: 7.3
   * - Restores session from database
   * - Continues from saved position
   */
  const resumeTest = useCallback(async (sessionId: string) => {
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
      setProgress(calculateProgress(
        resumeResult.session,
        resumeResult.session.currentQuestionIndex,
        resumeResult.session.currentPhaseQuestions.length
      ));
    } catch (err) {
      handleError(err, 'Failed to resume test');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

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
