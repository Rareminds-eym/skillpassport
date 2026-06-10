/**
 * Learner Store - Zustand State Management
 *
 * Single source of truth for learner profile data
 * Integrates with authenticated API via getlearnerByUserId
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { getLearnerByUserId } from '@/entities/learner/api/learnerService';
import { getLearnerAssessmentData } from '@/features/learner-profile/api/learnerAssessmentService';
import { getLogger } from '@/shared/config/logging';
import type { Learner } from '@/entities/learner/model/types';

const logger = getLogger('learner-store');

// ==================== STATE INTERFACE ====================

interface LearnerState {
  // Core learner data
  learner: Learner | null;
  learnerId: string | null;

  // Assessment data
  hasAssessment: boolean;
  hasInProgressAssessment: boolean;
  inProgressAttempt: any | null;
  latestAttemptId: string | null;

  // Loading states
  isLoading: boolean;
  isLoadingProfile: boolean;
  isLoadingAssessment: boolean;

  // Error states
  error: string | null;
  assessmentError: string | null;

  // Computed flags
  hasLearner: boolean;
  isProfileComplete: boolean;

  // ==================== ACTIONS ====================

  // Core learner actions
  loadLearnerByUserId: (userId: string) => Promise<void>;
  loadFullProfile: (userId: string) => Promise<void>;
  loadAssessmentData: (learnerId: string) => Promise<void>;
  clearLearner: () => void;

  // Utilities
  refreshProfile: () => Promise<void>;
  refreshAssessment: () => Promise<void>;
  setError: (error: string | null) => void;
}

// ==================== STORE IMPLEMENTATION ====================

export const useLearnerStore = create<LearnerState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      learner: null,
      learnerId: null,
      hasAssessment: false,
      hasInProgressAssessment: false,
      inProgressAttempt: null,
      latestAttemptId: null,
      isLoading: false,
      isLoadingProfile: false,
      isLoadingAssessment: false,
      error: null,
      assessmentError: null,
      hasLearner: false,
      isProfileComplete: false,

      // ==================== CORE LEARNER ACTIONS ====================

      loadLearnerByUserId: async (userId) => {
        // Clear old learner data first
        set((state) => {
          state.learner = null;
          state.learnerId = null;
          state.hasLearner = false;
          state.isProfileComplete = false;
          state.isLoading = true;
          state.error = null;
        });

        try {
          const result = await getLearnerByUserId(userId);

          if (result.success && result.data) {
            set((state) => {
              state.learner = result.data!;
              state.learnerId = result.data!.id;
              state.hasLearner = true;
              state.isProfileComplete = !!(result.data!.name && result.data!.email);
              state.isLoading = false;
            });
          } else {
            set((state) => {
              state.error = result.error || 'Learner not found';
              state.isLoading = false;
            });
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
          });
          logger.error('Error loading learner by user ID', err instanceof Error ? err : new Error(String(err)));
        }
      },

      loadFullProfile: async (userId) => {
        set((state) => {
          state.isLoadingProfile = true;
          state.error = null;
        });

        try {
          const result = await getLearnerByUserId(userId);

          if (result.success && result.data) {
            set((state) => {
              state.learner = result.data!;
              state.learnerId = result.data!.id;
              state.hasLearner = true;
              state.isProfileComplete = !!(result.data!.name && result.data!.email);
              state.isLoadingProfile = false;
            });
          } else {
            set((state) => {
              state.error = result.error || 'Failed to load profile';
              state.isLoadingProfile = false;
            });
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          set((state) => {
            state.error = errorMessage;
            state.isLoadingProfile = false;
          });
          logger.error('Error loading full learner profile', err instanceof Error ? err : new Error(String(err)));
        }
      },

      loadAssessmentData: async (learnerId) => {
        set((state) => {
          state.isLoadingAssessment = true;
          state.assessmentError = null;
        });

        try {
          const result = await getLearnerAssessmentData(learnerId);

          if (result.success && result.data) {
            set((state) => {
              state.hasAssessment = result.data!.hasAssessment;
              state.hasInProgressAssessment = result.data!.hasInProgressAssessment;
              state.inProgressAttempt = result.data!.inProgressAttempt || null;
              state.latestAttemptId = result.data!.latestAttemptId || null;
              state.isLoadingAssessment = false;
            });
            logger.info('Assessment data loaded', {
              learnerId,
              hasAssessment: result.data.hasAssessment,
              hasInProgress: result.data.hasInProgressAssessment
            });
          } else {
            set((state) => {
              state.assessmentError = result.error || 'Failed to load assessment data';
              state.isLoadingAssessment = false;
            });
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          set((state) => {
            state.assessmentError = errorMessage;
            state.isLoadingAssessment = false;
          });
          logger.error('Error loading assessment data', err instanceof Error ? err : new Error(String(err)));
        }
      },

      clearLearner: () => {
        set((state) => {
          state.learner = null;
          state.learnerId = null;
          state.hasLearner = false;
          state.isProfileComplete = false;
          state.hasAssessment = false;
          state.hasInProgressAssessment = false;
          state.inProgressAttempt = null;
          state.latestAttemptId = null;
          state.error = null;
          state.assessmentError = null;
        });
      },

      // ==================== UTILITIES ====================

      refreshProfile: async () => {
        const { learnerId } = get();
        if (learnerId) {
          await get().loadFullProfile(learnerId);
        }
      },

      refreshAssessment: async () => {
        const { learnerId } = get();
        if (learnerId) {
          await get().loadAssessmentData(learnerId);
        }
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },
    })),
    { name: 'LearnerStore' }
  )
);

// ==================== CONVENIENCE HOOKS ====================

export const useLearner = () => useLearnerStore((state) => state.learner);
export const useLearnerId = () => useLearnerStore((state) => state.learnerId);
export const useLearnerLoading = () => useLearnerStore((state) => state.isLoading);
export const useLearnerError = () => useLearnerStore((state) => state.error);
export const useHasLearner = () => useLearnerStore((state) => state.hasLearner);
export const useIsProfileComplete = () => useLearnerStore((state) => state.isProfileComplete);

// Assessment hooks
export const useHasAssessment = () => useLearnerStore((state) => state.hasAssessment);
export const useHasInProgressAssessment = () => useLearnerStore((state) => state.hasInProgressAssessment);
export const useInProgressAttempt = () => useLearnerStore((state) => state.inProgressAttempt);
export const useLatestAttemptId = () => useLearnerStore((state) => state.latestAttemptId);
export const useAssessmentLoading = () => useLearnerStore((state) => state.isLoadingAssessment);
export const useAssessmentError = () => useLearnerStore((state) => state.assessmentError);

export const useLearnerActions = () => ({
  loadLearnerByUserId: useLearnerStore((state) => state.loadLearnerByUserId),
  loadFullProfile: useLearnerStore((state) => state.loadFullProfile),
  loadAssessmentData: useLearnerStore((state) => state.loadAssessmentData),
  clearLearner: useLearnerStore((state) => state.clearLearner),
  refreshProfile: useLearnerStore((state) => state.refreshProfile),
  refreshAssessment: useLearnerStore((state) => state.refreshAssessment),
});

// Combined hook for profile access
export const useLearnerProfile = () => {
  const learner = useLearner();
  const isLoading = useLearnerLoading();
  const error = useLearnerError();
  const hasLearner = useHasLearner();

  return {
    learner,
    isLoading,
    error,
    hasLearner,
  };
};

// Export clearLearner for use in other stores
export const clearLearner = () => useLearnerStore.getState().clearLearner();
