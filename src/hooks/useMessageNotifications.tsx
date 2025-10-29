import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { MessageSquare, X } from 'lucide-react';
import { Message } from '../services/messageService';

interface UseMessageNotificationsProps {
  userId: string | null;
  userType: 'student' | 'recruiter';
  enabled?: boolean;
  onMessageReceived?: (message: Message) => void;
}

export const useMessageNotifications = ({
  userId,
  userType,
  enabled = true,
  onMessageReceived
}: UseMessageNotificationsProps) => {
  useEffect(() => {
    if (!userId || !enabled) return;

    console.log('🔔 Setting up message notifications for:', userId, userType);

    const channel = supabase
      .channel(`user-messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          const message = payload.new as Message;
          
          console.log('📨 New message received:', message);

          // Don't show notification if current user sent the message
          if (message.sender_id === userId) {
            return;
          }

          // Call custom handler if provided
          if (onMessageReceived) {
            onMessageReceived(message);
          }

          // Show toast notification
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

          // Play notification sound (optional)
          try {
            const audio = new Audio('/notificacion.mp3');
            audio.volume = 0.3;
            audio.play().catch((e) => console.log('Could not play sound:', e));
          } catch (e) {
            // Silent fail if audio not available
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔕 Unsubscribing from message notifications');
      channel.unsubscribe();
    };
  }, [userId, userType, enabled, onMessageReceived]);
};

export default useMessageNotifications;
