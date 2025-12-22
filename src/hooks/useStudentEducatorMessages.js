import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import MessageService from '../services/messageService';

/**
 * Hook for managing student-educator conversations
 */
export const useStudentEducatorConversations = (studentId, enabled = true) => {
  const queryClient = useQueryClient();
  const clearUnreadCountRef = useRef(null);

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['student-educator-conversations', studentId || 'none'],
    queryFn: async () => {
      if (!studentId) return [];
      // Only fetch student-educator conversations
      return await MessageService.getUserConversations(
        studentId, 
        'student', 
        false, // includeArchived
        true,  // useCache
        'student_educator' // conversationType filter
      );
    },
    enabled: !!studentId && enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!studentId || !enabled) return;

    const subscription = MessageService.subscribeToUserConversations(
      studentId,
      'student',
      (conversation) => {
        // Only handle student-educator conversations
        if (conversation.conversation_type !== 'student_educator') return;
        
        console.log('🔄 [Student-Educator] Realtime UPDATE detected:', conversation);
        
        // Ignore updates for conversations that were deleted
        if (conversation.deleted_by_student) {
          console.log('❌ [Student-Educator] Ignoring UPDATE for deleted conversation:', conversation.id);
          return;
        }
        
        // Invalidate conversation queries
        queryClient.invalidateQueries({ 
          queryKey: ['student-educator-conversations', studentId],
          refetchType: 'active'
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [studentId, enabled, queryClient]);

  // Clear unread count function
  const clearUnreadCount = (conversationId) => {
    queryClient.setQueryData(['student-educator-conversations', studentId || 'none'], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map(conv => 
        conv.id === conversationId 
          ? { ...conv, student_unread_count: 0 }
          : conv
      );
    });
  };

  // Store the function in ref so it can be accessed by components
  clearUnreadCountRef.current = clearUnreadCount;

  return {
    conversations: conversations, // No need to filter - already filtered at DB level
    isLoading,
    error,
    refetch,
    clearUnreadCount: clearUnreadCountRef.current
  };
};

/**
 * Hook for managing messages in a student-educator conversation
 */
export const useStudentEducatorMessages = ({ 
  studentId, 
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
    queryKey: ['student-educator-messages', conversationId || 'none'],
    queryFn: async () => {
      if (!conversationId) return [];
      return await MessageService.getConversationMessages(conversationId, { useCache: true });
    },
    enabled: !!conversationId && enabled && !!studentId,
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId || !enableRealtime) return;

    const subscription = MessageService.subscribeToConversation(
      conversationId,
      (newMessage) => {
        console.log('📨 [Student-Educator] New message received:', newMessage);
        
        // Add message to cache optimistically
        queryClient.setQueryData(['student-educator-messages', conversationId], (oldMessages) => {
          if (!oldMessages) return [newMessage];
          
          // Check if message already exists (prevent duplicates)
          const exists = oldMessages.some(msg => msg.id === newMessage.id);
          if (exists) return oldMessages;
          
          return [...oldMessages, newMessage];
        });

        // Update conversation list with new message preview
        queryClient.invalidateQueries({ 
          queryKey: ['student-educator-conversations', studentId],
          refetchType: 'active'
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, enableRealtime, queryClient, studentId]);

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
      await queryClient.cancelQueries({ queryKey: ['student-educator-messages', conversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['student-educator-messages', conversationId]);

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

      queryClient.setQueryData(['student-educator-messages', conversationId], (old) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { previousMessages, optimisticMessage };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['student-educator-messages', conversationId], context.previousMessages);
      }
      console.error('❌ [Student-Educator] Failed to send message:', err);
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData(['student-educator-messages', conversationId], (old) => {
        if (!old) return [data];
        return old.map(msg => 
          msg.id === context?.optimisticMessage?.id ? data : msg
        );
      });

      // Update conversation list
      queryClient.invalidateQueries({ 
        queryKey: ['student-educator-conversations', studentId],
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
 * Hook for creating or getting a student-educator conversation
 */
export const useCreateStudentEducatorConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      studentId, 
      educatorId, 
      classId, 
      subject 
    }) => {
      return await MessageService.getOrCreateStudentEducatorConversation(
        studentId,
        educatorId,
        classId,
        subject
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate conversations list to include new conversation
      queryClient.invalidateQueries({ 
        queryKey: ['student-educator-conversations', variables.studentId],
        refetchType: 'active'
      });
    }
  });
};