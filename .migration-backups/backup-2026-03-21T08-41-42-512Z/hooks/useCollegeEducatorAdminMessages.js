import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import MessageService from '../services/messageService';

/**
 * Hook for managing messages in college educator ↔ admin conversations
 * Handles sending, receiving, and marking messages as read
 */
export const useCollegeEducatorAdminMessages = ({
  conversationId,
  userId,
  userType, // 'college_educator' or 'college_admin'
  enabled = true
}) => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef(null);

  // Fetch messages for the conversation
  const { data: messages = [], isLoading, error, refetch } = useQuery({
    queryKey: ['college-educator-admin-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      console.log('🔍 [useCollegeEducatorAdminMessages] Fetching messages for conversation:', conversationId);

      const messages = await MessageService.getConversationMessages(conversationId, {
        useCache: true,
        limit: 100
      });

      console.log('✅ [useCollegeEducatorAdminMessages] Messages loaded:', messages.length);
      return messages;
    },
    enabled: enabled && !!conversationId,
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ senderId, senderType, receiverId, receiverType, messageText, subject }) => {
      console.log('📤 [useCollegeEducatorAdminMessages] Sending message:', {
        conversationId,
        senderId,
        senderType,
        receiverId,
        receiverType,
        messageText: messageText.substring(0, 50) + '...',
        subject
      });

      const message = await MessageService.sendMessage(
        conversationId,
        senderId,
        senderType,
        receiverId,
        receiverType,
        messageText,
        null, // applicationId
        null, // opportunityId
        null, // classId
        subject
      );

      console.log('✅ [useCollegeEducatorAdminMessages] Message sent:', message.id);
      return message;
    },
    onSuccess: (newMessage) => {
      // Optimistically update the messages cache
      queryClient.setQueryData(['college-educator-admin-messages', conversationId], (oldMessages) => {
        if (!oldMessages) return [newMessage];
        return [...oldMessages, newMessage];
      });

      // Invalidate conversations to update last message preview
      queryClient.invalidateQueries({ 
        queryKey: ['college-educator-admin-conversations'],
        refetchType: 'active'
      });
    },
    onError: (error) => {
      console.error('❌ [useCollegeEducatorAdminMessages] Error sending message:', error);
      throw error;
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!conversationId || !userId) return;

      console.log('👁️ [useCollegeEducatorAdminMessages] Marking conversation as read:', {
        conversationId,
        userId,
        userType
      });

      await MessageService.markConversationAsRead(conversationId, userId);
    },
    onSuccess: () => {
      // Invalidate conversations to update unread counts
      queryClient.invalidateQueries({ 
        queryKey: ['college-educator-admin-conversations'],
        refetchType: 'active'
      });
    },
    onError: (error) => {
      console.error('❌ [useCollegeEducatorAdminMessages] Error marking as read:', error);
    }
  });

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!enabled || !conversationId) return;

    console.log('🔄 [useCollegeEducatorAdminMessages] Setting up message subscription for:', conversationId);

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Create new subscription
    subscriptionRef.current = MessageService.subscribeToConversation(
      conversationId,
      (newMessage) => {
        console.log('🔄 [useCollegeEducatorAdminMessages] Real-time message received:', newMessage);

        // Add new message to cache
        queryClient.setQueryData(['college-educator-admin-messages', conversationId], (oldMessages) => {
          if (!oldMessages) return [newMessage];
          
          // Check if message already exists (avoid duplicates)
          const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
          if (messageExists) return oldMessages;
          
          return [...oldMessages, newMessage];
        });

        // Invalidate conversations to update last message preview and unread counts
        queryClient.invalidateQueries({ 
          queryKey: ['college-educator-admin-conversations'],
          refetchType: 'active'
        });
      }
    );

    return () => {
      console.log('🔄 [useCollegeEducatorAdminMessages] Cleaning up message subscription');
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [enabled, conversationId, queryClient]);

  // Helper function to send message
  const sendMessage = async ({ senderId, senderType, receiverId, receiverType, messageText, subject }) => {
    return sendMessageMutation.mutateAsync({
      senderId,
      senderType,
      receiverId,
      receiverType,
      messageText,
      subject
    });
  };

  // Helper function to mark conversation as read
  const markAsRead = async () => {
    return markAsReadMutation.mutateAsync();
  };

  return {
    messages,
    isLoading,
    error,
    refetch,
    sendMessage,
    isSending: sendMessageMutation.isPending,
    markAsRead,
    isMarkingAsRead: markAsReadMutation.isPending
  };
};

/**
 * Hook specifically for college educators
 */
export const useCollegeEducatorAdminMessagesForEducator = ({
  conversationId,
  educatorId,
  enabled = true
}) => {
  return useCollegeEducatorAdminMessages({
    conversationId,
    userId: educatorId,
    userType: 'college_educator',
    enabled
  });
};

/**
 * Hook specifically for college admins
 */
export const useCollegeEducatorAdminMessagesForAdmin = ({
  conversationId,
  adminId,
  enabled = true
}) => {
  return useCollegeEducatorAdminMessages({
    conversationId,
    userId: adminId,
    userType: 'college_admin',
    enabled
  });
};

export default useCollegeEducatorAdminMessages;