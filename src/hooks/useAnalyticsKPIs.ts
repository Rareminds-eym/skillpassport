import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { FunnelRangePreset, getAnalyticsKPIMetrics } from '../services/analyticsService';

interface UseAnalyticsKPIsOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
}

export const useAnalyticsKPIs = ({ preset, startDate, endDate }: UseAnalyticsKPIsOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const query = useQuery({
    queryKey: ['analytics-kpis', { preset, startDate, endDate }],
    queryFn: async () => {
      const { data } = await getAnalyticsKPIMetrics(preset, startDate, endDate);
      return data;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    // Subscribe to pipeline changes for real-time KPI updates
    const channel = supabase
      .channel(`analytics-kpis-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_activities' },
        () => {
          // Invalidate on any activity change (stage changes, hires)
          queryClient.invalidateQueries({ queryKey: ['analytics-kpis'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_candidates' },
        () => {
          // Invalidate when candidates are added or updated
          queryClient.invalidateQueries({ queryKey: ['analytics-kpis'] });
        }
      );

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
