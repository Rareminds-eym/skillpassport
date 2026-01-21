import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import MessageService from '../services/messageService';

/**
 * Hook for managing messages in an educator conversation
 */
export const useEducatorMessages = ({ conversationId, enabled = true, enableRealtime = true }) => {
  const queryClient = useQueryClient();

  // Fetch messages
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['educator-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return await MessageService.getConversationMessages(conversationId, { useCache: true });
    },
    enabled: !!conversationId && enabled,
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId || !enableRealtime) return;

    const subscription = MessageService.subscribeToConversation(conversationId, (newMessage) => {
      console.log('📨 [Educator] New message received:', newMessage);

      // Add message to cache optimistically
      queryClient.setQueryData(['educator-messages', conversationId], (oldMessages) => {
        if (!oldMessages) return [newMessage];

        // Check if message already exists (prevent duplicates)
        const exists = oldMessages.some((msg) => msg.id === newMessage.id);
        if (exists) return oldMessages;

        return [...oldMessages, newMessage];
      });

      // Update conversation list with new message preview
      queryClient.invalidateQueries({
        queryKey: ['educator-conversations'],
        refetchType: 'active',
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, enableRealtime, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      senderId,
      senderType,
      receiverId,
      receiverType,
      messageText,
      classId,
      subject,
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
      await queryClient.cancelQueries({ queryKey: ['educator-messages', conversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['educator-messages', conversationId]);

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
        _optimistic: true,
      };

      queryClient.setQueryData(['educator-messages', conversationId], (old) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { previousMessages, optimisticMessage };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['educator-messages', conversationId], context.previousMessages);
      }
      console.error('❌ [Educator] Failed to send message:', err);
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData(['educator-messages', conversationId], (old) => {
        if (!old) return [data];
        return old.map((msg) => (msg.id === context?.optimisticMessage?.id ? data : msg));
      });

      // Update conversation list
      queryClient.invalidateQueries({
        queryKey: ['educator-conversations'],
        refetchType: 'active',
      });
    },
  });

  return {
    messages,
    isLoading,
    error,
    refetch,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
  };
};
