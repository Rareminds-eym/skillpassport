import type { FunnelRangePreset } from '@/features/analytics';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
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
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const query = useQuery({
    queryKey: queryKeys.courses.performance.byPreset(preset, { startDate, endDate, limit }),
    queryFn: async () => {
      const { data } = await getCoursePerformance(preset, startDate, endDate, limit);
      return data;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    const sseClient = getSSEClient();
    const unsubscribers: Array<() => void> = [];

    // Subscribe to pipeline_candidates changes
    const unsubPipeline = sseClient.subscribe(
      'pipeline_candidates',
      { event: '*' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.performance.all });
      }
    );
    unsubscribers.push(unsubPipeline);

    // Subscribe to learners changes
    const unsubLearners = sseClient.subscribe(
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
    isError: query.isError,
    refetch: query.refetch,
  };
};
