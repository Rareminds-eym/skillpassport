import { useEffect, useCallback } from 'react';
import RealtimeService, { BroadcastMessage } from '../services/realtimeService';

interface UseBroadcastProps {
  channelName: string;
  onReceive: (message: BroadcastMessage) => void;
  enabled?: boolean;
}

/**
 * Hook for sending and receiving broadcast messages
 * 
 * @example
 * ```tsx
 * const { sendBroadcast } = useBroadcast({
 *   channelName: 'app-notifications',
 *   onReceive: (message) => {
 *   }
 * });
 * 
 * // Send a broadcast
 * await sendBroadcast({
 *   type: 'notification',
 *   payload: { title: 'Hello', message: 'World' },
 *   from: 'user-123',
 *   timestamp: new Date().toISOString()
 * });
 * ```
 */
export const useBroadcast = ({
  channelName,
  onReceive,
  enabled = true
}: UseBroadcastProps) => {
  useEffect(() => {
    if (!enabled || !channelName) return;


    const channel = RealtimeService.createBroadcastChannel(
      channelName,
      onReceive
    );

    return () => {
      RealtimeService.unsubscribe(channelName);
    };
  }, [channelName, onReceive, enabled]);

  /**
   * Send a broadcast message to the channel
   */
  const sendBroadcast = useCallback(
    async (message: BroadcastMessage) => {
      try {
        const result = await RealtimeService.sendBroadcast(channelName, message);
        return result;
      } catch (error) {
        console.error('❌ Error sending broadcast:', error);
        throw error;
      }
    },
    [channelName]
  );

  return {
    sendBroadcast
  };
};

export default useBroadcast;
