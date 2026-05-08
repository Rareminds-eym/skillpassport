import { useState, useEffect } from 'react';
import { matchJobsWithAI, refreshJobMatches } from '@/features/opportunities';

/**
 * Custom hook for AI-powered job matching
 * Uses the career-api Cloudflare Worker which handles:
 * - Vector similarity search against opportunities
 * - Database-level caching (24-hour TTL)
 * - Automatic cache invalidation
 * 
 * @param {Object} learnerProfile - Learner profile data
 * @param {boolean} enabled - Whether to run matching (default: true)
 * @param {number} topN - Number of matches to return (default: 3)
 * @returns {Object} Hook state with matched jobs, loading, error, cacheInfo, and refreshMatches
 */
export const useAIJobMatching = (learnerProfile, enabled = true, topN = 3) => {
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cacheInfo, setCacheInfo] = useState({});

  useEffect(() => {
    const fetchMatches = async () => {
      // Don't run if disabled or no profile
      if (!enabled || !learnerProfile) {
        setMatchedJobs([]);
        setLoading(false);
        return;
      }

      // Check if learnerProfile has an ID
      const learnerId = learnerProfile?.id || learnerProfile?.learner_id;
      if (!learnerId) {
        setMatchedJobs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Call the API - it handles opportunities fetching internally
        const matches = await matchJobsWithAI(learnerProfile, topN, false);

        // Extract cache info from first match if available
        if (matches.length > 0) {
          setCacheInfo({
            cached: matches[0].cached,
            computedAt: matches[0].computed_at
          });
        }

        setMatchedJobs(matches);

      } catch (err) {
        setError(err.message || 'Failed to match jobs');
        setMatchedJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [
    learnerProfile?.id, 
    learnerProfile?.email,
    learnerProfile?.department,
    learnerProfile?.profile?.department,
    learnerProfile?.profile?.branch_field,
    enabled, 
    topN
  ]);

  /**
   * Manually refresh job matches - forces cache bypass
   */
  const refreshMatches = async () => {
    if (!learnerProfile) return;

    try {
      setLoading(true);
      setError(null);

      // Force refresh bypasses cache
      const matches = await refreshJobMatches(learnerProfile, topN);
      
      if (matches.length > 0) {
        setCacheInfo({
          cached: false,
          computedAt: new Date().toISOString()
        });
      }

      setMatchedJobs(matches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    matchedJobs,
    loading,
    error,
    cacheInfo,
    refreshMatches
  };
};

export default useAIJobMatching;
