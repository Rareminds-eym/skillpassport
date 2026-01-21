/**
 * Student Real-time Activities Hook
 * Combines real-time activities with recent_updates table data
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getStudentRecentActivity } from '../services/studentActivityService';

/**
 * Helper — format timestamps into "2 min ago" / "Oct 24" etc.
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;

  if (isNaN(diffMs)) return 'Unknown time';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Custom hook for student-specific real-time activity tracking
 * @param {string} studentEmail - Student's email address
 * @param {number} limit - Number of activities to fetch (default: 10)
 */
export const useStudentRealtimeActivities = (studentEmail, limit = 10) => {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [studentId, setStudentId] = useState(null);
  const [isResolvingStudent, setIsResolvingStudent] = useState(false);

  // Get email from multiple sources with fallback
  const effectiveEmail = useMemo(() => {
    // Priority: 1. Passed parameter, 2. localStorage, 3. null
    const email = studentEmail || localStorage.getItem('userEmail');
    return email;
  }, [studentEmail]);

  // 1️⃣ Resolve student ID by email
  const fetchStudentIdByEmail = useCallback(async (email) => {
    if (!email) {
      return null;
    }

    try {
      setIsResolvingStudent(true);

      // Try multiple methods to find student
      let data = null;
      let error = null;

      // Search by direct email column (students table has email as a direct column)
      const result = await supabase
        .from('students')
        .select('id, email, name')
        .eq('email', email)
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
        setStudentId(null);
        return null;
      }

      setStudentId(data.id);
      return data.id;
    } catch (err) {
      setStudentId(null);
      return null;
    } finally {
      setIsResolvingStudent(false);
    }
  }, []);

  // 2️⃣ Fetch activities from recent_updates table by student_id
  const fetchRecentUpdatesFromDB = useCallback(async (resolvedStudentId) => {
    if (!resolvedStudentId) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('recent_updates')
        .select('*')
        .eq('student_id', resolvedStudentId)
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
        const parsed = typeof data.updates === 'string' ? JSON.parse(data.updates) : data.updates;

        updatesArray = (parsed?.updates || []).filter(Boolean);
      } catch (parseErr) {
        return [];
      }

      // Format timestamps and add proper structure
      const formattedUpdates = updatesArray.map((u, index) => {
        const realTimestamp =
          u.created_at && u.created_at !== 'Just now' ? u.created_at : new Date().toISOString();

        const formatted = {
          id: u.id || `update-${Date.now()}-${Math.random()}`,
          user: u.user || u.recruiter_name || 'System',
          action: u.action || '',
          candidate: u.candidate || u.student_name || '',
          details: u.details || u.description || '',
          message: u.message || '', // Keep the original message from recent_updates
          timestamp: realTimestamp,
          formattedTimestamp: formatTimestamp(realTimestamp),
          rawTimestamp: realTimestamp,
          type: u.type || u.activity_type || 'update',
          icon: u.icon || 'bell',
          metadata: u.metadata || {},
        };

        return formatted;
      });

      return formattedUpdates;
    } catch (err) {
      return [];
    }
  }, []);

  // 3️⃣ Resolve student ID when email changes
  useEffect(() => {
    if (effectiveEmail) {
      fetchStudentIdByEmail(effectiveEmail);
    } else {
      setStudentId(null);
    }
  }, [effectiveEmail, fetchStudentIdByEmail]);

  // Fetch activities using React Query with optimized settings
  const query = useQuery({
    queryKey: ['student-activities', effectiveEmail, studentId, limit],
    queryFn: async () => {
      if (!effectiveEmail) {
        return [];
      }

      // Wait for student ID resolution
      if (isResolvingStudent) {
        return [];
      }

      if (!studentId) {
        // Return empty array instead of throwing to prevent React Query errors
        return [];
      }

      // Fetch from both sources in parallel
      const [realtimeResult, recentUpdatesResult] = await Promise.all([
        getStudentRecentActivity(studentEmail, limit).catch((err) => {
          return { data: [], error: err.message };
        }),
        fetchRecentUpdatesFromDB(studentId),
      ]);

      const realtimeActivities = realtimeResult.data || [];
      const recentUpdatesActivities = recentUpdatesResult || [];

      // Combine all sources and sort by timestamp
      const combined = [...recentUpdatesActivities, ...realtimeActivities]
        // Remove duplicates based on ID
        .filter((activity, index, self) => {
          const isDuplicate = index !== self.findIndex((a) => a.id === activity.id);
          return !isDuplicate;
        })
        .sort((a, b) => {
          const timeA = new Date(a.timestamp || a.rawTimestamp || a.created_at).getTime();
          const timeB = new Date(b.timestamp || b.rawTimestamp || b.created_at).getTime();
          return timeB - timeA;
        })
        .slice(0, limit)
        // Ensure all activities have formatted timestamps
        .map((activity) => ({
          ...activity,
          formattedTimestamp:
            activity.formattedTimestamp ||
            formatTimestamp(activity.timestamp || activity.rawTimestamp || activity.created_at),
        }));

      return combined;
    },
    enabled: !!effectiveEmail && !isResolvingStudent && !!studentId, // Only run if email, student ID are available and not resolving
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
        ['student-activities', studentEmail, studentId, limit],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((activity) => ({
            ...activity,
            formattedTimestamp: formatTimestamp(
              activity.timestamp || activity.rawTimestamp || activity.created_at
            ),
          }));
        }
      );
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [query.data, queryClient, studentEmail, studentId, limit]);

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
        queryKey: ['student-activities', studentEmail],
        refetchType: 'active',
      });
    }, 500);
  }, [queryClient, studentEmail]);

  // Callback to handle real-time changes
  const handleRealtimeChange = useCallback(
    (table, payload) => {
      // Use debounced refetch instead of immediate
      debouncedRefetch();
    },
    [debouncedRefetch]
  );

  // Set up real-time subscriptions for student-relevant tables
  useEffect(() => {
    if (!studentEmail || !studentId || isSubscribedRef.current) {
      return;
    }

    const setupRealtimeSubscriptions = async () => {
      // Create a unique channel for this student
      const channelName = `student-activities-${studentId}-${Date.now()}`;
      const channel = supabase.channel(channelName);

      // Tables to monitor for student-specific changes
      const tableSubscriptions = [
        {
          table: 'recent_updates',
          filter: `student_id=eq.${studentId}`, // Listen for updates to this student's recent_updates
        },
        {
          table: 'shortlist_candidates',
          filter: `student_id=eq.${studentId}`,
        },
        {
          table: 'pipeline_activities',
          filter: `student_id=eq.${studentId}`,
        },
        {
          table: 'pipeline_candidates',
          filter: null, // Listen to all changes
        },
        {
          table: 'offers',
          filter: null, // Listen to all changes
        },
        {
          table: 'placements',
          filter: `studentId=eq.${studentId}`,
        },
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

        channel.on('postgres_changes', subscriptionConfig, (payload) =>
          handleRealtimeChange(table, payload)
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
  }, [studentEmail, studentId, handleRealtimeChange]);

  return {
    activities: query.data || [],
    isLoading: query.isLoading || isResolvingStudent,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isConnected: isSubscribedRef.current, // Real-time connection status
    lastUpdateTime, // Timestamp of last update for UI feedback
    studentId, // Expose student ID for other components
  };
};

/**
 * Hook to manually trigger student activity refresh
 */
export const useRefreshStudentActivities = (studentEmail) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: ['student-activities', studentEmail],
    });
  };
};
