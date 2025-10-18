import { useEffect, useRef, useCallback } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { FunnelRangePreset, getGeographicDistribution, getTopHiringColleges } from '../services/analyticsService';

interface UseDiversityDataOptions {
  preset: FunnelRangePreset;
  startDate?: string;
  endDate?: string;
  geoLimit?: number;
  collegesLimit?: number;
  enabled?: boolean;
}

/**
 * Combined hook for fetching both Geographic Distribution and Top Hiring Colleges data
 * Uses a shared WebSocket channel to reduce the number of active subscriptions
 * Provides better performance and reduced network overhead
 */
export const useDiversityData = ({ 
  preset, 
  startDate, 
  endDate,
  geoLimit = 4,
  collegesLimit = 4,
  enabled = true
}: UseDiversityDataOptions) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  // Memoized invalidation callback
  const invalidateQueries = useCallback(() => {
    // Invalidate both queries at once
    queryClient.invalidateQueries({ 
      queryKey: ['geographic-distribution'],
      refetchType: 'active'
    });
    queryClient.invalidateQueries({ 
      queryKey: ['top-hiring-colleges'],
      refetchType: 'active'
    });
  }, [queryClient]);

  // Use useQueries to fetch both datasets in parallel
  const queries = useQueries({
    queries: [
      {
        queryKey: ['geographic-distribution', { preset, startDate, endDate, limit: geoLimit }],
        queryFn: async () => {
          const { data, error } = await getGeographicDistribution(preset, startDate, endDate, geoLimit);
          if (error) throw error;
          return data;
        },
        enabled,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
        placeholderData: (previousData: any) => previousData,
      },
      {
        queryKey: ['top-hiring-colleges', { preset, startDate, endDate, limit: collegesLimit }],
        queryFn: async () => {
          const { data, error } = await getTopHiringColleges(preset, startDate, endDate, collegesLimit);
          if (error) throw error;
          return data;
        },
        enabled,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
        placeholderData: (previousData: any) => previousData,
      },
    ],
  });

  const [geographicQuery, collegesQuery] = queries;

  // Single WebSocket channel for both datasets
  useEffect(() => {
    if (!enabled) return;

    // Use a stable channel name shared between both datasets
    const channelName = 'diversity-data-realtime';
    
    // Check if channel already exists
    const existingChannel = supabase.getChannels().find(ch => ch.topic === channelName);
    if (existingChannel) {
      channelRef.current = existingChannel;
      return;
    }

    // Single subscription for both geographic and colleges data
    const channel = supabase.channel(channelName)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pipeline_candidates' }, 
        invalidateQueries
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' }, 
        invalidateQueries
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
  }, [enabled, invalidateQueries]);

  return {
    geographic: {
      data: geographicQuery.data,
      isLoading: geographicQuery.isLoading,
      isError: geographicQuery.isError,
      error: geographicQuery.error,
      isFetching: geographicQuery.isFetching,
    },
    colleges: {
      data: collegesQuery.data,
      isLoading: collegesQuery.isLoading,
      isError: collegesQuery.isError,
      error: collegesQuery.error,
      isFetching: collegesQuery.isFetching,
    },
    // Combined loading state - useful for showing a single loader
    isLoading: geographicQuery.isLoading || collegesQuery.isLoading,
    // Combined error state
    isError: geographicQuery.isError || collegesQuery.isError,
    // Refetch both queries
    refetchAll: () => {
      geographicQuery.refetch();
      collegesQuery.refetch();
    },
  };
};
