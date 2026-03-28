import { useState, useCallback } from 'react';
import { getTodaySchedule } from '../../../services/studentClassService';
import { getAssignmentStats } from '../../../services/assignmentsService';
import { SchoolTimetableSlot } from '../Tabs/TimetableViewTab';
import { AssignmentStats } from '../Tabs/OverviewTab';

interface UseOverviewDataReturn {
  todaySchedule: SchoolTimetableSlot[];
  stats: AssignmentStats;
  loading: boolean;
  error: Error | null;
  fetchData: () => void;
}

/**
 * Hook to fetch Overview tab data
 * Loads on mount - needed for overview widgets
 */
export const useOverviewData = (
  classId: string | undefined,
  studentId: string | undefined
): UseOverviewDataReturn => {
  const [todaySchedule, setTodaySchedule] = useState<SchoolTimetableSlot[]>([]);
  const [stats, setStats] = useState<AssignmentStats>({
    total: 0,
    todo: 0,
    inProgress: 0,
    submitted: 0,
    graded: 0,
    averageGrade: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (!classId || !studentId || hasFetched) return;

    try {
      setLoading(true);
      setError(null);

      const [todayData, statsData] = await Promise.all([
        getTodaySchedule(classId),
        getAssignmentStats(studentId)
      ]);

      setTodaySchedule(todayData);
      setStats(statsData as AssignmentStats);
      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching overview data:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [classId, studentId, hasFetched]);

  return {
    todaySchedule,
    stats,
    loading,
    error,
    fetchData
  };
};
