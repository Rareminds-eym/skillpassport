import { useEffect, useState, useCallback, useRef } from 'react';
import RealtimeService, { TypingIndicator } from '@/shared/api/realtimeService';

interface UseTypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  enabled?: boolean;
}

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please use `useTypingIndicator` from @/features/messaging/model instead.
 * 
 * @see {@link useTypingIndicator} from @/features/messaging
 */
export const useTypingIndicator = ({
  conversationId,
  currentUserId,
  currentUserName,
  enabled = true
}: UseTypingIndicatorProps) => {
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !conversationId) return;


    const channel = RealtimeService.subscribeToTypingIndicators(
      conversationId,
      (indicator) => {

        // Ignore own typing indicators
        if (indicator.userId === currentUserId) {
          return;
        }

        setTypingUsers((prev) => {
          // Remove existing indicator for this user
          const filtered = prev.filter(u => u.userId !== indicator.userId);

          // Add new indicator if typing
          if (indicator.isTyping) {
            return [...filtered, indicator];
          }

          return filtered;
        });

        // Auto-remove typing indicator after 3 seconds
        if (indicator.isTyping) {
          setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter(u => u.userId !== indicator.userId)
            );
          }, 3000);
        }
      }
    );

    return () => {
      RealtimeService.unsubscribe(`conversation:${conversationId}`);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserId, enabled]);

  /**
   * Set typing status for the current user
   */
  const setTyping = useCallback(
    async (isTyping: boolean) => {
      try {
        await RealtimeService.sendTypingIndicator(
          conversationId,
          currentUserId,
          currentUserName,
          isTyping
        );

        // Auto-hide typing indicator after 3 seconds
        if (isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          typingTimeoutRef.current = setTimeout(() => {
            RealtimeService.sendTypingIndicator(
              conversationId,
              currentUserId,
              currentUserName,
              false
            );
          }, 3000);
        }
      } catch (error) {
        console.error('❌ Error sending typing indicator:', error);
      }
    },
    [conversationId, currentUserId, currentUserName]
  );

  /**
   * Get formatted typing text
   */
  const getTypingText = useCallback((): string => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0].userName} is typing...`;
    if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`;
    }
    return `${typingUsers.length} people are typing...`;
  }, [typingUsers]);

  return {
    typingUsers,
    setTyping,
    isAnyoneTyping: typingUsers.length > 0,
    getTypingText
  };
};

export default useTypingIndicator;
