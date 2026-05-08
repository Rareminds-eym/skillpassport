import { useState, useEffect, useCallback } from 'react';
/**
 * Custom hook for fetching and managing learner recent updates
 * @param {string} email - Learner email
 * @param {number} limit - Maximum number of updates to fetch (default: 10)
 * @param {Date} since - Fetch updates since this date (default: 30 days ago)
 * @returns {Object} - { recentUpdates, loading, error, refresh }
 */
export const useLearnerRecentUpdates = (email, limit = 10, since = null) => {
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
    if (!email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);


      const result = await getlearnerRecentActivity(email, limit);

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
  }, [email, limit, since]);

  const refresh = useCallback(async () => {
    await fetchRecentUpdates();
  }, [fetchRecentUpdates, email]);

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

/**
 * Helper hook to get recent updates summary
 * @param {string} email - Learner email
 * @returns {Object} - { hasNewUpdates, updateCount, latestUpdate, loading }
 */
export const useRecentUpdatesSummary = (email) => {
  const { recentUpdates, loading, error } = useLearnerRecentUpdates(email, 5, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days

  const hasNewUpdates = recentUpdates.length > 0;
  const updateCount = recentUpdates.length;
  const latestUpdate = recentUpdates.length > 0 ? recentUpdates[0] : null;

  return {
    hasNewUpdates,
    updateCount,
    latestUpdate,
    loading,
    error
  };
};

export default useLearnerRecentUpdates;
