import React, { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { MessageSquare, X, User, Briefcase } from 'lucide-react';
import { Message } from '../services/messageService';
import { useMessageStore } from '../stores/useMessageStore';

interface UseStudentMessageNotificationsProps {
  studentId: string | null;
  enabled?: boolean;
  playSound?: boolean;
  onMessageReceived?: (message: Message) => void;
  excludeConversationId?: string | null; // Don't show toast for this conversation (e.g., currently open)
}

/**
 * Enhanced hot-toast notifications for student messages
 * - Shows toast for new messages with smooth animations
 * - Integrates with zustand store
 * - Handles realtime updates without blocking
 * - Supports sound notifications
 * - Auto-increments unread count
 */
export const useStudentMessageNotifications = ({
  studentId,
  enabled = true,
  playSound = true,
  onMessageReceived,
  excludeConversationId = null,
}: UseStudentMessageNotificationsProps) => {
  const { incrementUnreadCount, addMessage } = useMessageStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = React.useState(false);

  // Initialize audio and enable it after first user interaction
  useEffect(() => {
    if (!playSound || typeof window === 'undefined') return;

    // Create audio element
    audioRef.current = new Audio('/notificacion.mp3');
    audioRef.current.volume = 0.3;

    // Enable audio after first user interaction
    const enableAudio = () => {
      if (audioRef.current) {
        // Play and immediately pause to prime the audio
        audioRef.current
          .play()
          .then(() => {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
            setAudioEnabled(true);
          })
          .catch(() => {
            // Silent fail - audio will remain disabled
          });
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };

    // Listen for first user interaction
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });

    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, [playSound]);

  useEffect(() => {
    if (!studentId || !enabled) return;

    const channel = supabase
      .channel(`student-message-notifications:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${studentId}`,
        },
        (payload) => {
          const message = payload.new as Message;

          // Don't show notification if current student sent the message
          if (message.sender_id === studentId) return;

          // Don't show toast if this is the currently open conversation
          if (excludeConversationId && message.conversation_id === excludeConversationId) {
            // Still add to store and increment unread
            addMessage(message);
            return;
          }

          // Increment unread count in store
          incrementUnreadCount();

          // Add message to store
          addMessage(message);

          // Call custom handler if provided
          if (onMessageReceived) {
            onMessageReceived(message);
          }

          // Show toast notification with smooth animation
          showMessageToast(message, playSound ? audioRef.current : null);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [
    studentId,
    enabled,
    onMessageReceived,
    excludeConversationId,
    playSound,
    incrementUnreadCount,
    addMessage,
  ]);
};

/**
 * Show toast notification for a new message
 */
const showMessageToast = (message: Message, audio: HTMLAudioElement | null) => {
  const senderType = message.sender_type === 'recruiter' ? 'Recruiter' : 'Student';
  const senderIcon = message.sender_type === 'recruiter' ? Briefcase : User;

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 transform transition-all duration-300 hover:scale-105`}
        style={{
          animation: t.visible ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-in',
          zIndex: 9999,
        }}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            {/* Icon */}
            <div className="flex-shrink-0 pt-0.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2">
                {React.createElement(senderIcon, {
                  className: 'w-4 h-4 text-gray-500',
                })}
                <p className="text-sm font-semibold text-gray-900">New Message from {senderType}</p>
              </div>

              <p className="mt-1 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {message.message_text}
              </p>

              {/* Timestamp */}
              <p className="mt-1 text-xs text-gray-400">Just now</p>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="flex border-l border-gray-100">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl px-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: 'top-right',
      id: `message-${message.id}`, // Prevent duplicate toasts
    }
  );

  // Play notification sound
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Silently handle autoplay restrictions
    });
  }
};

// Add these animations to your global CSS or Tailwind config
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .animate-enter {
    animation: slideInRight 0.3s ease-out;
  }
  
  .animate-leave {
    animation: slideOutRight 0.3s ease-in;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('message-toast-styles')) {
  style.id = 'message-toast-styles';
  document.head.appendChild(style);
}

export default useStudentMessageNotifications;
