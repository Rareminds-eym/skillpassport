import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';
import type { FunnelRangePreset } from '@/features/educator-copilot';
import { queryKeys } from '@/shared/lib/queryKeys';

interface UseSpeedAnalyticsOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
}

export const useSpeedAnalytics = ({ preset, startDate, endDate }: UseSpeedAnalyticsOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const query = useQuery({
    queryKey: queryKeys.analytics.speed.metrics(preset, { startDate, endDate }),
    queryFn: async () => {
      return null;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    const sseClient = getSSEClient();
    const unsubscribers: Array<() => void> = [];

    // Subscribe to pipeline_activities changes
    const unsubActivities = sseClient.subscribe(
      'pipeline_activities',
      { event: '*' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.speed.all });
      }
    );
    unsubscribers.push(unsubActivities);

    // Subscribe to pipeline_candidates changes
    const unsubCandidates = sseClient.subscribe(
      'pipeline_candidates',
      { event: '*' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.speed.all });
      }
    );
    unsubscribers.push(unsubCandidates);

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
