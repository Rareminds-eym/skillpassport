import { useState, useEffect, useCallback } from 'react';
import {
  getStudentRecentUpdatesByEmail,
  formatRecentUpdate,
} from '../services/studentRecentUpdatesService';

/**
 * Custom hook for fetching and managing student recent updates
 * @param {string} email - Student email
 * @param {number} limit - Maximum number of updates to fetch (default: 10)
 * @param {Date} since - Fetch updates since this date (default: 30 days ago)
 * @returns {Object} - { recentUpdates, loading, error, refresh }
 */
export const useStudentRecentUpdates = (email, limit = 10, since = null) => {
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecentUpdates = useCallback(async () => {
    if (!email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getStudentRecentUpdatesByEmail(email, since, limit);

      if (result.success) {
        // Format the updates for display
        const formattedUpdates = result.data.map((update) => formatRecentUpdate(update));

        setRecentUpdates(formattedUpdates);
        setError(null);
      } else {
        setError(result.error);
        setRecentUpdates([]);
      }
    } catch (err) {
      console.error('❌ Error in useStudentRecentUpdates:', err);
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
    refresh,
  };
};

/**
 * Helper hook to get recent updates summary
 * @param {string} email - Student email
 * @returns {Object} - { hasNewUpdates, updateCount, latestUpdate, loading }
 */
export const useRecentUpdatesSummary = (email) => {
  const { recentUpdates, loading, error } = useStudentRecentUpdates(
    email,
    5,
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ); // Last 7 days

  const hasNewUpdates = recentUpdates.length > 0;
  const updateCount = recentUpdates.length;
  const latestUpdate = recentUpdates.length > 0 ? recentUpdates[0] : null;

  return {
    hasNewUpdates,
    updateCount,
    latestUpdate,
    loading,
    error,
  };
};

export default useStudentRecentUpdates;
