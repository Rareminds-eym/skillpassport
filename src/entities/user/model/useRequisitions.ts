/**
 * DEPENDENCY INJECTION PATTERN APPLIED
 * 
 * This hook should receive getRequisitions as a parameter.
 * Import from @/features/opportunities in the parent component and pass it down.
 * 
 * Example:
 *   import { getRequisitions } from '@/features/opportunities';
 *   const hook = useRequisitions(getRequisitions);
 */

import { useState, useEffect } from 'react';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('requisitions-hook');

export const useRequisitions = (
  getRequisitions: () => Promise<{ data: any; error: any }>
) => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await getRequisitions();

      if (fetchError) {
        setError(fetchError);
        logger.error('Failed to fetch requisitions', new Error(fetchError));
      } else {
        setRequisitions(data || []);
      }
    } catch (err) {
      setError(err);
      logger.error('Failed to fetch requisitions', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  return {
    requisitions,
    loading,
    error,
    refetch: fetchRequisitions
  };
};
