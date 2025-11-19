/**
 * Student Real-time Activities Hook
 * Combines real-time activities with recent_updates table data
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getStudentRecentActivity } from '../services/studentActivityService';

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

  // 1️⃣ Resolve student ID by email
  const fetchStudentIdByEmail = useCallback(async (email) => {
    if (!email) {
      console.warn('⚠️ No email provided to fetchStudentIdByEmail');
      return null;
    }
    
    try {
      setIsResolvingStudent(true);
      console.log('🔍 [useStudentRealtimeActivities] Resolving student ID for:', email);

      // Try multiple methods to find student
      let data = null;
      let error = null;

      // Method 1: Search by JSONB email field
      const result1 = await supabase
        .from("students")
        .select("id, profile, email")
        .eq("profile->>email", email)
        .maybeSingle();

      if (result1.data) {
        data = result1.data;
        console.log('✅ Found student using profile->>email:', data.id);
      } else {
        // Method 2: Search by direct email column
        const result2 = await supabase
          .from("students")
          .select("id, profile, email")
          .eq("email", email)
          .maybeSingle();

        if (result2.data) {
          data = result2.data;
          console.log('✅ Found student using direct email column:', data.id);
        } else {
          error = result1.error || result2.error;
        }
      }

      if (error) {
        console.error('❌ Error querying students table:', error);
        throw error;
      }

      if (!data) {
        console.warn('⚠️ [useStudentRealtimeActivities] No student found for email:', email);
        console.log('💡 Tip: Check if the email exists in the students table');
        setStudentId(null);
        return null;
      }

      console.log('✅ [useStudentRealtimeActivities] Found student:', {
        id: data.id,
        email: data.email || data.profile?.email,
      });
      setStudentId(data.id);
      return data.id;
    } catch (err) {
      console.error("❌ [useStudentRealtimeActivities] Error finding student by email:", err);
      setStudentId(null);
      return null;
    } finally {
      setIsResolvingStudent(false);
    }
  }, []);

  // 2️⃣ Fetch activities from recent_updates table by student_id
  const fetchRecentUpdatesFromDB = useCallback(async (resolvedStudentId) => {
    if (!resolvedStudentId) {
      console.warn('⚠️ No student ID provided to fetchRecentUpdatesFromDB');
      return [];
    }

    try {
      console.log('📊 [useStudentRealtimeActivities] Fetching recent_updates for student:', resolvedStudentId);

      const { data, error } = await supabase
        .from("recent_updates")
        .select("*")
        .eq("student_id", resolvedStudentId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching from recent_updates:', error);
        throw error;
      }

      if (!data) {
        console.log('ℹ️ [useStudentRealtimeActivities] No recent_updates found for student ID:', resolvedStudentId);
        console.log('💡 Tip: Check if there are rows in recent_updates table for this student_id');
        return [];
      }

      console.log('📦 Raw recent_updates data:', data);

      // Safely parse JSONB and clean data
      let updatesArray = [];
      try {
        const parsed =
          typeof data.updates === "string"
            ? JSON.parse(data.updates)
            : data.updates;

        console.log('📝 Parsed updates object:', parsed);
        updatesArray = (parsed?.updates || []).filter(Boolean);
        console.log(`✅ Found ${updatesArray.length} valid updates after filtering nulls`);
      } catch (parseErr) {
        console.error("❌ Error parsing updates JSON:", parseErr);
        console.log('Raw updates value:', data.updates);
        return [];
      }

      // Format timestamps and add proper structure
      const formattedUpdates = updatesArray.map((u, index) => {
        console.log(`🔧 Processing update ${index + 1}:`, u);
        
        const realTimestamp =
          u.created_at && u.created_at !== "Just now"
            ? u.created_at
            : new Date().toISOString();

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
          metadata: u.metadata || {}
        };

        console.log(`✅ Formatted update ${index + 1}:`, formatted);
        return formatted;
      });

      console.log(`✅ [useStudentRealtimeActivities] Fetched ${formattedUpdates.length} updates from recent_updates table`);
      return formattedUpdates;
    } catch (err) {
      console.error("❌ [useStudentRealtimeActivities] Error fetching recent_updates:", err);
      return [];
    }
  }, []);

  // 3️⃣ Resolve student ID when studentEmail changes
  useEffect(() => {
    console.log('🔄 Email changed, resolving student ID for:', studentEmail);
    if (studentEmail) {
      fetchStudentIdByEmail(studentEmail);
    } else {
      console.warn('⚠️ No studentEmail provided');
      setStudentId(null);
    }
  }, [studentEmail, fetchStudentIdByEmail]);

  // Fetch activities using React Query with optimized settings
  const query = useQuery({
    queryKey: ['student-activities', studentEmail, studentId, limit],
    queryFn: async () => {
      console.log('🚀 Query function triggered with:', { studentEmail, studentId, limit, isResolvingStudent });

      if (!studentEmail) {
        console.warn('⚠️ No studentEmail, returning empty array');
        return [];
      }

      // Wait for student ID resolution
      if (isResolvingStudent) {
        console.log('⏳ Waiting for student ID resolution...');
        return [];
      }

      if (!studentId) {
        console.warn('⚠️ No student ID available, cannot fetch activities');
        return [];
      }

      console.log('🔄 [useStudentRealtimeActivities] Fetching activities for student:', studentId);

      // Fetch from both sources in parallel
      const [realtimeResult, recentUpdatesResult] = await Promise.all([
        getStudentRecentActivity(studentEmail, limit).catch(err => {
          console.error('❌ Error fetching realtime activities:', err);
          return { data: [], error: err.message };
        }),
        fetchRecentUpdatesFromDB(studentId)
      ]);

      const realtimeActivities = realtimeResult.data || [];
      const recentUpdatesActivities = recentUpdatesResult || [];
      
      console.log(`📦 Data sources:`, {
        recentUpdates: recentUpdatesActivities.length,
        realtime: realtimeActivities.length
      });
      
      console.log('📋 Recent updates activities:', recentUpdatesActivities);
      console.log('📋 Realtime activities:', realtimeActivities);
      
      // Combine all sources and sort by timestamp
      const combined = [...recentUpdatesActivities, ...realtimeActivities]
        // Remove duplicates based on ID
        .filter((activity, index, self) => {
          const isDuplicate = index !== self.findIndex(a => a.id === activity.id);
          if (isDuplicate) {
            console.log('🔄 Removing duplicate activity:', activity.id);
          }
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
      
      console.log(`✅ [useStudentRealtimeActivities] Returning ${combined.length} combined activities`);
      console.log('📋 Final combined activities:', combined);
      return combined;
    },
    enabled: !!studentEmail && !isResolvingStudent, // Only run if email is provided and not resolving
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider fresh data (real-time requirement)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: false, // Disable polling, rely on WebSocket events
    refetchIntervalInBackground: false,
    retry: 2, // Retry failed requests twice
    retryDelay: 1000, // Wait 1s between retries
  });

  // 4️⃣ Auto-refresh formatted timestamps every 60s
  useEffect(() => {
    if (!query.data || query.data.length === 0) return;
    
    console.log('⏰ Setting up timestamp refresh interval');
    const interval = setInterval(() => {
      console.log('🔄 Refreshing timestamps...');
      queryClient.setQueryData(
        ['student-activities', studentEmail, studentId, limit],
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
      console.log('🛑 Clearing timestamp refresh interval');
      clearInterval(interval);
    };
  }, [query.data, queryClient, studentEmail, studentId, limit]);

  // Debounced refetch to avoid too many requests
  const debouncedRefetch = useCallback(() => {
    console.log('⏱️ Debounced refetch triggered');
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer for 500ms debounce
    debounceTimerRef.current = setTimeout(() => {
      console.log('🔄 Executing debounced refetch');
      setLastUpdateTime(Date.now());
      queryClient.invalidateQueries({ 
        queryKey: ['student-activities', studentEmail],
        refetchType: 'active' 
      });
    }, 500);
  }, [queryClient, studentEmail]);

  // Callback to handle real-time changes
  const handleRealtimeChange = useCallback((table, payload) => {
    console.log(`🔔 [useStudentRealtimeActivities] Real-time event on ${table}:`, payload.eventType, payload);
    
    // Show toast notification for new activities
    if (payload.eventType === 'INSERT') {
      console.log('➕ New activity inserted:', payload.new);
    } else if (payload.eventType === 'UPDATE') {
      console.log('✏️ Activity updated:', payload.new);
    } else if (payload.eventType === 'DELETE') {
      console.log('🗑️ Activity deleted:', payload.old);
    }
    
    // Use debounced refetch instead of immediate
    debouncedRefetch();
  }, [debouncedRefetch]);

  // Set up real-time subscriptions for student-relevant tables
  useEffect(() => {
    if (!studentEmail || !studentId || isSubscribedRef.current) {
      console.log('⏸️ Skipping subscription setup:', { 
        hasEmail: !!studentEmail, 
        hasStudentId: !!studentId, 
        alreadySubscribed: isSubscribedRef.current 
      });
      return;
    }

    const setupRealtimeSubscriptions = async () => {
      console.log('🔌 [useStudentRealtimeActivities] Setting up real-time subscriptions for student:', studentId);

      // Create a unique channel for this student
      const channelName = `student-activities-${studentId}-${Date.now()}`;
      const channel = supabase.channel(channelName);

      // Tables to monitor for student-specific changes
      const tableSubscriptions = [
        {
          table: 'recent_updates',
          filter: `student_id=eq.${studentId}` // Listen for updates to this student's recent_updates
        },
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
          filter: null // Listen to all changes
        },
        {
          table: 'offers',
          filter: null // Listen to all changes
        },
        {
          table: 'placements',
          filter: `studentId=eq.${studentId}`
        }
      ];

      console.log('📋 Subscribing to tables:', tableSubscriptions);

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

        console.log(`📡 Setting up subscription for ${table} with config:`, subscriptionConfig);

        channel.on(
          'postgres_changes',
          subscriptionConfig,
          (payload) => handleRealtimeChange(table, payload)
        );
      });

      // Subscribe to the channel
      channel.subscribe((status) => {
        console.log('📡 Subscription status:', status);
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
          console.log('🔌 Student real-time subscription closed');
          isSubscribedRef.current = false;
        }
      });

      channelRef.current = channel;
    };

    setupRealtimeSubscriptions();

    // Cleanup on unmount or email change
    return () => {
      console.log('🔌 [useStudentRealtimeActivities] Cleaning up real-time subscriptions');
      
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

  console.log('📊 Hook state:', {
    activitiesCount: query.data?.length || 0,
    isLoading: query.isLoading || isResolvingStudent,
    isError: query.isError,
    error: query.error,
    studentId,
    isConnected: isSubscribedRef.current
  });

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
    console.log('🔄 Manual refresh triggered for:', studentEmail);
    queryClient.invalidateQueries({ 
      queryKey: ['student-activities', studentEmail] 
    });
  };
};