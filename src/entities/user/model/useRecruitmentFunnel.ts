import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
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
    const channel = supabase.channel(`recruitment-funnel-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_activities' }, () => {
        // invalidate on any activity change
        queryClient.invalidateQueries({ queryKey: ['recruitment-funnel'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_candidates' }, () => {
        queryClient.invalidateQueries({ queryKey: ['recruitment-funnel'] });
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
