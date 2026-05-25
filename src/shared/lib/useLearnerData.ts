/**
 * Learner Data Hook (Facade)
 * Simple hook that wraps Zustand store and handles auth integration
 *
 * Automatically fetches learner profile when user is authenticated
 */

import { useEffect } from 'react';
import { useLearnerStore } from '@/shared/model/learnerStore';
import { useUser } from '@/shared/model/authStore';

export interface UseLearnerDataOptions {
  enabled?: boolean;
}

/**
 * Hook to manage learner data with automatic auth integration
 *
 * @param options - Configuration options
 * @param options.enabled - Whether to enable fetching (default: true)
 * @returns Object with learner profile, loading/error states, and action methods
 *
 * @example
 * const { learner, isLoading, error, clearLearner } = useLearnerData();
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * return <div>Welcome {learner?.name}</div>;
 */
export const useLearnerData = ({ enabled = true }: UseLearnerDataOptions = {}) => {
  const user = useUser();

  // Get store state and actions
  const learner = useLearnerStore((state) => state.learner);
  const learnerId = useLearnerStore((state) => state.learnerId);
  const isLoading = useLearnerStore((state) => state.isLoading);
  const error = useLearnerStore((state) => state.error);
  const hasLearner = useLearnerStore((state) => state.hasLearner);
  const loadLearnerByUserId = useLearnerStore((state) => state.loadLearnerByUserId);
  const clearLearner = useLearnerStore((state) => state.clearLearner);

  // Load learner data when user is authenticated
  useEffect(() => {
    if (!enabled || !user?.id) {
      return;
    }

    loadLearnerByUserId(user.id);
  }, [enabled, user?.id, loadLearnerByUserId]);

  return {
    // Profile data
    learner,
    learnerId,

    // Status flags
    hasLearner,
    isLoading,
    error,

    // Action methods
    clearLearner,
  };
};
