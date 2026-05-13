import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('realtime-progress');

/**
 * Hook for real-time progress synchronization across devices
 * Uses Supabase Realtime for instant updates
 */
export const useRealtimeProgress = (learnerId, courseId, options = {}) => {
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
    if (!enabled || !learnerId || !courseId) return;

    // Subscribe to learner_course_progress changes
    const progressChannel = supabase
      .channel(`progress:${learnerId}:${courseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'learner_course_progress',
          filter: `learner_id=eq.${learnerId}`
        },
        (payload) => {
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
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = progressChannel;

    // Subscribe to enrollment changes
    const enrollmentChannel = supabase
      .channel(`enrollment:${learnerId}:${courseId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'course_enrollments',
          filter: `learner_id=eq.${learnerId}`
        },
        (payload) => {
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
  }, [enabled, learnerId, courseId, onProgressUpdate, onEnrollmentUpdate]);

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
      logger.error('Error broadcasting progress', error as Error);
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
