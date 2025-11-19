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
      return await MessageService.getConversationMessages(conversationId);
    },
    enabled: enabled && !!conversationId,
    staleTime: 60000, // Cache valid for 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: false, // Disable polling - use real-time instead
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists
    retry: 1, // Only retry once on failure
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversationId || !enabled) return;

    const subscription = MessageService.subscribeToConversation(
      conversationId,
      (newMessage: Message) => {
        // Optimistically update the cache
        queryClient.setQueryData<Message[]>(
          ['messages', conversationId],
          (oldMessages = []) => {
            // Check if message already exists (avoid duplicates)
            const exists = oldMessages.some(msg => msg.id === newMessage.id);
            if (exists) {
              return oldMessages;
            }
            
            // Add new message in sorted order by created_at
            return [...oldMessages, newMessage].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }
        );
      }
    );

    return () => {
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
      // Replace optimistic message with real one
      queryClient.setQueryData<Message[]>(
        ['messages', conversationId],
        (old = []) => {
          // Remove the optimistic message (temporary ID from Date.now())
          const withoutOptimistic = old.filter(msg => msg.id < 1000000000000 && msg.id !== data.id);
          // Add real message and sort by created_at
          return [...withoutOptimistic, data].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
      );
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
  subject?: string,
  enabled: boolean = true
) => {
  const queryClient = useQueryClient();

  const {
    data: conversation,
    isLoading,
    error
  } = useQuery({
    queryKey: ['conversation', studentId, recruiterId, applicationId],
    queryFn: async () => {
      const result = await MessageService.getOrCreateConversation(
        studentId,
        recruiterId,
        applicationId,
        opportunityId,
        subject
      );
      return result;
    },
    enabled: enabled && !!studentId && !!recruiterId,
    staleTime: Infinity, // Conversation doesn't change often
    gcTime: Infinity, // Keep in cache forever
    retry: false, // Don't retry on error
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Mutation for marking messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!conversation) throw new Error('No conversation');
      return await MessageService.markConversationAsRead(conversation.id, userId);
    },
    onSuccess: (data, userId) => {
      // Update cache directly instead of invalidating
      queryClient.setQueryData<Conversation>(
        ['conversation', studentId, recruiterId, applicationId],
        (old) => {
          if (!old) return old;
          const isStudent = old.student_id === userId;
          return {
            ...old,
            student_unread_count: isStudent ? 0 : old.student_unread_count,
            recruiter_unread_count: !isStudent ? 0 : old.recruiter_unread_count,
          };
        }
      );
    }
  });

  return {
    conversation,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
  };
};

