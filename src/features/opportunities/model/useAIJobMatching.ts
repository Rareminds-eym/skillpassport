import { useState, useEffect, useRef, useCallback } from 'react';
import { matchJobsWithAI, refreshJobMatches } from '@/features/opportunities';
import { useUser } from '@/shared/model/authStore';

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
export const useAIJobMatching = (learnerProfile: any, enabled = true, topN = 3) => {
  const user = useUser();
  const learnerId = learnerProfile?.id || learnerProfile?.learner_id;
  const identity = `${user?.id || ''}:${learnerId || ''}`;
  const generation = useRef(0);
  const activeIdentity = useRef(identity);
  activeIdentity.current = identity;
  const [resultIdentity, setResultIdentity] = useState(identity);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cacheInfo, setCacheInfo] = useState({});

  const fetchMatches = useCallback(async (force = false) => {
      const ticket = ++generation.current;
      const current = () => ticket === generation.current && identity === activeIdentity.current;
      // Don't run if disabled or no profile
      if (!enabled || !learnerId || !user?.id) {
        setMatchedJobs([]);
        setCacheInfo({});
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Call the API - it handles opportunities fetching internally
        const matches = await (force ? refreshJobMatches(learnerProfile, topN) : matchJobsWithAI(learnerProfile, topN, false));
        if (!current()) return;

        // Extract cache info from first match if available
        setCacheInfo(matches.length ? { cached: matches[0].cached, computedAt: matches[0].computed_at } : {});

        setResultIdentity(identity);
        setMatchedJobs(matches);

      } catch (err: any) {
        if (!current()) return;
        setResultIdentity(identity);
        setError(err.message || 'Failed to match jobs');
        setMatchedJobs([]);
      } finally {
        if (current()) setLoading(false);
      }
  }, [
    identity, user?.id, learnerId,
    learnerProfile?.email,
    learnerProfile?.department,
    learnerProfile?.profile?.department,
    learnerProfile?.profile?.branch_field,
    learnerProfile?.updated_at, learnerProfile?.recommendation_revision,
    enabled, 
    topN
  ]);

  useEffect(() => {
    setMatchedJobs([]); setCacheInfo({}); setError(null);
    void fetchMatches();
    return () => { generation.current++; };
  }, [fetchMatches]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const saved = (event: Event) => {
      if ((event as CustomEvent).detail?.learnerId !== learnerId) return;
      clearTimeout(timer);
      const before = generation.current;
      timer = setTimeout(() => {
        // A refreshed profile prop may already have started this same fetch.
        if (generation.current === before) void fetchMatches(true);
      }, 0);
    };
    window.addEventListener('learner-profile-updated', saved);
    return () => { clearTimeout(timer); window.removeEventListener('learner-profile-updated', saved); };
  }, [learnerId, fetchMatches]);

  /**
   * Manually refresh job matches - forces cache bypass
   */
  const refreshMatches = async () => {
    return fetchMatches(true);
  };

  return {
    matchedJobs: enabled && resultIdentity === identity ? matchedJobs : [],
    loading: enabled ? loading : false,
    error: enabled && resultIdentity === identity ? error : null,
    cacheInfo: enabled && resultIdentity === identity ? cacheInfo : {},
    refreshMatches
  };
};

export default useAIJobMatching;
