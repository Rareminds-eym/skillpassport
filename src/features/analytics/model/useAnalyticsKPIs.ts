import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
// TODO: Fix this import - getAnalyticsKPIMetrics function is missing from educator-copilot
// import { FunnelRangePreset, getAnalyticsKPIMetrics } from '@/features/educator-copilot';
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
      // TODO: Implement getAnalyticsKPIMetrics or use alternative API
      // const { data } = await getAnalyticsKPIMetrics(preset, startDate, endDate);
      // return data;
      return null; // Temporary stub
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    // Subscribe to pipeline changes for real-time KPI updates
    const channel = supabase.channel(`analytics-kpis-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_activities' }, () => {
        // Invalidate on any activity change (stage changes, hires)
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.kpis.all });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_candidates' }, () => {
        // Invalidate when candidates are added or updated
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.kpis.all });
      });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};
