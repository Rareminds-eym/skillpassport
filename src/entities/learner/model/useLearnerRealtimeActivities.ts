import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet } from '@/shared/api/apiClient';
import { getWSClient } from '@/shared/api/wsRealtimeClient';
import { getlearnerRecentActivity } from '@/shared/api/learnerActivityService';
import { queryKeys } from '@/shared/lib/queryKeys';
import { useAuthStore } from '@/shared/model/authStore';


const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;

  if (isNaN(diffMs)) return "Unknown time";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

export const useLearnerRealtimeActivities = (learnerEmail, limit = 10) => {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [learnerId, setLearnerId] = useState(null);
  const [isResolvingLearner, setIsResolvingLearner] = useState(false);

  const effectiveEmail = useMemo(() => {
    const email = learnerEmail || (useAuthStore.getState().user?.email || localStorage.getItem("userEmail"));
    return email;
  }, [learnerEmail]);

  // 1️⃣ Resolve learner ID by email via existing API
  const fetchLearnerIdByEmail = useCallback(async (email) => {
    if (!email) {
      return null;
    }

    try {
      setIsResolvingLearner(true);
      const response = await apiGet(`/learners/data/find-by-email?email=${encodeURIComponent(email)}`);
      const data = response?.data ?? response;
      if (data?.id) {
        setLearnerId(data.id);
        return data.id;
      }
      setLearnerId(null);
      return null;
    } catch {
      setLearnerId(null);
      return null;
    } finally {
      setIsResolvingLearner(false);
    }
  }, []);

  // 2️⃣ Fetch activities from recent_updates table by learner_id via API
  const fetchRecentUpdatesFromDB = useCallback(async (resolvedLearnerId) => {
    if (!resolvedLearnerId) {
      return [];
    }

    try {
      const response = await apiGet(`/learners/data/${resolvedLearnerId}/recent_updates`);
      const data = response?.data ?? response;
      const updateData = Array.isArray(data) ? data[0] : data;

      if (!updateData) {
        return [];
      }

      let updatesArray = [];
      try {
        const parsed =
          typeof updateData.updates === "string"
            ? JSON.parse(updateData.updates)
            : updateData.updates;

        updatesArray = (parsed?.updates || []).filter(Boolean);
      } catch {
        return [];
      }

      const formattedUpdates = updatesArray.map((u, index) => {
        const realTimestamp =
          u.created_at && u.created_at !== "Just now"
            ? u.created_at
            : new Date().toISOString();

        const formatted = {
          id: u.id || `update-${Date.now()}-${Math.random()}`,
          user: u.user || u.recruiter_name || 'System',
          action: u.action || '',
          candidate: u.candidate || u.learner_name || '',
          details: u.details || u.description || '',
          message: u.message || '',
          timestamp: realTimestamp,
          formattedTimestamp: formatTimestamp(realTimestamp),
          rawTimestamp: realTimestamp,
          type: u.type || u.activity_type || 'update',
          icon: u.icon || 'bell',
          metadata: u.metadata || {}
        };

        return formatted;
      });

      return formattedUpdates;
    } catch {
      return [];
    }
  }, []);

  // 3️⃣ Resolve learner ID when email changes
  useEffect(() => {
    if (effectiveEmail) {
      fetchLearnerIdByEmail(effectiveEmail);
    } else {
      setLearnerId(null);
    }
  }, [effectiveEmail, fetchLearnerIdByEmail]);

  const query = useQuery({
    queryKey: learnerId ? queryKeys.learner.activities.realtime(learnerId) : ['learner-activities', effectiveEmail, learnerId, limit],
    queryFn: async () => {
      if (!effectiveEmail) {
        return [];
      }

      if (isResolvingLearner) {
        return [];
      }

      if (!learnerId) {
        return [];
      }

      const [realtimeResult, recentUpdatesResult] = await Promise.all([
        getlearnerRecentActivity(learnerEmail, limit).catch(err => {
          return { data: [], error: err.message };
        }),
        fetchRecentUpdatesFromDB(learnerId)
      ]);

      const realtimeActivities = realtimeResult.data || [];
      const recentUpdatesActivities = recentUpdatesResult || [];

      const combined = [...recentUpdatesActivities, ...realtimeActivities]
        .filter((activity, index, self) => {
          const isDuplicate = index !== self.findIndex(a => a.id === activity.id);
          return !isDuplicate;
        })
        .sort((a, b) => {
          const timeA = new Date(a.timestamp || a.rawTimestamp || a.created_at).getTime();
          const timeB = new Date(b.timestamp || b.rawTimestamp || b.created_at).getTime();
          return timeB - timeA;
        })
        .slice(0, limit)
        .map(activity => ({
          ...activity,
          formattedTimestamp: activity.formattedTimestamp || formatTimestamp(activity.timestamp || activity.rawTimestamp || activity.created_at)
        }));

      return combined;
    },
    enabled: !!effectiveEmail && !isResolvingLearner && !!learnerId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    retry: 1,
    retryDelay: 2000,
  });

  // 4️⃣ Auto-refresh formatted timestamps every 60s
  useEffect(() => {
    if (!query.data || query.data.length === 0) return;

    const interval = setInterval(() => {
      queryClient.setQueryData(
        learnerId ? queryKeys.learner.activities.realtime(learnerId) : ['learner-activities', learnerEmail, learnerId, limit],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map(activity => ({
            ...activity,
            formattedTimestamp: formatTimestamp(activity.timestamp || activity.rawTimestamp || activity.created_at)
          }));
        }
      );
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [query.data, queryClient, learnerEmail, learnerId, limit]);

  // Debounced refetch to avoid too many requests
  const debouncedRefetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setLastUpdateTime(Date.now());
      queryClient.invalidateQueries({
        queryKey: queryKeys.learner.activities.all,
        refetchType: 'active'
      });
    }, 500);
  }, [queryClient, learnerEmail]);

  const handleRealtimeChange = useCallback((table, payload) => {
    debouncedRefetch();
  }, [debouncedRefetch]);

  // Set up real-time subscriptions using WebSocket
  useEffect(() => {
    if (!learnerEmail || !learnerId || isSubscribedRef.current) {
      return;
    }

    const wsClient = getWSClient();
    const unsubscribers: (() => void)[] = [];

    const tableSubscriptions = [
      { table: 'recent_updates', filter: `learner_id=eq.${learnerId}` },
      { table: 'shortlist_candidates', filter: `learner_id=eq.${learnerId}` },
      { table: 'pipeline_activities', filter: `learner_id=eq.${learnerId}` },
      { table: 'pipeline_candidates', filter: null },
      { table: 'offers', filter: null },
      { table: 'placements', filter: `learnerId=eq.${learnerId}` }
    ];

    tableSubscriptions.forEach(({ table, filter }) => {
      const config: any = { event: '*' as const };
      if (filter) config.filter = filter;
      const unsub = wsClient.subscribe(table, config, () => {
        handleRealtimeChange(table, {});
      });
      unsubscribers.push(unsub);
    });

    isSubscribedRef.current = true;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      unsubscribers.forEach(u => u());
      isSubscribedRef.current = false;
    };
  }, [learnerEmail, learnerId, handleRealtimeChange]);

  return {
    activities: query.data || [],
    isLoading: query.isLoading || isResolvingLearner,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isConnected: isSubscribedRef.current,
    lastUpdateTime,
    learnerId,
  };
};

export const useRefreshlearnerActivities = (learnerEmail) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.learner.activities.all
    });
  };
};
