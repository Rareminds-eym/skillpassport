/**
 * Assessment Service Hook
 * 
 * Bridges UI components with backend API.
 * Handles all assessment operations: start, save, submit, resume.
 * 
 * All backend calls go through assessmentApiService.
 * No direct database access - everything is secure and validated server-side.
 */

import { useCallback } from 'react';
import { useAssessmentStore } from './assessmentStore';
import * as assessmentApi from '../api/assessmentApiService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('assessment-service');

export interface UseAssessmentServiceOptions {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

/**
 * Hook for assessment service operations
 * Provides methods to interact with assessment backend
 */
export function useAssessmentService(options?: UseAssessmentServiceOptions) {
  const store = useAssessmentStore();

  // ========================================================================
  // START ASSESSMENT
  // ========================================================================

  const startAssessment = useCallback(
    async (gradeLevel: string, streamId?: string | null) => {
      try {
        logger.info('Starting assessment', { gradeLevel, streamId });
        store.setLoading(true);
        store.setError(null);

        const response = await assessmentApi.startAssessment({
          gradeLevel,
          streamId: streamId || undefined,
        });

        if (!response.success) {
          const error = response.error || 'Failed to start assessment';
          store.setError(error);
          options?.onError?.(error);
          return { success: false, error };
        }

        // Initialize store with assessment data
        store.initializeAssessment(
          response.sections || [],
          response.attemptId || '',
          gradeLevel,
          streamId || ''
        );

        logger.info('Assessment started successfully', { attemptId: response.attemptId });
        options?.onSuccess?.('Assessment started');
        return { success: true, attemptId: response.attemptId };
      } catch (err: any) {
        const error = err.message || 'Unexpected error starting assessment';
        store.setError(error);
        options?.onError?.(error);
        logger.error('Error starting assessment', err);
        return { success: false, error };
      } finally {
        store.setLoading(false);
      }
    },
    [store, options]
  );

  // ========================================================================
  // SAVE RESPONSE
  // ========================================================================

  const saveResponse = useCallback(
    async (questionId: string, answer: any) => {
      try {
        if (!store.attemptId) {
          logger.warn('No attempt ID available for saving response');
          return { success: false, error: 'No active assessment' };
        }

        logger.debug('Saving response', { questionId, attemptId: store.attemptId });

        // Save to store immediately for UI responsiveness
        store.saveAnswer(questionId, answer);

        // Save to backend
        const response = await assessmentApi.saveResponse({
          attemptId: store.attemptId,
          questionId,
          answer,
        });

        if (!response.success) {
          logger.warn('Failed to save response to backend', { error: response.error });
          // Don't fail - answer is saved locally, backend save is best-effort
        }

        return { success: true };
      } catch (err: any) {
        logger.error('Error saving response', err);
        // Don't fail - answer is saved locally
        return { success: true };
      }
    },
    [store]
  );

  // ========================================================================
  // UPDATE PROGRESS
  // ========================================================================

  const updateProgress = useCallback(
    async (
      sectionIndex: number,
      questionIndex: number,
      sectionTimings?: Record<string, number>,
      timerRemaining?: number | null,
      elapsedTime?: number | null,
      answers?: Record<string, any>
    ) => {
      try {
        if (!store.attemptId) {
          logger.warn('No attempt ID available for updating progress');
          return { success: false, error: 'No active assessment' };
        }

        logger.debug('Updating progress', {
          attemptId: store.attemptId,
          sectionIndex,
          questionIndex,
        });

        const response = await assessmentApi.updateProgress({
          attemptId: store.attemptId,
          sectionIndex,
          questionIndex,
          sectionTimings,
          timerRemaining,
          elapsedTime,
          answers,
        });

        if (!response.success) {
          const error = response.error || 'Failed to update progress';
          logger.error('Failed to update progress', { error });
          return { success: false, error, userMessage: response.userMessage };
        }

        logger.debug('Progress updated successfully');
        return { success: true };
      } catch (err: any) {
        const error = err.message || 'Unexpected error updating progress';
        logger.error('Error updating progress', err);
        return { success: false, error };
      }
    },
    [store]
  );

  // ========================================================================
  // SUBMIT ASSESSMENT
  // ========================================================================

  const submitAssessment = useCallback(
    async (sectionTimings?: Record<string, number>) => {
      try {
        if (!store.attemptId) {
          const error = 'No active assessment to submit';
          logger.error(error);
          return { success: false, error };
        }

        logger.info('Submitting assessment', { attemptId: store.attemptId });
        store.setStatus('submitting');

        const response = await assessmentApi.submitAssessment({
          attemptId: store.attemptId,
          answers: store.answers,
          sectionTimings,
        });

        if (!response.success) {
          const error = response.error || 'Failed to submit assessment';
          store.setError(error);
          store.setStatus('error');
          options?.onError?.(error);
          return { success: false, error };
        }

        store.setStatus('completed');
        logger.info('Assessment submitted successfully', { resultId: response.resultId });
        options?.onSuccess?.('Assessment submitted successfully');
        return { success: true, resultId: response.resultId };
      } catch (err: any) {
        const error = err.message || 'Unexpected error submitting assessment';
        store.setError(error);
        store.setStatus('error');
        options?.onError?.(error);
        logger.error('Error submitting assessment', err);
        return { success: false, error };
      }
    },
    [store, options]
  );

  // ========================================================================
  // CHECK IN-PROGRESS
  // ========================================================================

  const checkInProgress = useCallback(async () => {
    try {
      logger.info('Checking for in-progress assessment');

      const response = await assessmentApi.checkInProgress();

      if (!response.success) {
        logger.info('No in-progress assessment found');
        return { success: false, hasInProgress: false };
      }

      if (response.hasInProgress && response.attemptId) {
        logger.info('Found in-progress assessment', { attemptId: response.attemptId });
        return {
          success: true,
          hasInProgress: true,
          attemptId: response.attemptId,
          answers: response.answers,
        };
      }

      return { success: true, hasInProgress: false };
    } catch (err: any) {
      logger.error('Error checking in-progress assessment', err);
      return { success: false, hasInProgress: false, error: err.message };
    }
  }, []);

  // ========================================================================
  // ABANDON ATTEMPT
  // ========================================================================

  const abandonAttempt = useCallback(async (attemptId: string) => {
    try {
      logger.info('Abandoning assessment attempt', { attemptId });

      const response = await assessmentApi.abandonAttempt(attemptId);

      if (!response.success) {
        logger.warn('Failed to abandon attempt', { error: response.error });
        return { success: false, error: response.error };
      }

      logger.info('Assessment attempt abandoned successfully');
      store.reset();
      return { success: true };
    } catch (err: any) {
      logger.error('Error abandoning attempt', err);
      return { success: false, error: err.message };
    }
  }, [store]);

  // ========================================================================
  // RESET
  // ========================================================================

  const reset = useCallback(() => {
    logger.info('Resetting assessment');
    store.reset();
  }, [store]);

  return {
    // State
    attemptId: store.attemptId,
    status: store.status,
    loading: store.loading,
    error: store.error,
    answers: store.answers,

    // Actions
    startAssessment,
    saveResponse,
    updateProgress,
    submitAssessment,
    checkInProgress,
    abandonAttempt,
    reset,

    // Store access for advanced usage
    store,
  };
}

export default useAssessmentService;
