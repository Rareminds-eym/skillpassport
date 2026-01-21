import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getRecentActivity } from '../services/dashboardService';

/**
 * Custom hook for real-time activity tracking
 * Uses React Query for caching + Supabase real-time for live updates
 */
export const useRealtimeActivities = (limit = 15) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const deletionActivitiesRef = useRef<any[]>([]); // Store deletion activities separately

  // Fetch activities using React Query
  const query = useQuery({
    queryKey: ['activities', limit],
    queryFn: async () => {
      const result = await getRecentActivity(limit);
      const dbActivities = result.data || [];

      // Merge with stored deletion activities (keep deletions from last 5 minutes)
      const now = Date.now();
      const recentDeletions = deletionActivitiesRef.current.filter(
        (del) => now - new Date(del.timestamp).getTime() < 5 * 60 * 1000 // 5 minutes
      );

      // Combine and sort by timestamp
      const combined = [...recentDeletions, ...dbActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return combined;
    },
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale to ensure fresh data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Callback to handle real-time changes
  const handleRealtimeChange = useCallback(
    (table: string, payload: any) => {
      // For DELETE events, handle both with and without old record data
      if (payload.eventType === 'DELETE') {
        // Create deletion activity (works even without REPLICA IDENTITY FULL)
        const deletedActivity = {
          id: `deleted-${table}-${Date.now()}-${Math.random()}`,
          user: 'System',
          action: 'deleted',
          candidate: payload.old
            ? payload.old.candidate_name || payload.old.name || `${table} record`
            : `${table} record`,
          details: `Removed from ${table.replace(/_/g, ' ')}`,
          timestamp: new Date().toISOString(),
          type: 'deletion',
          icon: 'delete',
          metadata: {
            table,
            deletedId: payload.old?.id,
            hadFullData: !!payload.old,
          },
        };

        // Store deletion activity in ref (persists across refetches)
        deletionActivitiesRef.current = [deletedActivity, ...deletionActivitiesRef.current].slice(
          0,
          10
        );

        // Show console warning if we don't have full data
        if (!payload.old) {
        }
      }

      // Force refetch to get fresh data (will merge with deletion activities)
      queryClient.invalidateQueries({
        queryKey: ['activities'],
        refetchType: 'active',
      });

      if (payload.eventType === 'INSERT') {
      } else if (payload.eventType === 'UPDATE') {
      } else if (payload.eventType === 'DELETE') {
      }
    },
    [queryClient]
  );

  // Set up real-time subscriptions for all tables
  useEffect(() => {
    // Don't set up if already subscribed
    if (isSubscribedRef.current) {
      return;
    }

    // Create a unique channel
    const channelName = `activities-realtime-${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Tables to monitor
    const tables = [
      'pipeline_activities',
      'recruiter_activities',
      'shortlist_candidates',
      'offers',
      'placements',
      'pipeline_candidates',
      'shortlists',
    ];

    // Subscribe to changes on each table
    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: table,
        },
        (payload) => handleRealtimeChange(table, payload)
      );
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Real-time subscription error');
        isSubscribedRef.current = false;
      } else if (status === 'TIMED_OUT') {
        console.error('⏰ Real-time subscription timed out');
        isSubscribedRef.current = false;
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [handleRealtimeChange]); // Only recreate if handleRealtimeChange changes

  return {
    activities: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to manually trigger activity refresh
 */
export const useRefreshActivities = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  };
};
