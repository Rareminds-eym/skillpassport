import { useUser } from '@/shared/model/authStore';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWSClient } from '@/shared/api/wsRealtimeClient';
import { queryKeys } from '@/shared/lib/queryKeys';
type FunnelRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom';

interface UseRecruitmentFunnelOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
}

/**
 * DEPENDENCY INJECTION PATTERN APPLIED
 * 
 * This hook accepts API functions as parameters instead of importing from features.
 * This maintains FSD architecture by preventing entities from depending on features.
 * 
 * Usage: Import the required functions from the feature layer and pass them to this hook.
 */

export const useRecruitmentFunnel = <T,>(
  { preset, startDate, endDate }: UseRecruitmentFunnelOptions,
  getRecruitmentFunnelStats: (preset: FunnelRangePreset, startDate?: string, endDate?: string) => Promise<{ data: T | null; error?: unknown }>
) => {
  const user = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.analytics.recruitment.funnel(user?.id || ''), { preset, startDate, endDate }],
    queryFn: async () => {
      const { data, error } = await getRecruitmentFunnelStats(preset, startDate, endDate);
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
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.recruitment.all });
      }
    );
    unsubscribers.push(unsubActivities);

    // Subscribe to pipeline_candidates changes
    const unsubCandidates = wsClient.subscribe(
      'pipeline_candidates',
      { event: '*' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.recruitment.all });
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
