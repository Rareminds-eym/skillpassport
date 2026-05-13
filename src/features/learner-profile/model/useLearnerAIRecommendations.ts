/**
 * Learner AI Recommendations Hook
 * 
 * Fetches AI-powered job recommendations from backend API using user_id from JWT
 * No parameters needed - backend uses authenticated user's ID
 */

import { useState, useEffect, useCallback } from 'react';
import { getLearnerAIRecommendations, type AIRecommendationsData, type AIRecommendation } from '../api/learnerAIRecommendationsService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-learner-ai-recommendations');

export interface UseLearnerAIRecommendationsOptions {
  enabled?: boolean;
  autoFetch?: boolean;
}

export const useLearnerAIRecommendations = ({ 
  enabled = true,
  autoFetch = true 
}: UseLearnerAIRecommendationsOptions = {}) => {
  const [data, setData] = useState<AIRecommendationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch AI recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getLearnerAIRecommendations();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch AI recommendations');
      }
    } catch (err: any) {
      logger.error('Error fetching AI recommendations', err);
      setError(err.message || 'Failed to fetch AI recommendations');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Trigger refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Load data on mount if autoFetch is enabled
  useEffect(() => {
    if (autoFetch && enabled) {
      fetchRecommendations();
    }
  }, [autoFetch, enabled, fetchRecommendations, refreshKey]);

  return {
    // Recommendations data
    recommendations: data?.recommendations || [],
    cached: data?.cached || false,
    fallback: data?.fallback || false,
    learnerProfile: data?.learnerProfile || null,
    
    // State
    loading,
    error,
    
    // Actions
    fetchRecommendations,
    refreshRecommendations: refresh,
    
    // Raw data
    data
  };
};
