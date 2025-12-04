import { useState, useEffect, useCallback } from 'react';
import AIRecommendationService from '../services/aiRecommendationService';

/**
 * Custom hook for AI-powered job recommendations using vector similarity
 * @param {Object} options - Configuration options
 * @param {string} options.studentId - Student ID
 * @param {boolean} options.enabled - Whether to fetch recommendations (default: true)
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: true)
 * @param {number} options.limit - Number of recommendations to fetch (default: 20)
 * @returns {Object} Hook state with recommendations, loading, error, and actions
 */
export const useAIRecommendations = ({ 
  studentId, 
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
    console.log('🔍 useAIRecommendations - fetchRecommendations called:', {
      studentId,
      enabled,
      forceRefresh
    });

    if (!studentId || !enabled) {
      console.log('⚠️ Not fetching: studentId or enabled is false');
      setRecommendations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Fetching AI recommendations for student:', studentId);

      const result = await AIRecommendationService.getRecommendations(
        studentId, 
        forceRefresh
      );

      console.log('📦 Received result from service:', result);

      if (result.success) {
        setRecommendations(result.recommendations || []);
        setCached(result.cached || false);
        setFallback(result.fallback || false);
        
        console.log('✅ Received recommendations:', {
          count: result.recommendations?.length || 0,
          cached: result.cached,
          fallback: result.fallback,
          reason: result.reason
        });
      } else {
        throw new Error(result.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('❌ Error fetching recommendations:', err);
      setError(err.message || 'Failed to fetch recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, enabled]);

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
    if (!studentId) return;
    
    try {
      await AIRecommendationService.trackInteraction(
        studentId, 
        opportunityId, 
        'view'
      );
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  }, [studentId]);

  /**
   * Track when user saves an opportunity
   */
  const trackSave = useCallback(async (opportunityId) => {
    if (!studentId) return;
    
    try {
      await AIRecommendationService.trackInteraction(
        studentId, 
        opportunityId, 
        'save'
      );
    } catch (err) {
      console.error('Error tracking save:', err);
    }
  }, [studentId]);

  /**
   * Track when user applies to an opportunity
   */
  const trackApply = useCallback(async (opportunityId) => {
    if (!studentId) return;
    
    try {
      await AIRecommendationService.trackInteraction(
        studentId, 
        opportunityId, 
        'apply'
      );
      // Invalidate cache after apply
      await AIRecommendationService.invalidateCache(studentId);
    } catch (err) {
      console.error('Error tracking apply:', err);
    }
  }, [studentId]);

  /**
   * Dismiss an opportunity (won't show again)
   */
  const dismissOpportunity = useCallback(async (opportunityId) => {
    if (!studentId) return;
    
    try {
      await AIRecommendationService.dismissOpportunity(studentId, opportunityId);
      // Remove from current recommendations
      setRecommendations(prev => prev.filter(rec => rec.id !== opportunityId));
    } catch (err) {
      console.error('Error dismissing opportunity:', err);
    }
  }, [studentId]);

  /**
   * Get match reasons for an opportunity
   */
  const getMatchReasons = useCallback((opportunity) => {
    if (!opportunity?.match_reasons) return [];
    return AIRecommendationService.getMatchExplanation(opportunity.match_reasons);
  }, []);

  /**
   * Generate embedding for student profile
   */
  const generateStudentEmbedding = useCallback(async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      console.log('🔄 Generating student embedding...');
      
      const result = await AIRecommendationService.generateStudentEmbedding(studentId);
      
      if (result.success) {
        console.log('✅ Student embedding generated successfully');
        // Fetch fresh recommendations after generating embedding
        await fetchRecommendations(true);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Error generating student embedding:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId, fetchRecommendations]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && studentId && enabled) {
      fetchRecommendations();
    }
  }, [autoFetch, studentId, enabled, fetchRecommendations]);

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
    generateStudentEmbedding
  };
};

export default useAIRecommendations;
