import { FunnelRangePreset, getTopHiringColleges } from '@/features/educator-copilot';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface UseTopHiringCollegesOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
  limit?: number;
  enabled?: boolean;
}

export const useTopHiringColleges = ({
  preset,
  startDate,
  endDate,
  limit = 10,
  enabled = true
}: UseTopHiringCollegesOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const queryKey = queryKeys.analytics.hiring.topColleges(preset, { startDate, endDate, limit });

  // Memoized invalidation callback to prevent unnecessary re-subscriptions
  const invalidateQuery = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.analytics.hiring.all,
      refetchType: 'active' // Only refetch active queries
    });
  }, [queryClient]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await getTopHiringColleges(preset, startDate, endDate, limit);
      if (error) throw error;
      return data;
    },
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 30 * 1000, // 30 seconds - increased for better caching
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache longer
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    placeholderData: (previousData) => previousData, // Keep previous data while refetching
  });

  useEffect(() => {
    if (!enabled) return;

    const sseClient = getSSEClient();
    const unsubscribers: Array<() => void> = [];

    // Subscribe to pipeline_candidates changes
    const unsubPipeline = sseClient.subscribe(
      'pipeline_candidates',
      { event: '*' },
      (event) => {
        if (event.type === 'change') {
          invalidateQuery();
        }
      }
    );
    unsubscribers.push(unsubPipeline);

    // Subscribe to learners changes
    const unsubLearners = sseClient.subscribe(
      'learners',
      { event: '*' },
      (event) => {
        if (event.type === 'change') {
          invalidateQuery();
        }
      }
    );
    unsubscribers.push(unsubLearners);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [enabled, invalidateQuery]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
};
