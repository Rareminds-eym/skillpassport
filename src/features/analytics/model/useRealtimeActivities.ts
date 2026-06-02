import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';
import { getRecentActivity } from '@/features/analytics/api/dashboardService';
import { queryKeys } from '@/shared/lib/queryKeys';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('realtime-activities');

export const useRealtimeActivities = (limit = 15) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const deletionActivitiesRef = useRef<any[]>([]);

  const query = useQuery({
    queryKey: queryKeys.analytics.realtime.activities(limit),
    queryFn: async () => {
      const result = await getRecentActivity(limit);
      const dbActivities = result.data || [];
      const now = Date.now();
      const recentDeletions = deletionActivitiesRef.current.filter(
        del => now - new Date(del.timestamp).getTime() < 5 * 60 * 1000
      );
      const combined = [...recentDeletions, ...dbActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
      return combined;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  const handleRealtimeChange = useCallback((table: string, payload: any) => {
    if (payload.event === 'DELETE') {
      const deletedActivity = {
        id: `deleted-${table}-${Date.now()}-${Math.random()}`,
        user: 'System',
        action: 'deleted',
        candidate: payload.payload
          ? (payload.payload.candidate_name || payload.payload.name || `${table} record`)
          : `${table} record`,
        details: `Removed from ${table.replace(/_/g, ' ')}`,
        timestamp: new Date().toISOString(),
        type: 'deletion',
        icon: 'delete',
        metadata: { table, deletedId: payload.payload?.id, hadFullData: !!payload.payload }
      };
      deletionActivitiesRef.current = [deletedActivity, ...deletionActivitiesRef.current].slice(0, 10);
    }

    queryClient.invalidateQueries({
      queryKey: queryKeys.analytics.realtime.all,
      refetchType: 'active'
    });
  }, [queryClient]);

  useEffect(() => {
    if (isSubscribedRef.current) return;

    const sseClient = getSSEClient();
    const unsubscribers: Array<() => void> = [];

    const tables = [
      'pipeline_activities', 'recruiter_activities', 'shortlist_candidates',
      'offers', 'placements', 'pipeline_candidates', 'shortlists',
    ];

    tables.forEach((table) => {
      const unsub = sseClient.subscribe(
        table,
        { event: '*' },
        (event) => {
          if (event.type === 'change') {
            handleRealtimeChange(table, event);
          }
        }
      );
      unsubscribers.push(unsub);
    });

    isSubscribedRef.current = true;

    return () => {
      unsubscribers.forEach(unsub => unsub());
      isSubscribedRef.current = false;
    };
  }, [handleRealtimeChange]);

  return {
    activities: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useRefreshActivities = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.realtime.all });
  };
};
