/**
 * Hook to fetch authenticated learner data from Supabase
 * Uses the current authenticated user from Supabase Auth
 * 
 * @param user - The authenticated user object (pass from store/context)
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
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
      // If no user is authenticated, clear data
      if (!user) {
        setlearnerData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch directly from database
        const { data, error: dbError } = await supabase
          .from('learners')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dbError) {
          logger.error('Error fetching learner data', dbError, { userId: user.id });
          setError(dbError.message);
          setlearnerData(null);
        } else if (data) {
          setlearnerData(data);
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

  // Function to update learner data
  const updatelearnerData = async (updates) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {

      const { data, error } = await supabase
        .from('learners')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        logger.error('Error updating learner data', error, { userId: user.id });
        throw error;
      }

      setlearnerData(data);
      return { success: true, data };

    } catch (err) {
      logger.error('Error in updatelearnerData', err instanceof Error ? err : new Error(String(err)), { userId: user?.id });
      return { success: false, error: err.message };
    }
  };

  // Function to refresh learner data
  const refreshlearnerData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('learners')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Error refreshing learner data', error, { userId: user.id });
        setError(error.message);
      } else {
        setlearnerData(data);
        setError(null);
      }
    } catch (err) {
      logger.error('Error refreshing learner data', err instanceof Error ? err : new Error(String(err)), { userId: user?.id });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    learnerData,
    loading,
    error,
    user,
    isAuthenticated: !!user,
    updatelearnerData,
    refreshlearnerData
  };
};