/**
 * Learner Real-time Activities Hook
 * Combines real-time activities with recent_updates table data
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { getlearnerRecentActivity } from '@/shared/api/learnerActivityService';
import { queryKeys } from '@/shared/lib/queryKeys';

/**
 * Helper — format timestamps into "2 min ago" / "Oct 24" etc.
 */
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

/**
 * Custom hook for learner-specific real-time activity tracking
 * @param {string} learnerEmail - Learner's email address
 * @param {number} limit - Number of activities to fetch (default: 10)
 */
export const useLearnerRealtimeActivities = (learnerEmail, limit = 10) => {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [learnerId, setLearnerId] = useState(null);
  const [isResolvingLearner, setIsResolvingLearner] = useState(false);

  // Get email from multiple sources with fallback
  const effectiveEmail = useMemo(() => {
    // Priority: 1. Passed parameter, 2. localStorage, 3. null
    const email = learnerEmail || localStorage.getItem('userEmail');
    return email;
  }, [learnerEmail]);

  // 1️⃣ Resolve learner ID by email
  const fetchLearnerIdByEmail = useCallback(async (email) => {
    if (!email) {
      return null;
    }

    try {
      setIsResolvingLearner(true);

      // Try multiple methods to find learner
      let data = null;
      let error = null;

      // Search by direct email column (learners table has email as a direct column)
      const result = await supabase
        .from("learners")
        .select("id, email, name")
        .eq("email", email)
        .maybeSingle();

      if (result.data) {
        data = result.data;
      } else {
        error = result.error;
      }

      if (error) {
        throw error;
      }

      if (!data) {
        setLearnerId(null);
        return null;
      }

      setLearnerId(data.id);
      return data.id;
    } catch (err) {
      setLearnerId(null);
      return null;
    } finally {
      setIsResolvingLearner(false);
    }
  }, []);

  // 2️⃣ Fetch activities from recent_updates table by learner_id
  const fetchRecentUpdatesFromDB = useCallback(async (resolvedLearnerId) => {
    if (!resolvedLearnerId) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("recent_updates")
        .select("*")
        .eq("learner_id", resolvedLearnerId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return [];
      }

      // Safely parse JSONB and clean data
      let updatesArray = [];
      try {
        const parsed =
          typeof data.updates === "string"
            ? JSON.parse(data.updates)
            : data.updates;

        updatesArray = (parsed?.updates || []).filter(Boolean);
      } catch (parseErr) {
        return [];
      }

      // Format timestamps and add proper structure
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
          message: u.message || '', // Keep the original message from recent_updates
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
    } catch (err) {
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

  // Fetch activities using React Query with optimized settings
  const query = useQuery({
    queryKey: learnerId ? queryKeys.learner.activities.realtime(learnerId) : ['learner-activities', effectiveEmail, learnerId, limit],
    queryFn: async () => {
      if (!effectiveEmail) {
        return [];
      }

      // Wait for learner ID resolution
      if (isResolvingLearner) {
        return [];
      }

      if (!learnerId) {
        // Return empty array instead of throwing to prevent React Query errors
        return [];
      }

      // Fetch from both sources in parallel
      const [realtimeResult, recentUpdatesResult] = await Promise.all([
        getlearnerRecentActivity(learnerEmail, limit).catch(err => {
          return { data: [], error: err.message };
        }),
        fetchRecentUpdatesFromDB(learnerId)
      ]);

      const realtimeActivities = realtimeResult.data || [];
      const recentUpdatesActivities = recentUpdatesResult || [];

      // Combine all sources and sort by timestamp
      const combined = [...recentUpdatesActivities, ...realtimeActivities]
        // Remove duplicates based on ID
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
        // Ensure all activities have formatted timestamps
        .map(activity => ({
          ...activity,
          formattedTimestamp: activity.formattedTimestamp || formatTimestamp(activity.timestamp || activity.rawTimestamp || activity.created_at)
        }));

      return combined;
    },
    enabled: !!effectiveEmail && !isResolvingLearner && !!learnerId, // Only run if email, learner ID are available and not resolving
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes (reduced from 5)
    refetchInterval: false, // Disable polling, rely on WebSocket events
    refetchIntervalInBackground: false,
    retry: 1, // Reduce retries from 2 to 1
    retryDelay: 2000, // Increase delay between retries
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
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for 500ms debounce
    debounceTimerRef.current = setTimeout(() => {
      setLastUpdateTime(Date.now());
      queryClient.invalidateQueries({
        queryKey: queryKeys.learner.activities.all,
        refetchType: 'active'
      });
    }, 500);
  }, [queryClient, learnerEmail]);

  // Callback to handle real-time changes
  const handleRealtimeChange = useCallback((table, payload) => {
    // Use debounced refetch instead of immediate
    debouncedRefetch();
  }, [debouncedRefetch]);

  // Set up real-time subscriptions for learner-relevant tables
  useEffect(() => {
    if (!learnerEmail || !learnerId || isSubscribedRef.current) {
      return;
    }

    const setupRealtimeSubscriptions = async () => {
      // Create a unique channel for this learner
      const channelName = `learner-activities-${learnerId}-${Date.now()}`;
      const channel = supabase.channel(channelName);

      // Tables to monitor for learner-specific changes
      const tableSubscriptions = [
        {
          table: 'recent_updates',
          filter: `learner_id=eq.${learnerId}` // Listen for updates to this learner's recent_updates
        },
        {
          table: 'shortlist_candidates',
          filter: `learner_id=eq.${learnerId}`
        },
        {
          table: 'pipeline_activities',
          filter: `learner_id=eq.${learnerId}`
        },
        {
          table: 'pipeline_candidates',
          filter: null // Listen to all changes
        },
        {
          table: 'offers',
          filter: null // Listen to all changes
        },
        {
          table: 'placements',
          filter: `learnerId=eq.${learnerId}`
        }
      ];

      // Subscribe to changes on each table
      tableSubscriptions.forEach(({ table, filter }) => {
        const subscriptionConfig = {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: table,
        };

        // Add filter if available
        if (filter) {
          subscriptionConfig.filter = filter;
        }

        channel.on(
          'postgres_changes',
          subscriptionConfig,
          (payload) => handleRealtimeChange(table, payload)
        );
      });

      // Subscribe to the channel
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
        } else if (status === 'TIMED_OUT') {
          isSubscribedRef.current = false;
        } else if (status === 'CLOSED') {
          isSubscribedRef.current = false;
        }
      });

      channelRef.current = channel;
    };

    setupRealtimeSubscriptions();

    // Cleanup on unmount or email change
    return () => {
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Unsubscribe from WebSocket
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [learnerEmail, learnerId, handleRealtimeChange]);

  return {
    activities: query.data || [],
    isLoading: query.isLoading || isResolvingLearner,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isConnected: isSubscribedRef.current, // Real-time connection status
    lastUpdateTime, // Timestamp of last update for UI feedback
    learnerId, // Expose learner ID for other components
  };
};

/**
 * Hook to manually trigger learner activity refresh
 */
export const useRefreshlearnerActivities = (learnerEmail) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.learner.activities.all
    });
  };
};