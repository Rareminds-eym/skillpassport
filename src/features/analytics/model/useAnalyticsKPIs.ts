import { useUser } from '@/shared/model/authStore';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWSClient } from '@/shared/api/wsRealtimeClient';
import { getAnalyticsKPIMetrics, type FunnelRangePreset } from '../api/analyticsService';
import { queryKeys } from '@/shared/lib/queryKeys';

interface UseAnalyticsKPIsOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
}

export const useAnalyticsKPIs = ({ preset, startDate, endDate }: UseAnalyticsKPIsOptions) => {
  const user = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.analytics.kpis.data(user?.id || ''), { preset, startDate, endDate }],
    queryFn: async () => {
      const { data, error } = await getAnalyticsKPIMetrics(preset, startDate, endDate);
      if (error) throw error;
      return data;
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
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
};
