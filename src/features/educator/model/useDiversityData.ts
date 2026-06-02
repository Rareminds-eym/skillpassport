import { FunnelRangePreset, getGeographicDistribution, getTopHiringColleges } from '@/features/educator-copilot';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface UseDiversityDataOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
  geoLimit?: number;
  collegesLimit?: number;
  enabled?: boolean;
}

/**
 * Combined hook for fetching both Geographic Distribution and Top Hiring Colleges data
 * Uses a shared WebSocket channel to reduce the number of active subscriptions
 * Provides better performance and reduced network overhead
 */
export const useDiversityData = ({
  preset,
  startDate,
  endDate,
  geoLimit = 4,
  collegesLimit = 4,
  enabled = true
}: UseDiversityDataOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  // Memoized invalidation callback
  const invalidateQueries = useCallback(() => {
    // Invalidate both queries at once
    queryClient.invalidateQueries({
      queryKey: queryKeys.analytics.geographic.all,
      refetchType: 'active'
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.analytics.hiring.all,
      refetchType: 'active'
    });
  }, [queryClient]);

  // Use useQueries to fetch both datasets in parallel
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.analytics.geographic.distribution(preset, { startDate, endDate, limit: geoLimit }),
        queryFn: async () => {
          const { data, error } = await getGeographicDistribution(preset, startDate, endDate, geoLimit);
          if (error) throw error;
          return data;
        },
        enabled,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
        placeholderData: (previousData: any) => previousData,
      },
      {
        queryKey: queryKeys.analytics.hiring.topColleges(preset, { startDate, endDate, limit: collegesLimit }),
        queryFn: async () => {
          const { data, error } = await getTopHiringColleges(preset, startDate, endDate, collegesLimit);
          if (error) throw error;
          return data;
        },
        enabled,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
        placeholderData: (previousData: any) => previousData,
      },
    ],
  });

  const [geographicQuery, collegesQuery] = queries;

  // SSE subscriptions for both datasets
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
          invalidateQueries();
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
          invalidateQueries();
        }
      }
    );
    unsubscribers.push(unsubLearners);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [enabled, invalidateQueries]);

  return {
    geographic: {
      data: geographicQuery.data,
      isLoading: geographicQuery.isLoading,
      isError: geographicQuery.isError,
      error: geographicQuery.error,
      isFetching: geographicQuery.isFetching,
    },
    colleges: {
      data: collegesQuery.data,
      isLoading: collegesQuery.isLoading,
      isError: collegesQuery.isError,
      error: collegesQuery.error,
      isFetching: collegesQuery.isFetching,
    },
    // Combined loading state - useful for showing a single loader
    isLoading: geographicQuery.isLoading || collegesQuery.isLoading,
    // Combined error state
    isError: geographicQuery.isError || collegesQuery.isError,
    // Refetch both queries
    refetchAll: () => {
      geographicQuery.refetch();
      collegesQuery.refetch();
    },
  };
};
