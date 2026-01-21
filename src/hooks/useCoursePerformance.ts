import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { FunnelRangePreset, getCoursePerformance } from '../services/analyticsService';

interface UseCoursePerformanceOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export const useCoursePerformance = ({
  preset,
  startDate,
  endDate,
  limit = 4,
}: UseCoursePerformanceOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const query = useQuery({
    queryKey: ['course-performance', { preset, startDate, endDate, limit }],
    queryFn: async () => {
      const { data } = await getCoursePerformance(preset, startDate, endDate, limit);
      return data;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    // Subscribe to pipeline changes for real-time updates via WebSocket
    const channel = supabase
      .channel(`course-performance-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_candidates' },
        () => {
          // Invalidate when candidates are added or updated
          queryClient.invalidateQueries({ queryKey: ['course-performance'] });
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        // Invalidate when student profiles (courses) are updated
        queryClient.invalidateQueries({ queryKey: ['course-performance'] });
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
