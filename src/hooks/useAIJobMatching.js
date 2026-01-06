import { useCallback, useEffect, useState } from 'react';
import { matchJobsWithAI, refreshJobMatches } from '../services/aiJobMatchingService';
import { OpportunitiesService } from '../services/opportunitiesService';

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

        // Fetch all active opportunities
        const opportunities = await OpportunitiesService.getAllOpportunities();

        // Filter only active opportunities
        const activeOpportunities = opportunities.filter(opp => {
          // Check if active flag is true
          if (opp.is_active === false || opp.status === 'draft') {
            return false;
          }

          // Check if deadline hasn't passed
          if (opp.deadline) {
            const deadline = new Date(opp.deadline);
            const now = new Date();
            if (deadline < now) {
              return false;
            }
          }

          return true;
        });


        if (activeOpportunities.length === 0) {
          setMatchedJobs([]);
          setLoading(false);
          return;
        }

        // Run AI matching (will use cache if available)
        const matches = await matchJobsWithAI(studentProfile, activeOpportunities, topN);

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

      const opportunities = await OpportunitiesService.getAllOpportunities();
      const activeOpportunities = opportunities.filter(opp => 
        opp.is_active !== false && 
        opp.status !== 'draft' &&
        (!opp.deadline || new Date(opp.deadline) >= new Date())
      );

      // Use refreshJobMatches which forces cache bypass
      const matches = await refreshJobMatches(studentProfile, activeOpportunities, topN);
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

      const opportunities = await OpportunitiesService.getAllOpportunities();
      const activeOpportunities = opportunities.filter(opp => 
        opp.is_active !== false && 
        opp.status !== 'draft' &&
        (!opp.deadline || new Date(opp.deadline) >= new Date())
      );

      const matches = await matchJobsWithAI(studentProfile, activeOpportunities, topN);
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
