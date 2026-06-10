import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWSClient } from '@/shared/api/wsRealtimeClient';
import type { FunnelRangePreset } from '@/shared/types';

interface UseCoursePerformanceOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
  limit?: number;
  getCoursePerformance: (preset: FunnelRangePreset, startDate?: string, endDate?: string, limit?: number) => Promise<{ data: any }>;
}

export const useCoursePerformance = ({
  preset,
  startDate,
  endDate,
  limit = 4,
  getCoursePerformance
}: UseCoursePerformanceOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const query = useQuery({
    queryKey: ['course-performance', { preset, startDate, endDate, limit }],
    queryFn: async () => {
      const { data } = await getCoursePerformance(preset, startDate, endDate, limit);
      return data;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    const wsClient = getWSClient();
    const unsubscribers: Array<() => void> = [];

    // Subscribe to pipeline_candidates changes
    const unsubCandidates = wsClient.subscribe(
      'pipeline_candidates',
      { event: '*' },
      () => {
        queryClient.invalidateQueries({ queryKey: ['course-performance'] });
      }
    );
    unsubscribers.push(unsubCandidates);

    // Subscribe to learners changes
    const unsubLearners = wsClient.subscribe(
      'learners',
      { event: '*' },
      () => {
        queryClient.invalidateQueries({ queryKey: ['course-performance'] });
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
