// TODO: Dependency Injection Required
// This hook needs MessageService/Message types passed as parameters
// Update all call sites to pass these dependencies from @/features/messaging

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import MessageService from '@/shared/api/messageService';
import { queryKeys } from '@/shared/lib/queryKeys';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-educator-messages');
/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please migrate to the new unified messaging hooks from @/features/messaging:
 * 
 * **Migration Guide:**
 * ```typescript
 * // Before:
 * import { useLearnerMessages } from '@/entities/learner' (or @/features/learner-profile);
 * const { messages, isLoading, sendMessage } = useLearnerMessages({ learnerId, conversationId });
 * 
 * // After:
 * import { useLearnerMessages } from '@/features/messaging';
 * const { messages, isLoadingMessages, sendMessage } = useLearnerMessages(
 *   learnerId,
 *   { conversationId }
 * );
 * ```
 * 
 * @see {@link useLearnerMessages} from @/features/messaging - New unified learner messaging hook
 */
export const useLearnerEducatorMessages = ({
  learnerId,
  conversationId,
  enabled = true,
  enableRealtime = true
}) => {
  const queryClient = useQueryClient();

  // Fetch messages
  const {
    data: messages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.learner.messages.conversation(conversationId || 'none'),
    queryFn: async () => {
      if (!conversationId) return [];
      return await MessageService.getConversationMessages(conversationId, { useCache: true });
    },
    enabled: !!conversationId && enabled && !!learnerId,
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId || !enableRealtime) return;

    const subscription = MessageService.subscribeToConversationMessages(
      conversationId,
      (newMessage) => {
        // Add message to cache optimistically
        queryClient.setQueryData(queryKeys.learner.messages.conversation(conversationId), (oldMessages) => {
          if (!oldMessages) return [newMessage];

          // Check if message already exists (prevent duplicates)
          const exists = oldMessages.some(msg => msg.id === newMessage.id);
          if (exists) return oldMessages;

          return [...oldMessages, newMessage];
        });

        // Update conversation list with new message preview
        queryClient.invalidateQueries({
          queryKey: queryKeys.learner.conversations.byLearner(learnerId, 'learner_educator'),
          refetchType: 'active'
        });
      }
    );

    return () => {
      subscription();
    };
  }, [conversationId, enableRealtime, queryClient, learnerId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      senderId,
      senderType,
      receiverId,
      receiverType,
      messageText,
      classId,
      subject
    }) => {
      return await MessageService.sendMessage(
        conversationId,
        senderId,
        senderType,
        receiverId,
        receiverType,
        messageText,
        null, // applicationId
        null, // opportunityId
        classId,
        subject
      );
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.learner.messages.conversation(conversationId!) });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(queryKeys.learner.messages.conversation(conversationId!));

      // Optimistically add the message
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        conversation_id: conversationId,
        sender_id: variables.senderId,
        sender_type: variables.senderType,
        receiver_id: variables.receiverId,
        receiver_type: variables.receiverType,
        message_text: variables.messageText,
        class_id: variables.classId,
        subject: variables.subject,
        is_read: false,
        created_at: new Date().toISOString(),
        _optimistic: true
      };

      queryClient.setQueryData(queryKeys.learner.messages.conversation(conversationId!), (old) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { previousMessages, optimisticMessage };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.learner.messages.conversation(conversationId!), context.previousMessages);
      }
      logger.error('Failed to send message', err instanceof Error ? err : new Error(String(err)), { conversationId, learnerId });
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData(queryKeys.learner.messages.conversation(conversationId!), (old) => {
        if (!old) return [data];
        return old.map(msg =>
          msg.id === context?.optimisticMessage?.id ? data : msg
        );
      });

      // Update conversation list
      queryClient.invalidateQueries({
        queryKey: queryKeys.learner.conversations.byLearner(learnerId, 'learner_educator'),
        refetchType: 'active'
      });
    }
  });

  return {
    messages,
    isLoading,
    error,
    refetch,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending
  };
};

/**
 * Hook for fetching learner-educator conversations
 * @deprecated Use useLearnerMessages from @/features/messaging instead
 */
export const useLearnerEducatorConversations = (learnerId, enabled = true) => {
  const queryClient = useQueryClient();
  const clearUnreadCountRef = useRef(null);

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.learner.conversations.byLearner(learnerId, 'learner_educator'),
    queryFn: async () => {
      if (!learnerId) return [];
      const [schoolConvs, collegeConvs] = await Promise.all([
        MessageService.getUserConversations(learnerId, 'learner', false, true, 'learner_educator'),
        MessageService.getUserConversations(learnerId, 'learner', false, true, 'learner_college_educator'),
      ]);
      return [...(schoolConvs || []), ...(collegeConvs || [])];
    },
    enabled: !!learnerId && enabled,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  clearUnreadCountRef.current = (conversationId) => {
    queryClient.setQueryData(
      queryKeys.learner.conversations.byLearner(learnerId, 'learner_educator'),
      (old) => {
        if (!old) return old;
        return old.map(conv =>
          conv.conversation_id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        );
      }
    );
  };

  return {
    conversations,
    isLoading,
    error,
    refetch,
    clearUnreadCount: clearUnreadCountRef.current
  };
};

/**
 * Hook for creating or getting a learner-educator conversation
 */
export const useCreateLearnerEducatorConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      learnerId,
      educatorId,
      classId,
      subject
    }) => {
      return await MessageService.getOrCreatelearnerEducatorConversation(
        learnerId,
        educatorId,
        classId,
        subject
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate conversations list to include new conversation
      queryClient.invalidateQueries({
        queryKey: queryKeys.learner.conversations.byLearner(variables.learnerId, 'learner_educator'),
        refetchType: 'active'
      });
    }
  });
};