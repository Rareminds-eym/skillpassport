import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { FunnelRangePreset, getTopHiringColleges } from '../services/analyticsService';

interface UseTopHiringCollegesOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const useTopHiringColleges = ({ 
  preset, 
  startDate, 
  endDate,
  limit = 10 
}: UseTopHiringCollegesOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const query = useQuery({
    queryKey: ['top-hiring-colleges', { preset, startDate, endDate, limit }],
    queryFn: async () => {
      const { data } = await getTopHiringColleges(preset, startDate, endDate, limit);
      return data;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    // Subscribe to pipeline changes for real-time updates
    const channel = supabase.channel(`top-hiring-colleges-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_candidates' }, () => {
        // Invalidate when candidates are added or updated
        queryClient.invalidateQueries({ queryKey: ['top-hiring-colleges'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        // Invalidate when student profiles are updated
        queryClient.invalidateQueries({ queryKey: ['top-hiring-colleges'] });
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
