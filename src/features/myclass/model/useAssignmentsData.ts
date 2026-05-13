import { useState, useCallback } from 'react';
import { getAssignmentsByLearnerId } from '@/features/educator-copilot';
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
export const useAssignmentsData = (learnerId: string | undefined): UseAssignmentsDataReturn => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (!learnerId || hasFetched) return;

    try {
      setLoading(true);
      setError(null);

      const assignmentsData = await getAssignmentsByLearnerId(learnerId);
      setAssignments(assignmentsData);
      setHasFetched(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [learnerId, hasFetched]);

  const refetchAssignments = useCallback(async () => {
    if (!learnerId) return;

    try {
      const assignmentsData = await getAssignmentsByLearnerId(learnerId);
      setAssignments(assignmentsData);
    } catch (err) {
      // Silent fail - error state will be handled by component
    }
  }, [learnerId]);

  return {
    assignments,
    loading,
    error,
    fetchData,
    refetchAssignments
  };
};
