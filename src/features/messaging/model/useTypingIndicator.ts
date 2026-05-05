import { useEffect, useState, useCallback, useRef } from 'react';
import { getLogger } from '@/shared/config/logging';
import RealtimeService, { TypingIndicator } from '@/shared/api/realtimeService';
import type { UserRole, ConversationType } from '../api/types';

const logger = getLogger('UseTypingIndicator');

interface UseTypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  userRole?: UserRole;
  conversationType?: ConversationType;
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
 * }
 * ```
 */
export const useTypingIndicator = ({
  conversationId,
  currentUserId,
  currentUserName,
  userRole,
  conversationType,
  enabled = true
}: UseTypingIndicatorProps) => {
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBroadcastRef = useRef<number>(0);

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
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [conversationId, currentUserId, enabled]);

  /**
   * Set typing status for the current user
   * Debounced to once per 2 seconds to reduce network traffic
   */
  const setTyping = useCallback(
    async (isTyping: boolean) => {
      try {
        // Debounce typing broadcasts to once per 2 seconds
        const now = Date.now();
        const timeSinceLastBroadcast = now - lastBroadcastRef.current;

        if (isTyping && timeSinceLastBroadcast < 2000) {
          // Too soon since last broadcast, debounce it
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }

          debounceTimeoutRef.current = setTimeout(() => {
            RealtimeService.sendTypingIndicator(
              conversationId,
              currentUserId,
              currentUserName,
              true
            );
            lastBroadcastRef.current = Date.now();
          }, 2000 - timeSinceLastBroadcast);

          return;
        }

        await RealtimeService.sendTypingIndicator(
          conversationId,
          currentUserId,
          currentUserName,
          isTyping
        );

        lastBroadcastRef.current = now;

        // Auto-clear typing indicator after 3 seconds
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
        logger.error('Failed to send typing indicator', error as Error);
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
