import { useState, useCallback } from 'react';
import { getGroupedStudentExams, getStudentResults, getStudentResultStats } from '@/features/exams';
import { SchoolGroupedExam } from '@/features/myclass';
import { SchoolStudentResult, SchoolResultStats } from '@/features/myclass';

interface UseExamsDataReturn {
  groupedExams: SchoolGroupedExam[];
  results: SchoolStudentResult[];
  resultStats: SchoolResultStats;
  loading: boolean;
  error: Error | null;
  fetchData: () => Promise<void>;
}

/**
 * Optimized exams data hook with lazy loading
 * Only fetches when explicitly called via fetchData()
 * Does NOT auto-fetch on mount
 */
export const useOptimizedExamsData = (studentId: string | undefined): UseExamsDataReturn => {
  const [groupedExams, setGroupedExams] = useState<SchoolGroupedExam[]>([]);
  const [results, setResults] = useState<SchoolStudentResult[]>([]);
  const [resultStats, setResultStats] = useState<SchoolResultStats>({
    totalExams: 0,
    passed: 0,
    failed: 0,
    absent: 0,
    averagePercentage: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (!studentId || hasFetched) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasFetched(true);

      const [groupedExamsData, resultsData, resultStatsData] = await Promise.all([
        getGroupedStudentExams(studentId),
        getStudentResults(studentId),
        getStudentResultStats(studentId)
      ]);

      setGroupedExams(groupedExamsData);
      setResults(resultsData as SchoolStudentResult[]);
      setResultStats(resultStatsData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [studentId, hasFetched]);

  return { groupedExams, results, resultStats, loading, error, fetchData };
};
