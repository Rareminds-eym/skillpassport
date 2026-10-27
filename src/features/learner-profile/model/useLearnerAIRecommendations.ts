/**
 * Learner AI Recommendations Hook
 * 
 * Fetches AI-powered job recommendations from backend API using user_id from JWT
 * No parameters needed - backend uses authenticated user's ID
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/shared/model/authStore';
import { getLearnerAIRecommendations, type AIRecommendationsData } from '../api/learnerAIRecommendationsService';
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
  const user = useUser();
  const identity = useRef(user?.id);
  identity.current = user?.id;
  const sequence = useRef(0);
  const [dataOwner, setDataOwner] = useState(user?.id);
  const [data, setData] = useState<AIRecommendationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch AI recommendations
  const fetchRecommendations = useCallback(async () => {
    const ticket = ++sequence.current;
    const current = () => sequence.current === ticket && identity.current === user?.id;
    if (!enabled || !user?.id) {
      setData(null); setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getLearnerAIRecommendations();
      if (!current()) return;

      if (result.success && result.data) {
        setData(result.data);
        setDataOwner(user.id);
      } else {
        throw new Error(result.error || 'Failed to fetch AI recommendations');
      }
    } catch (err: any) {
      if (!current()) return;
      logger.error('Error fetching AI recommendations', err);
      setError(err.message || 'Failed to fetch AI recommendations');
    } finally {
      if (current()) setLoading(false);
    }
  }, [enabled, user?.id]);

  // Trigger refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Load data on mount if autoFetch is enabled
  useEffect(() => {
    setData(null); setError(null);
    if (autoFetch && enabled) {
      fetchRecommendations();
    }
    return () => { sequence.current++; };
  }, [autoFetch, enabled, fetchRecommendations, refreshKey]);

  useEffect(() => {
    const saved = () => { if (enabled) refresh(); };
    window.addEventListener('learner-profile-updated', saved);
    return () => window.removeEventListener('learner-profile-updated', saved);
  }, [enabled, refresh]);

  const visible = enabled && user?.id && dataOwner === user.id ? data : null;

  return {
    // Recommendations data
    recommendations: visible?.recommendations || [],
    cached: visible?.cached || false,
    fallback: visible?.fallback || false,
    learnerProfile: visible?.learnerProfile || null,
    
    // State
    loading,
    error,
    
    // Actions
    fetchRecommendations,
    refreshRecommendations: refresh,
    
    // Raw data
    data: visible
  };
};
