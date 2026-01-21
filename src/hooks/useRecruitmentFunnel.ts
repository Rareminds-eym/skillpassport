import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { FunnelRangePreset, getRecruitmentFunnelStats } from '../services/analyticsService';

interface UseRecruitmentFunnelOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
}

export const useRecruitmentFunnel = ({
  preset,
  startDate,
  endDate,
}: UseRecruitmentFunnelOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const query = useQuery({
    queryKey: ['recruitment-funnel', { preset, startDate, endDate }],
    queryFn: async () => {
      const { data } = await getRecruitmentFunnelStats(preset, startDate, endDate);
      return data;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    // subscribe to stage changes and pipeline candidate changes
    const channel = supabase
      .channel(`recruitment-funnel-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_activities' },
        () => {
          // invalidate on any activity change
          queryClient.invalidateQueries({ queryKey: ['recruitment-funnel'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_candidates' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recruitment-funnel'] });
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
