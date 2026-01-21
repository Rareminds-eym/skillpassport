import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { FunnelRangePreset, getTopHiringColleges } from '../services/analyticsService';

interface UseTopHiringCollegesOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
  limit?: number;
  enabled?: boolean;
}

export const useTopHiringColleges = ({
  preset,
  startDate,
  endDate,
  limit = 10,
  enabled = true,
}: UseTopHiringCollegesOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const queryKey = ['top-hiring-colleges', { preset, startDate, endDate, limit }];

  // Memoized invalidation callback to prevent unnecessary re-subscriptions
  const invalidateQuery = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['top-hiring-colleges'],
      refetchType: 'active', // Only refetch active queries
    });
  }, [queryClient]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await getTopHiringColleges(preset, startDate, endDate, limit);
      if (error) throw error;
      return data;
    },
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 30 * 1000, // 30 seconds - increased for better caching
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache longer
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    placeholderData: (previousData) => previousData, // Keep previous data while refetching
  });

  useEffect(() => {
    if (!enabled) return;

    // Use a stable channel name to avoid creating multiple channels
    const channelName = 'top-hiring-colleges-realtime';

    // Check if channel already exists
    const existingChannel = supabase.getChannels().find((ch) => ch.topic === channelName);
    if (existingChannel) {
      channelRef.current = existingChannel;
      return;
    }

    // Subscribe to pipeline changes for real-time updates
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pipeline_candidates' },
        invalidateQuery
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, invalidateQuery);

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, invalidateQuery]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
};
