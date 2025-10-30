import { useEffect, useCallback } from 'react';
import RealtimeService from '../services/realtimeService';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';

interface UseNotificationBroadcastProps {
  userId: string;
  enabled?: boolean;
  showToast?: boolean;
  onNotification?: (notification: any) => void;
}

/**
 * Hook for receiving real-time notification broadcasts
 * 
 * @example
 * ```tsx
 * const { sendNotification } = useNotificationBroadcast({
 *   userId: 'user-123',
 *   showToast: true,
 *   onNotification: (notification) => {
 *     console.log('Received notification:', notification);
 *   }
 * });
 * 
 * // Send a notification to another user
 * await sendNotification('user-456', {
 *   title: 'New Message',
 *   message: 'You have a new message',
 *   type: 'message',
 *   link: '/messages'
 * });
 * ```
 */
export const useNotificationBroadcast = ({
  userId,
  enabled = true,
  showToast = true,
  onNotification
}: UseNotificationBroadcastProps) => {
  useEffect(() => {
    if (!enabled || !userId) return;

    console.log('🔔 Setting up notification broadcasts for:', userId);

    const channel = RealtimeService.subscribeToNotificationBroadcasts(
      userId,
      (notification) => {
        console.log('📨 Notification broadcast received:', notification);

        // Call custom handler
        if (onNotification) {
          onNotification(notification);
        }

        // Show toast notification
        if (showToast) {
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.link && (
                        <a
                          href={notification.link}
                          className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                          onClick={() => toast.dismiss(t.id)}
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ),
            {
              duration: 5000,
              position: 'top-right'
            }
          );

          // Play notification sound
          try {
            const audio = new Audio('/notificacion.mp3');
            audio.volume = 0.3;
            audio.play().catch((e) => console.log('Could not play sound:', e));
          } catch (e) {
            // Silent fail
          }
        }
      }
    );

    return () => {
      console.log('🔕 Cleaning up notification broadcasts for:', userId);
      RealtimeService.unsubscribe(`user-notifications:${userId}`);
    };
  }, [userId, enabled, showToast, onNotification]);

  /**
   * Send a notification broadcast to another user
   */
  const sendNotification = useCallback(
    async (
      targetUserId: string,
      notification: {
        title: string;
        message: string;
        type: string;
        link?: string;
      }
    ) => {
      try {
        const result = await RealtimeService.sendNotificationBroadcast(
          targetUserId,
          notification
        );
        console.log('✅ Notification sent:', result);
        return result;
      } catch (error) {
        console.error('❌ Error sending notification:', error);
        throw error;
      }
    },
    []
  );

  return {
    sendNotification
  };
};

export default useNotificationBroadcast;
