import { useState, useEffect, useCallback } from 'react';
/**
 * Custom hook for fetching and managing learner recent updates BY LEARNER ID
 * @param {string} learnerId - Learner UUID from learners.id
 * @param {number} limit - Maximum number of updates to fetch (default: 10)
 * @param {Date} since - Fetch updates since this date (default: 30 days ago)
 * @returns {Object} - { recentUpdates, loading, error, refresh }
 */
export const useLearnerRecentUpdatesById = (learnerId, limit = 10, since = null) => {
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

/**
 * DEPENDENCY INJECTION PATTERN APPLIED
 * 
 * This hook accepts API functions as parameters instead of importing from features.
 * This maintains FSD architecture by preventing entities from depending on features.
 * 
 * Usage: Import the required functions from the feature layer and pass them to this hook.
 */

  const fetchRecentUpdates = useCallback(async () => {
    if (!learnerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);


      const result = await getlearnerRecentActivity(learnerId, limit);

      if (result.data) {
        setRecentUpdates(result.data);
        setError(null);
      } else {
        setError(result.error);
        setRecentUpdates([]);
      }
    } catch (err) {
      setError(err.message);
      setRecentUpdates([]);
    } finally {
      setLoading(false);
    }
  }, [learnerId, limit, since]);

  const refresh = useCallback(async () => {
    await fetchRecentUpdates();
  }, [fetchRecentUpdates, learnerId]);

  useEffect(() => {
    fetchRecentUpdates();
  }, [fetchRecentUpdates]);

  return {
    recentUpdates,
    loading,
    error,
    refresh
  };
};

export default useLearnerRecentUpdatesById;
