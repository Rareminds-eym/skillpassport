import { useState, useEffect } from 'react';
import { getlearnerClassInfo } from '@/features/myclass';
import { SchoolClassInfo } from '@/features/myclass';

interface UseClassInfoReturn {
  classInfo: SchoolClassInfo | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch basic class information
 * Always loaded - needed for header display
 */
export const useClassInfo = (learnerId: string | undefined, authLoading: boolean): UseClassInfoReturn => {
  const [classInfo, setClassInfo] = useState<SchoolClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      if (!learnerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const classData = await getlearnerClassInfo(learnerId);
        setClassInfo(classData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [learnerId, authLoading]);

  return { classInfo, loading, error };
};
