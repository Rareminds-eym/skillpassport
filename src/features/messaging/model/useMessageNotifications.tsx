import { useEffect } from 'react';
import { getWSClient } from '@/shared/api/wsRealtimeClient';
import toast from 'react-hot-toast';
import { MessageSquare, X } from 'lucide-react';
import type { Message, UserRole } from '../api/types';

interface UseMessageNotificationsProps {
  userId: string | null;
  userRole: UserRole;
  enabled?: boolean;
  onMessageReceived?: (message: Message) => void;
}

export const useMessageNotifications = ({
  userId,
  userRole,
  enabled = true,
  onMessageReceived
}: UseMessageNotificationsProps) => {
  useEffect(() => {
    if (!userId || !enabled) return;

    let unsubscribe: (() => void) | null = null;

    const wsClient = getWSClient();
    unsubscribe = wsClient.subscribe('messages', {
      event: 'INSERT',
      filter: `receiver_id=eq.${userId}`,
    }, (event) => {
      if (event.type !== 'change') return;
      const message = event.payload as Message;

      if (message.sender_id === userId) return;

      if (onMessageReceived) {
        onMessageReceived(message);
      }

      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    New Message
                  </p>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {message.message_text}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ),
        {
          duration: 5000,
          position: 'top-right'
        }
      );

      try {
        const audio = new Audio('/notificacion.mp3');
        audio.volume = 0.3;
      } catch (e) {
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, userRole, enabled, onMessageReceived]);
};

export default useMessageNotifications;
