import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';
import { queryKeys } from '@/shared/lib/queryKeys';
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

export const useRecruitmentFunnel = (
  { preset, startDate, endDate }: UseRecruitmentFunnelOptions,
  getRecruitmentFunnelStats: (preset: FunnelRangePreset, startDate?: string, endDate?: string) => Promise<{ data: any }>
) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const query = useQuery({
    queryKey: queryKeys.analytics.recruitment.funnel(preset, { startDate, endDate }),
    queryFn: async () => {
      const { data } = await getRecruitmentFunnelStats(preset, startDate, endDate);
      return data;
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
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.recruitment.all });
      }
    );
    unsubscribers.push(unsubActivities);

    // Subscribe to pipeline_candidates changes
    const unsubCandidates = sseClient.subscribe(
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
    isError: query.isError,
    refetch: query.refetch,
  };
};
