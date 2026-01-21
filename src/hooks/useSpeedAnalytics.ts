import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { FunnelRangePreset, getSpeedAnalytics } from '../services/analyticsService';

interface UseSpeedAnalyticsOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
}

export const useSpeedAnalytics = ({ preset, startDate, endDate }: UseSpeedAnalyticsOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const query = useQuery({
    queryKey: ['speed-analytics', { preset, startDate, endDate }],
    queryFn: async () => {
      const { data } = await getSpeedAnalytics(preset, startDate, endDate);
      return data;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    // Subscribe to pipeline changes for real-time speed analytics updates via WebSocket
    const channel = supabase
      .channel(`speed-analytics-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_activities' },
        () => {
          // Invalidate when activities change (stage changes, timings)
          queryClient.invalidateQueries({ queryKey: ['speed-analytics'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_candidates' },
        () => {
          // Invalidate when candidates are added or updated
          queryClient.invalidateQueries({ queryKey: ['speed-analytics'] });
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
