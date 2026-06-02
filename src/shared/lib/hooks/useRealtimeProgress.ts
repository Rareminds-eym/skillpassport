import { getSSEClient } from '@/shared/api/sseRealtimeClient';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [lastUpdate, setLastUpdate] = useState<{ type: string; event: string; data: any; timestamp: number } | null>(null);
  const channelRef = useRef(null);
  const enrollmentChannelRef = useRef(null);

  // Subscribe to progress changes
  useEffect(() => {
    if (!enabled || !learnerId || !courseId) return;

    const sseClient = getSSEClient();
    const unsubscribers: Array<() => void> = [];

    // Subscribe to learner_course_progress changes
    const unsubProgress = sseClient.subscribe(
      'learner_course_progress',
      { event: '*', filter: `learner_id=eq.${learnerId}` },
      (event) => {
        if (event.type === 'change') {
          setLastUpdate({
            type: 'progress',
            event: event.event,
            data: event.payload,
            timestamp: Date.now()
          });

          if (onProgressUpdate) {
            onProgressUpdate(event.payload);
          }
        }
      }
    );
    unsubscribers.push(unsubProgress);

    // Subscribe to enrollment changes
    const unsubEnrollment = sseClient.subscribe(
      'course_enrollments',
      { event: '*', filter: `learner_id=eq.${learnerId}` },
      (event) => {
        if (event.type === 'change') {
          setLastUpdate({
            type: 'enrollment',
            event: event.event,
            data: event.payload,
            timestamp: Date.now()
          });

          if (onEnrollmentUpdate) {
            onEnrollmentUpdate(event.payload);
          }
        }
      }
    );
    unsubscribers.push(unsubEnrollment);

    setIsConnected(true);

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
      setIsConnected(false);
    };
  }, [enabled, learnerId, courseId, onProgressUpdate, onEnrollmentUpdate]);

  // Broadcast progress to other devices (via backend endpoint)
  const broadcastProgress = useCallback(async (progressData: any) => {
    if (!isConnected) return;

    try {
      const channelName = `progress:${learnerId}:${courseId}`;
      await apiPost('/realtime-stream', {
        action: 'send-broadcast',
        channel: channelName,
        eventType: 'progress_update',
        payload: {
          ...progressData,
          learnerId,
          courseId,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      logger.error('Error broadcasting progress', error as Error);
    }
  }, [isConnected, learnerId, courseId]);

  // Get connection status
  const getStatus = useCallback(() => ({
    isConnected,
    lastUpdate
  }), [isConnected, lastUpdate]);

  return {
    isConnected,
    lastUpdate,
    broadcastProgress,
    getStatus
  };
};

export default useRealtimeProgress;
