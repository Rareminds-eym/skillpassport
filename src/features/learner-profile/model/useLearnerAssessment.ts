/**
 * Learner Assessment Hook
 * 
 * Fetches assessment recommendations from backend API using user_id from JWT
 * No parameters needed - backend uses authenticated user's ID
 */

import { useState, useEffect, useCallback } from 'react';
import { useLearnerId } from '@/shared/model/learnerStore';
import { getLearnerAssessmentData, type AssessmentData } from '../api/learnerAssessmentService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-learner-assessment');

export interface UseLearnerAssessmentOptions {
  enabled?: boolean;
}

export const useLearnerAssessment = ({ enabled = true }: UseLearnerAssessmentOptions = {}) => {
  // Get learnerId from store
  const learnerId = useLearnerId();

  const [data, setData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch assessment data
  const fetchAssessmentData = useCallback(async () => {
    if (!enabled || !learnerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Pass learnerId to service
      const result = await getLearnerAssessmentData(learnerId);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch assessment data');
      }
    } catch (err: any) {
      logger.error('Error fetching assessment data', err);
      setError(err.message || 'Failed to fetch assessment data');
    } finally {
      setLoading(false);
    }
  }, [enabled, learnerId]);

  // Trigger refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchAssessmentData();
  }, [fetchAssessmentData, refreshKey, learnerId]);

  return {
    // Assessment data
    recommendations: data?.recommendations || null,
    hasAssessment: data?.hasAssessment || false,
    hasInProgressAssessment: data?.hasInProgressAssessment || false,
    inProgressAttempt: data?.inProgressAttempt || null,
    latestAttemptId: data?.latestAttemptId || null,
    latestResult: data?.latestResult || null,
    
    // State
    loading,
    error,
    
    // Actions
    refresh,
    
    // Raw data
    data
  };
};
