import { useState, useEffect } from 'react';
import { getRequisitions } from '../services/pipelineService';

export const useRequisitions = () => {
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
