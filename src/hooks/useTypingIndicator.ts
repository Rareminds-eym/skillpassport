import { useEffect, useState, useCallback, useRef } from 'react';
import RealtimeService, { TypingIndicator } from '../services/realtimeService';

interface UseTypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  enabled?: boolean;
}

/**
 * Hook for managing typing indicators in a conversation
 * 
 * @example
 * ```tsx
 * const { typingUsers, setTyping } = useTypingIndicator({
 *   conversationId: 'conv-123',
 *   currentUserId: 'user-123',
 *   currentUserName: 'John Doe'
 * });
 * 
 * // Show typing indicator
 * setTyping(true);
 * 
 * // Hide typing indicator
 * setTyping(false);
 * 
 * // Check if someone is typing
 * if (typingUsers.length > 0) {
 *   console.log(`${typingUsers[0].userName} is typing...`);
 * }
 * ```
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

    console.log('⌨️ Setting up typing indicators for:', conversationId);

    const channel = RealtimeService.subscribeToTypingIndicators(
      conversationId,
      (indicator) => {
        console.log('⌨️ Typing indicator received:', indicator);

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
      console.log('🔕 Cleaning up typing indicators for:', conversationId);
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
