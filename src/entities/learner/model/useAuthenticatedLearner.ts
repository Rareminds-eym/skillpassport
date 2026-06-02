import { useEffect, useState } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('authenticated-learner');

interface User {
  id: string;
  email?: string;
}

export const useAuthenticatedLearner = (user: User | null) => {
  const [learnerData, setlearnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchlearnerData = async () => {
      if (!user) {
        setlearnerData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await apiPost('/learner-profile/actions', {
          action: 'fetch-authenticated-learner', userId: user.id,
        });

        if (result?.data) {
          setlearnerData(result.data);
          setError(null);
        } else {
          setError('Learner profile not found');
          setlearnerData(null);
        }
      } catch (err) {
        logger.error('Error in useAuthenticatedLearner', err instanceof Error ? err : new Error(String(err)), { userId: user?.id });
        setError(err.message);
        setlearnerData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchlearnerData();
  }, [user]);

  const updatelearnerData = async (updates) => {
    if (!user) throw new Error('No authenticated user');

    try {
      const result = await apiPost('/learner-profile/actions', {
        action: 'update-learner', userId: user.id, updates,
      });

      if (result?.data) {
        setlearnerData(result.data);
        return { success: true, data: result.data };
      }
      return { success: false, error: 'Update failed' };
    } catch (err) {
      logger.error('Error in updatelearnerData', err instanceof Error ? err : new Error(String(err)), { userId: user?.id });
      return { success: false, error: err.message };
    }
  };

  const refreshlearnerData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiPost('/learner-profile/actions', {
        action: 'fetch-authenticated-learner', userId: user.id,
      });

      if (result?.data) {
        setlearnerData(result.data);
        setError(null);
      } else {
        setError('Learner profile not found');
        setlearnerData(null);
      }
    } catch (err) {
      logger.error('Error refreshing learner data', err instanceof Error ? err : new Error(String(err)), { userId: user?.id });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    learnerData, loading, error, user,
    isAuthenticated: !!user,
    updatelearnerData, refreshlearnerData,
  };
};
