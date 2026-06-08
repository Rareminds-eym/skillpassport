import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {MessageService} from '@/features/messaging';
import { queryKeys } from '@/shared/lib/queryKeys';

/**
 * Hook for managing college educator-admin messages
 * Handles sending, receiving, and marking messages as read
 * 
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please migrate to the new unified messaging hooks:
 * 
 * **Migration Guide:**
 * ```typescript
 * // Before:
 * import { useCollegeEducatorAdminMessages } from '@/features/educator';
 * const { messages, isLoading, sendMessage } = useCollegeEducatorAdminMessages({
 *   conversationId, userId, userType, enabled
 * });
 * 
 * // After:
 * import { useEducatorMessages } from '@/features/messaging';
 * const { messages, isLoadingMessages, sendMessage } = useEducatorMessages(
 *   userId,
 *   { conversationId, conversationType: 'college_educator_admin', enabled }
 * );
 * ```
 * 
 * @see {@link useEducatorMessages} from @/features/messaging - New unified educator messaging hook
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
    queryKey: queryKeys.college.admin.messages(conversationId || ''),
    queryFn: async () => {
      if (!conversationId) return [];

      const messages = await MessageService.getConversationMessages(conversationId, {
        useCache: true,
        limit: 100
      });

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

      return message;
    },
    onSuccess: (newMessage) => {
      // Optimistically update the messages cache
      queryClient.setQueryData(queryKeys.college.admin.messages(conversationId), (oldMessages) => {
        if (!oldMessages) return [newMessage];
        return [...oldMessages, newMessage];
      });

      // Invalidate conversations to update last message preview
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.college.admin.conversations.all,
        refetchType: 'active'
      });
    },
    onError: (error) => {
      throw error;
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!conversationId || !userId) return;

      await MessageService.markConversationAsRead(conversationId, userId);
    },
    onSuccess: () => {
      // Invalidate conversations to update unread counts
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.college.admin.conversations.all,
        refetchType: 'active'
      });
    },
    onError: (error) => {
    }
  });

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!enabled || !conversationId) return;

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
    }

    // Create new subscription
    subscriptionRef.current = MessageService.subscribeToConversationMessages(
      conversationId,
      (newMessage) => {
        // Add new message to cache
        queryClient.setQueryData(queryKeys.college.admin.messages(conversationId), (oldMessages) => {
          if (!oldMessages) return [newMessage];
          
          // Check if message already exists (avoid duplicates)
          const messageExists = oldMessages.some(msg => msg.id === newMessage.id);
          if (messageExists) return oldMessages;
          
          return [...oldMessages, newMessage];
        });

        // Invalidate conversations to update last message preview and unread counts
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.college.admin.conversations.all,
          refetchType: 'active'
        });
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
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