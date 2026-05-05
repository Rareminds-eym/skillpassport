import { useState, useCallback } from 'react';
import { getClassTimetable } from '@/features/myclass';
import { SchoolTimetableSlot } from '@/features/myclass';

interface UseTimetableDataReturn {
  timetable: SchoolTimetableSlot[];
  loading: boolean;
  error: Error | null;
  fetchData: () => void;
}

/**
 * Hook to fetch Timetable tab data
 * Lazy loads when Timetable tab is clicked
 */
export const useTimetableData = (classId: string | undefined): UseTimetableDataReturn => {
  const [timetable, setTimetable] = useState<SchoolTimetableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (!classId || hasFetched) return;

    try {
      setLoading(true);
      setError(null);

      const timetableData = await getClassTimetable(classId);
      setTimetable(timetableData);
      setHasFetched(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [classId, hasFetched]);

  return {
    timetable,
    loading,
    error,
    fetchData
  };
};
