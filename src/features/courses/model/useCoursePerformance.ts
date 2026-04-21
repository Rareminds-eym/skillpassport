import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { FunnelRangePreset } from '@/features/analytics';
import { getCoursePerformance } from '../api/coursePerformanceService';
import { queryKeys } from '@/shared/lib/queryKeys';

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
  limit = 4
}: UseCoursePerformanceOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const query = useQuery({
    queryKey: queryKeys.courses.performance.byPreset(preset, { startDate, endDate, limit }),
    queryFn: async () => {
      const { data } = await getCoursePerformance(preset, startDate, endDate, limit);
      return data;
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    const channel = supabase.channel(`course-performance-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_candidates' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.performance.all });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.performance.all });
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
