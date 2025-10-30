import { useEffect, useState, useCallback } from 'react';
import RealtimeService, { UserPresence, OnlineUser } from '../services/realtimeService';

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

    console.log('👋 Setting up presence for:', channelName);

    let channel: any;

    const setupPresence = async () => {
      try {
        channel = await RealtimeService.joinPresenceChannel(
          channelName,
          userPresence,
          // On user join
          (user) => {
            console.log('👤 User joined:', user);
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
            console.log('👤 User left:', user);
            setOnlineUsers((prev) => prev.filter(u => u.userId !== user.userId));
          },
          // On sync
          (users) => {
            console.log('🔄 Presence synced:', users);
            setOnlineUsers(users);
            setIsConnected(true);
          }
        );
      } catch (error) {
        console.error('❌ Error setting up presence:', error);
        setIsConnected(false);
      }
    };

    setupPresence();

    // Cleanup
    return () => {
      console.log('🔕 Cleaning up presence for:', channelName);
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
        console.log('✅ Status updated to:', status);
      } catch (error) {
        console.error('❌ Error updating status:', error);
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
