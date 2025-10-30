import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MessageService, { Message, Conversation } from '../services/messageService';
import { useEffect } from 'react';

interface UseMessagesOptions {
  conversationId: string | null;
  enabled?: boolean;
}

/**
 * Custom hook for managing messages with real-time updates
 */
export const useMessages = ({ conversationId, enabled = true }: UseMessagesOptions) => {
  const queryClient = useQueryClient();

  // Query for fetching messages
  const {
    data: messages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      console.log('🔄 Fetching messages for conversation:', conversationId);
      return await MessageService.getConversationMessages(conversationId);
    },
    enabled: enabled && !!conversationId,
    staleTime: 30000, // Cache valid for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: false, // Disable polling - use real-time instead
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversationId || !enabled) return;

    console.log('🔔 Setting up real-time subscription for:', conversationId);

    const subscription = MessageService.subscribeToConversation(
      conversationId,
      (newMessage: Message) => {
        console.log('📨 Real-time message received:', newMessage);
        
        // Optimistically update the cache
        queryClient.setQueryData<Message[]>(
          ['messages', conversationId],
          (oldMessages = []) => {
            // Check if message already exists (avoid duplicates)
            const exists = oldMessages.some(msg => msg.id === newMessage.id);
            if (exists) return oldMessages;
            
            return [...oldMessages, newMessage];
          }
        );
      }
    );

    return () => {
      console.log('🔕 Unsubscribing from conversation:', conversationId);
      subscription.unsubscribe();
    };
  }, [conversationId, enabled, queryClient]);

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      senderId,
      senderType,
      receiverId,
      receiverType,
      messageText,
      applicationId,
      opportunityId
    }: {
      senderId: string;
      senderType: 'student' | 'recruiter';
      receiverId: string;
      receiverType: 'student' | 'recruiter';
      messageText: string;
      applicationId?: number;
      opportunityId?: number;
    }) => {
      if (!conversationId) throw new Error('No conversation ID');
      
      return await MessageService.sendMessage(
        conversationId,
        senderId,
        senderType,
        receiverId,
        receiverType,
        messageText,
        applicationId,
        opportunityId
      );
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', conversationId]);

      // Optimistically update to the new value
      const optimisticMessage: Message = {
        id: Date.now(), // Temporary ID
        conversation_id: conversationId!,
        sender_id: variables.senderId,
        sender_type: variables.senderType,
        receiver_id: variables.receiverId,
        receiver_type: variables.receiverType,
        message_text: variables.messageText,
        application_id: variables.applicationId,
        opportunity_id: variables.opportunityId,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: []
      };

      queryClient.setQueryData<Message[]>(
        ['messages', conversationId],
        (old = []) => [...old, optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
      console.error('❌ Error sending message:', err);
    },
    onSuccess: (data) => {
      console.log('✅ Message sent successfully:', data);
      
      // Replace optimistic message with real one
      queryClient.setQueryData<Message[]>(
        ['messages', conversationId],
        (old = []) => {
          // Remove the optimistic message and add the real one
          const withoutOptimistic = old.filter(msg => msg.id !== data.id && msg.id > 1000000000000);
          return [...withoutOptimistic, data];
        }
      );
      
      // Don't invalidate - real-time subscription will handle updates
      // queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    refetch
  };
};

/**
 * Hook for managing conversation
 */
export const useConversation = (
  studentId: string,
  recruiterId: string,
  applicationId?: number,
  opportunityId?: number,
  subject?: string
) => {
  const queryClient = useQueryClient();

  const {
    data: conversation,
    isLoading,
    error
  } = useQuery({
    queryKey: ['conversation', studentId, recruiterId, applicationId],
    queryFn: async () => {
      return await MessageService.getOrCreateConversation(
        studentId,
        recruiterId,
        applicationId,
        opportunityId,
        subject
      );
    },
    enabled: !!studentId && !!recruiterId,
    staleTime: Infinity, // Conversation doesn't change often
  });

  // Mutation for marking messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!conversation) throw new Error('No conversation');
      return await MessageService.markConversationAsRead(conversation.id, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', studentId, recruiterId, applicationId] });
    }
  });

  return {
    conversation,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
  };
};

