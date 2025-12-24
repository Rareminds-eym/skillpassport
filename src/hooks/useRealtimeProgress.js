import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook for real-time progress synchronization across devices
 * Uses Supabase Realtime for instant updates
 */
export const useRealtimeProgress = (studentId, courseId, options = {}) => {
  const {
    enabled = true,
    onProgressUpdate = null,
    onEnrollmentUpdate = null
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const channelRef = useRef(null);
  const enrollmentChannelRef = useRef(null);

  // Subscribe to progress changes
  useEffect(() => {
    if (!enabled || !studentId || !courseId) return;

    // Subscribe to student_course_progress changes
    const progressChannel = supabase
      .channel(`progress:${studentId}:${courseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_course_progress',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          console.log('📡 Real-time progress update:', payload);
          setLastUpdate({
            type: 'progress',
            event: payload.eventType,
            data: payload.new,
            timestamp: Date.now()
          });

          if (onProgressUpdate) {
            onProgressUpdate(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('Progress channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = progressChannel;

    // Subscribe to enrollment changes
    const enrollmentChannel = supabase
      .channel(`enrollment:${studentId}:${courseId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'course_enrollments',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          console.log('📡 Real-time enrollment update:', payload);
          setLastUpdate({
            type: 'enrollment',
            event: payload.eventType,
            data: payload.new,
            timestamp: Date.now()
          });

          if (onEnrollmentUpdate) {
            onEnrollmentUpdate(payload);
          }
        }
      )
      .subscribe();

    enrollmentChannelRef.current = enrollmentChannel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (enrollmentChannelRef.current) {
        supabase.removeChannel(enrollmentChannelRef.current);
      }
    };
  }, [enabled, studentId, courseId, onProgressUpdate, onEnrollmentUpdate]);

  // Broadcast progress to other devices
  const broadcastProgress = useCallback(async (progressData) => {
    if (!channelRef.current || !isConnected) return;

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'progress_update',
        payload: {
          ...progressData,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Error broadcasting progress:', error);
    }
  }, [isConnected]);

  // Get connection status
  const getStatus = useCallback(() => ({
    isConnected,
    lastUpdate,
    channelState: channelRef.current?.state || 'disconnected'
  }), [isConnected, lastUpdate]);

  return {
    isConnected,
    lastUpdate,
    broadcastProgress,
    getStatus
  };
};

export default useRealtimeProgress;
