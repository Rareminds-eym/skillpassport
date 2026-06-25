import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { MessageQueryService } from '@/shared/api/messageQueryService';
import { queryKeys } from '@/shared/lib/queryKeys';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-conversation-messages');

export type MessageType = 'learner_admin' | 'learner_educator' | 'learner_college_educator' | 'learner_recruiter';

interface UseConversationMessagesParams {
  conversationId?: string;
  messageType: MessageType;
  learnerId: string;
  enabled?: boolean;
  enableRealtime?: boolean;
}

interface UseConversationMessagesReturn {
  messages: any[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (text: string) => Promise<void>;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
}

/**
 * Consolidated entity-level hook for all learner conversation message types
 * Replaces: useLearnerAdminMessages, useLearnerEducatorMessages, useLearnerCollegeAdminMessages, useLearnerMessages
 *
 * @param params Configuration for the conversation messages
 * @returns Messages, loading states, and send function
 *
 * @example
 * ```typescript
 * // Replace useLearnerAdminMessages
 * const { messages, sendMessage } = useConversationMessages({
 *   conversationId: 'conv-123',
 *   messageType: 'learner_admin',
 *   learnerId: 'learner-456'
 * });
 *
 * // Replace useLearnerEducatorMessages
 * const { messages, sendMessage } = useConversationMessages({
 *   conversationId: 'conv-789',
 *   messageType: 'learner_educator',
 *   learnerId: 'learner-456'
 * });
 * ```
 */
export function useConversationMessages({
  conversationId,
  messageType,
  learnerId,
  enabled = true,
  enableRealtime = true
}: UseConversationMessagesParams): UseConversationMessagesReturn {
  const queryClient = useQueryClient();

  // Fetch messages for the conversation
  const {
    data: messages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.learner.messages.conversation(conversationId || 'none'),
    queryFn: async () => {
      if (!conversationId) return [];
      try {
        return await MessageQueryService.getConversationMessages(conversationId, { useCache: true });
      } catch (err) {
        logger.error(`Error fetching ${messageType} messages`, err);
        throw err;
      }
    },
    enabled: !!conversationId && enabled && !!learnerId,
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes (formerly cacheTime)
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Subscribe to real-time message updates if needed
  useEffect(() => {
    if (!conversationId || !enableRealtime) return;

    const subscription = MessageQueryService.subscribeToConversationMessages?.(
      conversationId,
      (newMessage) => {
        // Update message cache optimistically
        queryClient.setQueryData(queryKeys.learner.messages.conversation(conversationId), (oldMessages: any[] | undefined) => {
          if (!oldMessages) return [newMessage];

          // Prevent duplicates
          const exists = oldMessages.some(msg => msg.id === newMessage.id);
          if (exists) return oldMessages;

          return [...oldMessages, newMessage];
        });

        // Invalidate conversation list to update last message preview
        queryClient.invalidateQueries({
          queryKey: queryKeys.learner.conversations.byLearner(learnerId, messageType),
        });
      }
    );

    return () => {
      subscription?.();
    };
  }, [conversationId, learnerId, messageType, enableRealtime, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!conversationId) {
        throw new Error('Conversation ID is required to send messages');
      }
      if (!messageText?.trim()) {
        throw new Error('Message cannot be empty');
      }

      // Sending is done at feature layer - this is entity abstraction
      // The actual send is handled by features/messaging hooks
      logger.warn('useConversationMessages.sendMessage should not be called directly. Use feature-layer hooks instead.');
    },
    onError: (error) => {
      logger.error(`Error sending ${messageType} message`, error);
    }
  });

  return {
    messages,
    isLoading,
    error: error as Error | null,
    sendMessage: (text: string) => sendMessageMutation.mutateAsync(text),
    isLoadingMessages: isLoading,
    isSendingMessage: sendMessageMutation.isPending
  };
}

/**
 * @deprecated Use useConversationMessages instead
 * @see useConversationMessages
 */
export const useLearnerAdminMessages = ({
  learnerId,
  conversationId,
  enabled = true,
  enableRealtime = true
}: {
  learnerId: string;
  conversationId?: string;
  enabled?: boolean;
  enableRealtime?: boolean;
}) => {
  return useConversationMessages({
    conversationId,
    messageType: 'learner_admin',
    learnerId,
    enabled,
    enableRealtime
  });
};

/**
 * @deprecated Use useConversationMessages instead
 * @see useConversationMessages
 */
export const useLearnerEducatorMessages = ({
  learnerId,
  conversationId,
  enabled = true,
  enableRealtime = true
}: {
  learnerId: string;
  conversationId?: string;
  enabled?: boolean;
  enableRealtime?: boolean;
}) => {
  return useConversationMessages({
    conversationId,
    messageType: 'learner_educator',
    learnerId,
    enabled,
    enableRealtime
  });
};

/**
 * @deprecated Use useConversationMessages instead
 * @see useConversationMessages
 */
export const useLearnerCollegeAdminMessages = ({
  learnerId,
  conversationId,
  enabled = true,
  enableRealtime = true
}: {
  learnerId: string;
  conversationId?: string;
  enabled?: boolean;
  enableRealtime?: boolean;
}) => {
  return useConversationMessages({
    conversationId,
    messageType: 'learner_college_educator',
    learnerId,
    enabled,
    enableRealtime
  });
};
