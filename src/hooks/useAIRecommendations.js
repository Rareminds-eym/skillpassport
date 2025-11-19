import { useState, useEffect, useCallback } from 'react';
import AIRecommendationService from '../services/aiRecommendationService';
import { useAuth } from '../context/AuthContext';

/**
 * React hook for AI-powered job recommendations
 * @param {Object} options - Hook options
 * @param {boolean} options.autoFetch - Whether to fetch on mount
 * @param {boolean} options.enableTracking - Whether to track interactions
 */
export const useAIRecommendations = ({ 
  autoFetch = true,
  enableTracking = true 
} = {}) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const [fallback, setFallback] = useState(false);

  /**
   * Fetch AI recommendations
   */
  const fetchRecommendations = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await AIRecommendationService.getRecommendations(
        user.id,
        forceRefresh
      );

      if (result.success) {
        setRecommendations(result.recommendations);
        setCached(result.cached);
        setFallback(result.fallback);
      } else {
        throw new Error(result.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Track when user views an opportunity
   */
  const trackView = useCallback(async (opportunityId) => {
    if (!enableTracking || !user?.id) return;
    
    await AIRecommendationService.trackInteraction(
      user.id,
      opportunityId,
      'view'
    );
  }, [user?.id, enableTracking]);

  /**
   * Track when user saves an opportunity
   */
  const trackSave = useCallback(async (opportunityId) => {
    if (!enableTracking || !user?.id) return;
    
    await AIRecommendationService.trackInteraction(
      user.id,
      opportunityId,
      'save'
    );
  }, [user?.id, enableTracking]);

  /**
   * Track when user applies to an opportunity
   */
  const trackApply = useCallback(async (opportunityId) => {
    if (!enableTracking || !user?.id) return;
    
    await AIRecommendationService.trackInteraction(
      user.id,
      opportunityId,
      'apply'
    );
    
    // Remove from recommendations
    setRecommendations(prev => 
      prev.filter(rec => rec.id !== opportunityId)
    );
  }, [user?.id, enableTracking]);

  /**
   * Dismiss an opportunity (won't show again)
   */
  const dismissOpportunity = useCallback(async (opportunityId) => {
    if (!user?.id) return;
    
    await AIRecommendationService.dismissOpportunity(user.id, opportunityId);
    
    // Remove from recommendations
    setRecommendations(prev => 
      prev.filter(rec => rec.id !== opportunityId)
    );
  }, [user?.id]);

  /**
   * Refresh recommendations (bypass cache)
   */
  const refreshRecommendations = useCallback(() => {
    return fetchRecommendations(true);
  }, [fetchRecommendations]);

  /**
   * Get match explanation for a recommendation
   */
  const getMatchReasons = useCallback((opportunity) => {
    if (!opportunity?.match_reasons) return [];
    return AIRecommendationService.getMatchExplanation(opportunity.match_reasons);
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && user?.id) {
      fetchRecommendations();
    }
  }, [autoFetch, user?.id, fetchRecommendations]);

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
    getMatchReasons
  };
};

export default useAIRecommendations;

