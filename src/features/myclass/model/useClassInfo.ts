import { useState, useEffect } from 'react';
import { getStudentClassInfo } from '@/features/myclass';
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
export const useClassInfo = (studentId: string | undefined, authLoading: boolean): UseClassInfoReturn => {
  const [classInfo, setClassInfo] = useState<SchoolClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      if (!studentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const classData = await getStudentClassInfo(studentId);
        setClassInfo(classData);
      } catch (err) {
        console.error('Error fetching class info:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, authLoading]);

  return { classInfo, loading, error };
};
