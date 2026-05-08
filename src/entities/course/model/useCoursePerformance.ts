/**
 * Hook for course performance data.
 * Uses dependency injection - pass getCoursePerformance from the appropriate feature.
 */

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { FunnelRangePreset } from '@/shared/types';

interface UseCoursePerformanceOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
  limit?: number;
  getCoursePerformance: (preset: FunnelRangePreset, startDate?: string, endDate?: string, limit?: number) => Promise<{ data: any }>;
}

export const useCoursePerformance = ({
  preset,
  startDate,
  endDate,
  limit = 4,
  getCoursePerformance
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
    const channel = supabase.channel(`course-performance-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_candidates' }, () => {
        // Invalidate when candidates are added or updated
        queryClient.invalidateQueries({ queryKey: ['course-performance'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'learners' }, () => {
        // Invalidate when learner profiles (courses) are updated
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
