/**
 * Student Real-time Activities Hook
 * Similar to useRealtimeActivities but for student-specific activities
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getStudentRecentActivity } from '../services/studentActivityService';

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

  // Fetch activities using React Query with optimized settings
  const query = useQuery({
    queryKey: ['student-activities', studentEmail, limit],
    queryFn: async () => {
      if (!studentEmail) {
        return [];
      }

      const result = await getStudentRecentActivity(studentEmail, limit);
      
      if (result.error) {
        console.error('❌ Error fetching student activities:', result.error);
        throw new Error(result.error);
      }

      const activities = result.data || [];
      
      return activities;
    },
    enabled: !!studentEmail, // Only run if email is provided
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider fresh data (real-time requirement)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: false, // Disable polling, rely on WebSocket events
    refetchIntervalInBackground: false,
    retry: 2, // Retry failed requests twice
    retryDelay: 1000, // Wait 1s between retries
  });

  // Get student ID for real-time subscriptions
  const getStudentId = useCallback(async () => {
    if (!studentEmail) return null;
    
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('email', studentEmail)
        .single();
      
      return student?.id;
    } catch (error) {
      return null;
    }
  }, [studentEmail]);

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
        refetchType: 'active' 
      });
    }, 500);
  }, [queryClient, studentEmail]);

  // Callback to handle real-time changes
  const handleRealtimeChange = useCallback((table, payload) => {
    
    // Show toast notification for new activities
    if (payload.eventType === 'INSERT') {
      // You can add a toast notification here
    } else if (payload.eventType === 'UPDATE') {
    } else if (payload.eventType === 'DELETE') {
    }
    
    // Use debounced refetch instead of immediate
    debouncedRefetch();
  }, [debouncedRefetch]);

  // Set up real-time subscriptions for student-relevant tables
  useEffect(() => {
    if (!studentEmail || isSubscribedRef.current) {
      return;
    }

    const setupRealtimeSubscriptions = async () => {
      const studentId = await getStudentId();
      
      if (!studentId) {
        return;
      }


      // Create a unique channel for this student
      const channelName = `student-activities-${studentId}-${Date.now()}`;
      const channel = supabase.channel(channelName);

      // Tables to monitor for student-specific changes
      const tableSubscriptions = [
        {
          table: 'shortlist_candidates',
          filter: `student_id=eq.${studentId}`
        },
        {
          table: 'pipeline_activities', 
          filter: `student_id=eq.${studentId}`
        },
        {
          table: 'pipeline_candidates',
          // Note: We'd need to filter by student name or add student_id to this table
          filter: null // For now, listen to all changes
        },
        {
          table: 'offers',
          // Note: We'd need to filter by student name or add student_id to this table
          filter: null // For now, listen to all changes
        },
        {
          table: 'placements',
          filter: `studentId=eq.${studentId}`
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
          console.log('✅ Student subscribed to tables:', 
            tableSubscriptions.map(t => t.table).join(', '));
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Student real-time subscription error');
          isSubscribedRef.current = false;
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Student real-time subscription timed out');
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
  }, [studentEmail, getStudentId, handleRealtimeChange]);

  return {
    activities: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isConnected: isSubscribedRef.current, // Real-time connection status
    lastUpdateTime, // Timestamp of last update for UI feedback
  };
};

/**
 * Hook to manually trigger student activity refresh
 */
export const useRefreshStudentActivities = (studentEmail) => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ 
      queryKey: ['student-activities', studentEmail] 
    });
  };
};
