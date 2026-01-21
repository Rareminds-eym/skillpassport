import { useState, useEffect, useCallback } from 'react';
import {
  getStudentRecentUpdates,
  formatRecentUpdate,
} from '../services/studentRecentUpdatesService';

/**
 * Custom hook for fetching and managing student recent updates BY STUDENT ID
 * @param {string} studentId - Student UUID from students.id
 * @param {number} limit - Maximum number of updates to fetch (default: 10)
 * @param {Date} since - Fetch updates since this date (default: 30 days ago)
 * @returns {Object} - { recentUpdates, loading, error, refresh }
 */
export const useStudentRecentUpdatesById = (studentId, limit = 10, since = null) => {
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecentUpdates = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getStudentRecentUpdates(studentId, since, limit);

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
      console.error('❌ Error in useStudentRecentUpdatesById:', err);
      setError(err.message);
      setRecentUpdates([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, limit, since]);

  const refresh = useCallback(async () => {
    await fetchRecentUpdates();
  }, [fetchRecentUpdates, studentId]);

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

export default useStudentRecentUpdatesById;
