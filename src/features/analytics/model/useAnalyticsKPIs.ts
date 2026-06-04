import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWSClient } from '@/shared/api/wsRealtimeClient';
import type { FunnelRangePreset } from '@/features/educator-copilot';
import { queryKeys } from '@/shared/lib/queryKeys';

interface UseAnalyticsKPIsOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
}

export const useAnalyticsKPIs = ({ preset, startDate, endDate }: UseAnalyticsKPIsOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const query = useQuery({
    queryKey: queryKeys.analytics.kpis.data(preset, { startDate, endDate }),
    queryFn: async () => {
      return null;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    const wsClient = getWSClient();
    const unsubscribers: Array<() => void> = [];

    // Subscribe to pipeline_activities changes
    const unsubActivities = wsClient.subscribe(
      'pipeline_activities',
      { event: '*' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.kpis.all });
      }
    );
    unsubscribers.push(unsubActivities);

    // Subscribe to pipeline_candidates changes
    const unsubCandidates = wsClient.subscribe(
      'pipeline_candidates',
      { event: '*' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.kpis.all });
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
