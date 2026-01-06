import { useCallback, useEffect, useState } from 'react';
import { matchJobsWithAI, refreshJobMatches } from '../services/aiJobMatchingService';

/**
 * Custom hook for AI-powered job matching with industrial-grade caching
 * 
 * The AI matching results are cached in the database and only recomputed when:
 * - Student profile data changes (skills, interests, etc.)
 * - Course enrollments change
 * - Training records change
 * - Opportunities catalog changes
 * - Cache expires (24 hours)
 * - Force refresh is requested
 * 
 * NOTE: This hook does NOT fetch opportunities - the AI matching API
 * queries opportunities directly from the database using vector similarity search.
 * 
 * @param {Object} studentProfile - Student profile data
 * @param {boolean} enabled - Whether to run matching (default: true)
 * @param {number} topN - Number of matches to return (default: 3)
 * @returns {Object} Hook state with matched jobs, loading, error, and cache info
 */
export const useAIJobMatching = (studentProfile, enabled = true, topN = 3) => {
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cacheInfo, setCacheInfo] = useState({ cached: false, computedAt: null });

  useEffect(() => {
    const fetchMatches = async () => {
      // Don't run if disabled or no profile
      if (!enabled || !studentProfile) {
        setMatchedJobs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('[useAIJobMatching] Fetching matches for:', {
          id: studentProfile?.id,
          email: studentProfile?.email,
          name: studentProfile?.name,
          department: studentProfile?.department,
          hasProfile: !!studentProfile?.profile,
          profileDept: studentProfile?.profile?.branch_field || studentProfile?.profile?.department
        });

        // Run AI matching - the API handles opportunity fetching via vector search
        // We pass an empty array as opportunities since the API doesn't use it
        // (it queries the database directly using the student's embedding)
        const matches = await matchJobsWithAI(studentProfile, [], topN);

        setMatchedJobs(matches);
        
        // Update cache info from first match (all have same cache status)
        if (matches.length > 0) {
          setCacheInfo({
            cached: matches[0].cached || false,
            computedAt: matches[0].computed_at || null
          });
        }

      } catch (err) {
        console.error('❌ Error in AI job matching:', err);
        setError(err.message || 'Failed to match jobs');
        setMatchedJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [
    studentProfile?.id, 
    studentProfile?.email,
    studentProfile?.department,
    studentProfile?.profile?.department,
    studentProfile?.profile?.branch_field,
    JSON.stringify(studentProfile?.profile?.technicalSkills || []),
    JSON.stringify(studentProfile?.profile?.technical_skills || []),
    enabled, 
    topN
  ]); // Re-run when student profile or key fields change

  /**
   * Manually refresh job matches - forces cache bypass
   * Use this when you want to ensure fresh AI computation
   */
  const forceRefreshMatches = useCallback(async () => {
    if (!studentProfile) return;

    try {
      setLoading(true);
      setError(null);

      // Use refreshJobMatches which forces cache bypass
      // API handles opportunity fetching via vector search
      const matches = await refreshJobMatches(studentProfile, [], topN);
      setMatchedJobs(matches);
      
      // Update cache info
      setCacheInfo({
        cached: false,
        computedAt: new Date().toISOString()
      });
      
      console.log('[useAIJobMatching] Force refreshed matches:', matches.length);
    } catch (err) {
      console.error('Error refreshing matches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentProfile, topN]);

  /**
   * Regular refresh - uses cache if available
   * @deprecated Use forceRefreshMatches for explicit refresh
   */
  const refreshMatches = useCallback(async () => {
    if (!studentProfile) return;

    try {
      setLoading(true);
      setError(null);

      // API handles opportunity fetching via vector search
      const matches = await matchJobsWithAI(studentProfile, [], topN);
      setMatchedJobs(matches);
      
      if (matches.length > 0) {
        setCacheInfo({
          cached: matches[0].cached || false,
          computedAt: matches[0].computed_at || null
        });
      }
    } catch (err) {
      console.error('Error refreshing matches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentProfile, topN]);

  return {
    matchedJobs,
    loading,
    error,
    cacheInfo,
    refreshMatches,
    forceRefreshMatches
  };
};

export default useAIJobMatching;
