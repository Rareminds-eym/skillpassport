/**
 * Hook to fetch learner data from Supabase by learner ID
 * 
 * Works with your actual learners table structure (profile JSONB column)
 */

import { useState, useEffect } from 'react';
import { getlearnerById } from '@/entities/learner/api/learnerService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-data-hook');

export const useLearnerDataById = (learnerId, fallbackToMock = true) => {
  const [learnerData, setlearnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!learnerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await getlearnerById(learnerId);

        if (result.success && result.data) {
          setlearnerData(result.data);
          setError(null);
        } else {
          // Check if it's an RLS error
          const errorMsg = result.error || 'Learner not found';
          if (errorMsg.toLowerCase().includes('row-level security') ||
            errorMsg.toLowerCase().includes('rls') ||
            errorMsg.toLowerCase().includes('permission denied')) {
            setError('⚠️ Database access blocked. Please disable RLS in Supabase. See FIX_RLS.md');
            logger.error('RLS policy blocking learner data access', undefined, { learnerId });
          } else {
            setError(errorMsg);
            logger.warn('Failed to fetch learner data', { learnerId, error: errorMsg });
          }
          setlearnerData(null);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to fetch learner data', error, { learnerId });
        setError(error.message || 'Failed to fetch learner data');
        setlearnerData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [learnerId, fallbackToMock]);

  return { learnerData, loading, error };
};