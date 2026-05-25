/**
 * useAdaptiveAptitude Hook
 *
 * Custom hook for managing adaptive aptitude test flow.
 * Uses Zustand store for state management and calls backend API via service layer.
 *
 * Pattern:
 * Component → useAdaptiveAptitude (this hook)
 *          → Zustand store (state management)
 *          → API Service (backend calls)
 *          → Backend API (/api/adaptive-session/*)
 */

import { useCallback, useRef, useEffect } from 'react';
import {
  Question,
  TestSession,
  TestResults,
  GradeLevel,
  TestPhase,
  DifficultyLevel,
  AnswerResult,
} from '@/shared/types/adaptiveAptitude';
import { useAssessmentStore } from '../model/assessmentStore';
import AdaptiveAptitudeApiService, { linkSessionToAttempt } from '../api/adaptiveAptitudeApiService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useAdaptiveAptitude');

export interface UseAdaptiveAptitudeOptions {
  learnerId: string;
  gradeLevel: GradeLevel;
  learnerCourse?: string | null;
  onTestComplete?: (results: TestResults) => void;
  onError?: (error: Error) => void;
}

export function useAdaptiveAptitude(options: UseAdaptiveAptitudeOptions) {
  const store = useAssessmentStore();
  const { learnerId, gradeLevel, learnerCourse, onTestComplete, onError } = options;

  // Track question start time for response time calculation
  const questionStartTimeRef = useRef<number | null>(null);

  // START TEST
  const startTest = useCallback(async () => {
    try {
      logger.info('🚀 [startTest] Starting test initialization', {
        learnerId,
        gradeLevel,
        learnerCourse,
      });

      store.setLoading(true);
      store.setError(null);

      logger.info('📡 [startTest] Calling API service to initialize test');
      const result = await AdaptiveAptitudeApiService.initializeTest({
        learnerId,
        gradeLevel,
        learnerCourse,
      });

      logger.info('✅ [startTest] API response received', {
        sessionId: result.session?.id,
        firstQuestionId: result.firstQuestion?.id,
        phase: result.session?.currentPhase,
      });

      store.initializeAdaptiveSession(result.session, result.firstQuestion);

      logger.info('✅ [startTest] Store initialized with session', {
        sessionId: result.session.id,
        phase: result.session.currentPhase,
      });

      // Link the adaptive session to the assessment attempt
      const attemptId = store.attemptId;
      if (attemptId && result.session.id) {
        logger.info('🔗 [startTest] Linking adaptive session to assessment attempt', {
          attemptId,
          sessionId: result.session.id,
        });
        try {
          await linkSessionToAttempt(attemptId, result.session.id);
          logger.info('✅ [startTest] Session successfully linked to attempt', {
            attemptId,
            sessionId: result.session.id,
          });
        } catch (linkError) {
          const err = linkError instanceof Error ? linkError : new Error('Failed to link session');
          logger.warn('⚠️ [startTest] Failed to link session to attempt (non-critical)', {
            error: err.message,
            attemptId,
            sessionId: result.session.id,
          });
          // Don't throw - this is non-critical and shouldn't block the test
        }
      } else {
        logger.warn('⚠️ [startTest] Missing attemptId or sessionId for linking', {
          hasAttemptId: !!attemptId,
          hasSessionId: !!result.session.id,
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start test');
      logger.error('❌ [startTest] Test initialization failed', {
        error: err.message,
        stack: err.stack,
      });
      store.setError(err.message);
      onError?.(err);
    } finally {
      store.setLoading(false);
    }
  }, [learnerId, gradeLevel, learnerCourse, onError, store]);

  // COMPLETE TEST (define before submitAnswer to avoid circular dependency)
  const completeTest = useCallback(async () => {
    try {
      if (!store.adaptiveSessionId) {
        throw new Error('No active session');
      }

      logger.info('🏁 [completeTest] Completing test', {
        sessionId: store.adaptiveSessionId,
      });

      const results = await AdaptiveAptitudeApiService.completeTest(
        store.adaptiveSessionId
      );

      logger.info('✅ [completeTest] Test results received', {
        aptitudeLevel: results.aptitudeLevel,
        confidenceTag: results.confidenceTag,
        abilityEstimate: results.abilityEstimate,
      });

      store.setAdaptiveResults(results);
      store.setAdaptiveTestComplete(true);
      onTestComplete?.(results);

      return results;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to complete test');
      logger.error('❌ [completeTest] Failed to complete test', {
        error: err.message,
        stack: err.stack,
      });
      store.setError(err.message);
      onError?.(err);
      return null;
    }
  }, [store, onError, onTestComplete]);

  // LOAD NEXT QUESTION (define before submitAnswer)
  const loadNextQuestion = useCallback(async () => {
    try {
      if (!store.adaptiveSessionId) {
        throw new Error('No active session');
      }

      logger.info('📋 [loadNextQuestion] Loading next question', {
        sessionId: store.adaptiveSessionId,
      });

      const result = await AdaptiveAptitudeApiService.getNextQuestion(
        store.adaptiveSessionId
      );

      logger.info('✅ [loadNextQuestion] Next question result received', {
        hasQuestion: !!result.question,
        isTestComplete: result.isTestComplete,
        currentPhase: result.currentPhase,
        progress: result.progress,
      });

      if (result.isTestComplete) {
        logger.info('🏁 [loadNextQuestion] Test complete flag received, finalizing test');
        store.setAdaptiveTestComplete(true);
        await completeTest();
      } else if (result.question) {
        logger.info('📝 [loadNextQuestion] Setting new question', {
          questionId: result.question.id,
          difficulty: result.question.difficulty,
        });
        store.setAdaptiveCurrentQuestion(result.question);
      } else {
        logger.warn('⚠️ [loadNextQuestion] No question received and test not complete');
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load next question');
      logger.error('❌ [loadNextQuestion] Failed to load question', {
        error: err.message,
        stack: err.stack,
      });
      store.setError(err.message);
      onError?.(err);
      return null;
    }
  }, [store, onError, completeTest]);

  // SUBMIT ANSWER
  const submitAnswer = useCallback(
    async (selectedAnswer: 'A' | 'B' | 'C' | 'D'): Promise<AnswerResult | null> => {
      try {
        if (!store.adaptiveSessionId || !store.adaptiveCurrentQuestion) {
          throw new Error('No active session or question');
        }

        const responseTimeMs = questionStartTimeRef.current
          ? Date.now() - questionStartTimeRef.current
          : 0;

        logger.info('📝 [submitAnswer] Submitting answer', {
          sessionId: store.adaptiveSessionId,
          questionId: store.adaptiveCurrentQuestion.id,
          selectedAnswer,
          responseTimeMs,
        });

        store.setLoading(true);
        store.setError(null);

        const result = await AdaptiveAptitudeApiService.submitAnswer({
          sessionId: store.adaptiveSessionId,
          questionId: store.adaptiveCurrentQuestion.id,
          selectedAnswer,
          responseTimeMs,
        });

        logger.info('✅ [submitAnswer] Answer submitted successfully', {
          isCorrect: result.isCorrect,
          newDifficulty: result.newDifficulty,
          testComplete: result.testComplete,
          newPhase: result.newPhase,
        });

        // Update store with new difficulty and progress
        store.setAdaptiveDifficulty(result.newDifficulty);
        store.updateAdaptiveProgress(
          (store.adaptiveQuestionsAnswered || 0) + 1,
          (store.adaptiveCorrectAnswers || 0) + (result.isCorrect ? 1 : 0),
          result.abilityEstimate || 0
        );

        // Check if phase changed
        if (result.newPhase && result.newPhase !== store.adaptivePhase) {
          logger.info('📊 [submitAnswer] Phase changed', {
            oldPhase: store.adaptivePhase,
            newPhase: result.newPhase,
          });
          store.setAdaptivePhase(result.newPhase);
        }

        // Check if test is complete
        if (result.testComplete) {
          logger.info('🏁 [submitAnswer] Test marked complete, calling completeTest');
          await completeTest();
        } else {
          // Load next question
          await loadNextQuestion();
        }

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to submit answer');
        logger.error('❌ [submitAnswer] Answer submission failed', {
          error: err.message,
          stack: err.stack,
        });
        store.setError(err.message);
        onError?.(err);
        return null;
      } finally {
        store.setLoading(false);
      }
    },
    [store, onError, completeTest, loadNextQuestion]
  );

  // CLEAR ERROR
  const clearError = useCallback(() => {
    store.setError(null);
  }, [store]);

  // RESET
  const reset = useCallback(() => {
    store.resetAdaptive();
  }, [store]);

  // Track question start time when a new question is displayed
  useEffect(() => {
    if (store.adaptiveCurrentQuestion) {
      const now = Date.now();
      questionStartTimeRef.current = now;
      logger.info('⏱️ [useEffect] Question timer started', {
        questionId: store.adaptiveCurrentQuestion.id,
        timestamp: now,
      });
    }
  }, [store.adaptiveCurrentQuestion?.id]);

  return {
    // State
    sessionId: store.adaptiveSessionId,
    currentQuestion: store.adaptiveCurrentQuestion,
    phase: store.adaptivePhase,
    difficulty: store.adaptiveDifficulty,
    questionsAnswered: store.adaptiveQuestionsAnswered,
    correctAnswers: store.adaptiveCorrectAnswers,
    abilityEstimate: store.adaptiveAbilityEstimate,
    isTestComplete: store.adaptiveTestComplete,
    results: store.adaptiveResults,
    loading: store.loading,
    error: store.error,

    // Actions
    startTest,
    submitAnswer,
    loadNextQuestion,
    completeTest,
    clearError,
    reset,
  };
}
