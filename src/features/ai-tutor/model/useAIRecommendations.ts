import { useState, useEffect, useCallback } from 'react';
import AIRecommendationService from '@/features/ai-tutor/api/aiRecommendationService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-ai-recommendations');

/**
 * Custom hook for AI-powered job recommendations using vector similarity
 * @param {Object} options - Configuration options
 * @param {string} options.learnerId - Learner ID
 * @param {boolean} options.enabled - Whether to fetch recommendations (default: true)
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: true)
 * @param {number} options.limit - Number of recommendations to fetch (default: 20)
 * @returns {Object} Hook state with recommendations, loading, error, and actions
 */
export const useAIRecommendations = ({
  learnerId,
  enabled = true,
  autoFetch = true,
  limit = 20
} = {}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const [fallback, setFallback] = useState(false);

  /**
   * Fetch recommendations from the service
   */
  const fetchRecommendations = useCallback(async (forceRefresh = false) => {
    if (!learnerId || !enabled) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await AIRecommendationService.getRecommendations(
        learnerId,
        forceRefresh
      );

      if (result.success) {
        setRecommendations(result.recommendations || []);
        setCached(result.cached || false);
        setFallback(result.fallback || false);
      } else {
        throw new Error(result.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [learnerId, enabled]);

  /**
   * Refresh recommendations (bypass cache)
   */
  const refreshRecommendations = useCallback(async () => {
    await fetchRecommendations(true);
  }, [fetchRecommendations]);

  /**
   * Track when user views an opportunity
   */
  const trackView = useCallback(async (opportunityId) => {
    if (!learnerId) return;

    try {
      await AIRecommendationService.trackInteraction(
        learnerId,
        opportunityId,
        'view'
      );
    } catch (err) {
      logger.error('Error tracking view', err instanceof Error ? err : new Error(String(err)), { learnerId, opportunityId, action: 'view' });
    }
  }, [learnerId]);

  /**
   * Track when user saves an opportunity
   */
  const trackSave = useCallback(async (opportunityId) => {
    if (!learnerId) return;

    try {
      await AIRecommendationService.trackInteraction(
        learnerId,
        opportunityId,
        'save'
      );
    } catch (err) {
      logger.error('Error tracking save', err instanceof Error ? err : new Error(String(err)), { learnerId, opportunityId, action: 'save' });
    }
  }, [learnerId]);

  /**
   * Track when user applies to an opportunity
   */
  const trackApply = useCallback(async (opportunityId) => {
    if (!learnerId) return;

    try {
      await AIRecommendationService.trackInteraction(
        learnerId,
        opportunityId,
        'apply'
      );
      // Invalidate cache after apply
      await AIRecommendationService.invalidateCache(learnerId);
    } catch (err) {
      logger.error('Error tracking apply', err instanceof Error ? err : new Error(String(err)), { learnerId, opportunityId, action: 'apply' });
    }
  }, [learnerId]);

  /**
   * Dismiss an opportunity (won't show again)
   */
  const dismissOpportunity = useCallback(async (opportunityId) => {
    if (!learnerId) return;

    try {
      await AIRecommendationService.dismissOpportunity(learnerId, opportunityId);
      // Remove from current recommendations
      setRecommendations(prev => prev.filter(rec => rec.id !== opportunityId));
    } catch (err) {
      logger.error('Error dismissing opportunity', err instanceof Error ? err : new Error(String(err)), { learnerId, opportunityId });
    }
  }, [learnerId]);

  /**
   * Get match reasons for an opportunity
   */
  const getMatchReasons = useCallback((opportunity) => {
    if (!opportunity?.match_reasons) return [];
    return AIRecommendationService.getMatchExplanation(opportunity.match_reasons);
  }, []);

  /**
   * Generate embedding for learner profile
   */
  const generatelearnerEmbedding = useCallback(async () => {
    if (!learnerId) return;

    try {
      setLoading(true);

      const result = await AIRecommendationService.generatelearnerEmbedding(learnerId);

      if (result.success) {
        // Fetch fresh recommendations after generating embedding
        await fetchRecommendations(true);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [learnerId, fetchRecommendations]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && learnerId && enabled) {
      fetchRecommendations();
    }
  }, [autoFetch, learnerId, enabled, fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    cached,
    fallback,
    fetchRecommendations,
    refreshRecommendations,
    trackView,
    trackSave,
    trackApply,
    dismissOpportunity,
    getMatchReasons,
    generatelearnerEmbedding
  };
};

export default useAIRecommendations;
