import { useEffect, useState, useCallback } from 'react';
import RealtimeService, { UserPresence, OnlineUser } from '@/shared/api/realtimeService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('realtime-presence');

interface UseRealtimePresenceProps {
  channelName: string;
  userPresence: UserPresence;
  enabled?: boolean;
}

/**
 * Hook for tracking online/offline users using Supabase Presence
 * 
 * @example
 * ```tsx
 * const { onlineUsers, isUserOnline, updateStatus } = useRealtimePresence({
 *   channelName: 'conversation:123',
 *   userPresence: {
 *     userId: 'user-123',
 *     userName: 'John Doe',
 *     userType: 'student',
 *     status: 'online',
 *     lastSeen: new Date().toISOString()
 *   }
 * });
 * ```
 */
export const useRealtimePresence = ({
  channelName,
  userPresence,
  enabled = true
}: UseRealtimePresenceProps) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !channelName || !userPresence.userId) return;


    let channel: any;

    const setupPresence = async () => {
      try {
        channel = await RealtimeService.joinPresenceChannel(
          channelName,
          userPresence,
          // On user join
          (user) => {
            setOnlineUsers((prev) => {
              // Avoid duplicates
              if (prev.some(u => u.userId === user.userId)) {
                return prev;
              }
              return [...prev, user];
            });
          },
          // On user leave
          (user) => {
            setOnlineUsers((prev) => prev.filter(u => u.userId !== user.userId));
          },
          // On sync
          (users) => {
            setOnlineUsers(users);
            setIsConnected(true);
          }
        );
      } catch (error) {
        logger.error('Error setting up presence', error as Error);
        setIsConnected(false);
      }
    };

    setupPresence();

    // Cleanup
    return () => {
      RealtimeService.unsubscribe(channelName);
      setIsConnected(false);
    };
  }, [channelName, userPresence.userId, enabled]);

  /**
   * Update the current user's status (online, away, busy)
   */
  const updateStatus = useCallback(
    async (status: 'online' | 'away' | 'busy') => {
      try {
        await RealtimeService.updatePresenceStatus(
          channelName,
          userPresence.userId,
          status
        );
      } catch (error) {
        logger.error('Error updating status', error as Error);
      }
    },
    [channelName, userPresence.userId]
  );

  /**
   * Check if a specific user is online
   */
  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return onlineUsers.some(user => user.userId === userId && user.status === 'online');
    },
    [onlineUsers]
  );

  /**
   * Get a specific user's status
   */
  const getUserStatus = useCallback(
    (userId: string): 'online' | 'away' | 'busy' | 'offline' => {
      const user = onlineUsers.find(u => u.userId === userId);
      return user?.status || 'offline';
    },
    [onlineUsers]
  );

  return {
    onlineUsers,
    isConnected,
    updateStatus,
    isUserOnline,
    getUserStatus,
    onlineCount: onlineUsers.length
  };
};

export default useRealtimePresence;
