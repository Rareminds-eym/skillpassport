import React, { useEffect, useRef } from 'react';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';
import toast from 'react-hot-toast';
import { MessageSquare, X, User, Briefcase } from 'lucide-react';
import { getLogger } from '@/shared/config/logging';

import type { Message } from '@/shared/api/messageService';
import { useMessageStore } from '@/shared/model/useMessageStore';

const logger = getLogger('learner-message-notifications');

interface UselearnerMessageNotificationsProps {
  learnerId: string | null;
  enabled?: boolean;
  playSound?: boolean;
  onMessageReceived?: (message: Message) => void;
  excludeConversationId?: string | null;
}

export const useLearnerMessageNotifications = ({
  learnerId,
  enabled = true,
  playSound = true,
  onMessageReceived,
  excludeConversationId = null
}: UselearnerMessageNotificationsProps) => {
  const { incrementUnreadCount, addMessage } = useMessageStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = React.useState(false);

  useEffect(() => {
    if (!playSound || typeof window === 'undefined') return;

    audioRef.current = new Audio('/notificacion.mp3');
    audioRef.current.volume = 0.3;

    const enableAudio = () => {
      if (audioRef.current && !audioEnabled) {
        audioRef.current.play()
          .then(() => {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
            setAudioEnabled(true);
          })
          .catch((error) => {
            logger.warn('Unable to play notification sound', { error: error instanceof Error ? error.message : String(error) });
          });
      }
    };

    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });

    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, [playSound]);

  useEffect(() => {
    if (!learnerId || !enabled) return;

    const sseClient = getSSEClient();
    const unsub = sseClient.subscribe('messages', {
      event: 'INSERT',
      filter: `receiver_id=eq.${learnerId}`
    }, (event) => {
      if (event.type !== 'change') return;
      const message = event.payload as Message;

      if (message.sender_id === learnerId) return;

      if (excludeConversationId && message.conversation_id === excludeConversationId) {
        addMessage(message);
        return;
      }

      incrementUnreadCount();
      addMessage(message);

      if (onMessageReceived) {
        onMessageReceived(message);
      }

      showMessageToast(message, playSound ? audioRef.current : null);
    });

    return () => {
      unsub();
    };
  }, [learnerId, enabled, onMessageReceived, excludeConversationId, playSound, incrementUnreadCount, addMessage]);
};

const showMessageToast = (message: Message, audio: HTMLAudioElement | null) => {
  const senderType = message.sender_type === 'recruiter' ? 'Recruiter' : 'Learner';
  const senderIcon = message.sender_type === 'recruiter' ? Briefcase : User;

  toast.custom(
    (t) => (
      <div
        className={`${t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 transform transition-all duration-300 hover:scale-105`}
        style={{
          animation: t.visible
            ? 'slideInRight 0.3s ease-out'
            : 'slideOutRight 0.3s ease-in',
          zIndex: 9999
        }}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2">
                {React.createElement(senderIcon, {
                  className: "w-4 h-4 text-gray-500"
                })}
                <p className="text-sm font-semibold text-gray-900">
                  New Message from {senderType}
                </p>
              </div>

              <p className="mt-1 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {message.message_text}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Just now
              </p>
            </div>
          </div>
        </div>

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
      id: `message-${message.id}`,
    }
  );

  if (audio) {
    audio.currentTime = 0;
    audio.play().catch((error) => {
      logger.warn('Unable to play notification sound', { error: error instanceof Error ? error.message : String(error) });
    });
  }
};

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

export default useLearnerMessageNotifications;
