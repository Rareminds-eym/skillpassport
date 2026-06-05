import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/features/messaging';
import { queryKeys } from '@/shared/lib/queryKeys';

/**
 * Hook for managing educator-admin messages
 * Similar to useEducatorMessages but for educator-admin conversations
 * 
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please migrate to the new unified messaging hooks:
 * 
 * **Migration Guide:**
 * ```typescript
 * // Before:
 * import { useEducatorAdminMessages } from '@/features/educator';
 * const { messages, isLoading, sendMessage } = useEducatorAdminMessages({ conversationId, enabled });
 * 
 * // After:
 * import { useEducatorMessages } from '@/features/messaging';
 * const { messages, isLoadingMessages, sendMessage } = useEducatorMessages(
 *   educatorId,
 *   { conversationId, conversationType: 'educator_admin', enabled }
 * );
 * ```
 * 
 * @see {@link useEducatorMessages} from @/features/messaging - New unified educator messaging hook
 */
export const useEducatorAdminMessages = ({ conversationId, enabled = true }) => {
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  // Fetch messages for the conversation
  const { data: messages = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.educator.admin.messages(conversationId || ''),
    queryFn: async () => {
      if (!conversationId) return [];
      return MessageService.getConversationMessages(conversationId, { useCache: false });
    },
    enabled: enabled && !!conversationId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Send message function
  const sendMessage = useCallback(async ({
    senderId,
    senderType,
    receiverId,
    receiverType,
    messageText,
    subject
  }) => {
    if (!conversationId || !senderId || !receiverId || !messageText?.trim()) {
      throw new Error('Missing required fields for message');
    }

    setIsSending(true);

    try {
      const message = await MessageService.sendMessage(
        conversationId,
        senderId,
        senderType,
        receiverId,
        receiverType,
        messageText,
        undefined, // applicationId
        undefined, // opportunityId
        undefined, // classId
        subject
      );

      // Optimistically update the messages list
      queryClient.setQueryData(queryKeys.educator.admin.messages(conversationId), (oldMessages) => {
        if (!oldMessages) return [message];
        return [...oldMessages, message];
      });

      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.educator.admin.messages(conversationId),
        refetchType: 'active'
      });

      // Also invalidate conversation lists for both parties
      queryClient.invalidateQueries({
        queryKey: queryKeys.educator.conversations.all,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({
        queryKey: ['school-admin-conversations'],
        refetchType: 'active'
      });

      return message;
    } catch (error) {
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [conversationId, queryClient]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId || !enabled) return;

    const subscription = MessageService.subscribeToConversation(
      conversationId,
      (newMessage) => {
        // Update messages cache
        queryClient.setQueryData(queryKeys.educator.admin.messages(conversationId), (oldMessages) => {
          if (!oldMessages) return [newMessage];

          // Check if message already exists to avoid duplicates
          const exists = oldMessages.some(msg => msg.id === newMessage.id);
          if (exists) return oldMessages;

          return [...oldMessages, newMessage];
        });

        // Invalidate conversation lists to update unread counts
        queryClient.invalidateQueries({
          queryKey: queryKeys.educator.conversations.all,
          refetchType: 'active'
        });
        queryClient.invalidateQueries({
          queryKey: ['school-admin-conversations'],
          refetchType: 'active'
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, enabled, queryClient]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    isSending,
    refetch
  };
};