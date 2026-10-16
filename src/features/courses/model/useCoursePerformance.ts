import { useUser } from '@/shared/model/authStore';
import type { FunnelRangePreset } from '@/features/analytics';
import { getWSClient } from '@/shared/api/wsRealtimeClient';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getCoursePerformance } from '../api/coursePerformanceService';

interface UseCoursePerformanceOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const useCoursePerformance = ({
  preset,
  startDate,
  endDate,
  limit = 4
}: UseCoursePerformanceOptions) => {
  const user = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.courses.performance.byPreset(preset, { startDate, endDate, limit }), user?.id],
    queryFn: async () => {
      const { data, error } = await getCoursePerformance(preset, startDate, endDate, limit);
      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    const wsClient = getWSClient();
    const unsubscribers: Array<() => void> = [];

    // Subscribe to pipeline_candidates changes
    const unsubPipeline = wsClient.subscribe(
      'pipeline_candidates',
      { event: '*' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.performance.all });
      }
    );
    unsubscribers.push(unsubPipeline);

    // Subscribe to learners changes
    const unsubLearners = wsClient.subscribe(
      'learners',
      { event: '*' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.performance.all });
      }
    );
    unsubscribers.push(unsubLearners);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
};
