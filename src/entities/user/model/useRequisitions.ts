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
        console.error('Error fetching requisitions:', fetchError);
      } else {
        setRequisitions(data || []);
      }
    } catch (err) {
      setError(err);
      console.error('Error in useRequisitions:', err);
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
