import { useState, useCallback } from 'react';
import { getAssignmentsByStudentId } from '@/features/educator-copilot';
import { Assignment } from '@/features/myclass';

interface UseAssignmentsDataReturn {
  assignments: Assignment[];
  loading: boolean;
  error: Error | null;
  fetchData: () => void;
  refetchAssignments: () => Promise<void>;
}

/**
 * Hook to fetch Assignments tab data
 * Lazy loads when Assignments tab is clicked
 */
export const useAssignmentsData = (studentId: string | undefined): UseAssignmentsDataReturn => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (!studentId || hasFetched) return;

    try {
      setLoading(true);
      setError(null);

      const assignmentsData = await getAssignmentsByStudentId(studentId);
      setAssignments(assignmentsData);
      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [studentId, hasFetched]);

  const refetchAssignments = useCallback(async () => {
    if (!studentId) return;

    try {
      const assignmentsData = await getAssignmentsByStudentId(studentId);
      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Error refetching assignments:', err);
    }
  }, [studentId]);

  return {
    assignments,
    loading,
    error,
    fetchData,
    refetchAssignments
  };
};
