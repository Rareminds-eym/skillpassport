import { useState, useCallback } from 'react';
import { getClassmates } from '@/features/myclass';

interface SchoolClassmate {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface UseClassmatesDataReturn {
  classmates: SchoolClassmate[];
  loading: boolean;
  error: Error | null;
  fetchData: () => void;
}

/**
 * Hook to fetch Classmates tab data
 * Lazy loads when Classmates tab is clicked
 */
export const useClassmatesData = (
  classId: string | undefined,
  studentId: string | undefined
): UseClassmatesDataReturn => {
  const [classmates, setClassmates] = useState<SchoolClassmate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (!classId || !studentId || hasFetched) return;

    try {
      setLoading(true);
      setError(null);

      const classmatesData = await getClassmates(classId, studentId);
      setClassmates(classmatesData);
      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching classmates:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [classId, studentId, hasFetched]);

  return {
    classmates,
    loading,
    error,
    fetchData
  };
};
