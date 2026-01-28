import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import MessageService from '../services/messageService';

/**
 * Hook for managing student-admin conversations
 */
export const useStudentAdminConversations = (studentId, enabled = true) => {
  const queryClient = useQueryClient();
  const clearUnreadCountRef = useRef(null);

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['student-admin-conversations', studentId || 'none'],
    queryFn: async () => {
      if (!studentId) return [];

      // Get student's school_id first
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('school_id')
        .eq('id', studentId)
        .maybeSingle();

      if (studentError) {
        console.error('Error fetching student school:', studentError);
        return [];
      }

      if (!studentData?.school_id) {
        // Not a school student or no school assigned - simply return empty list
        return [];
      }

      // Fetch student-admin conversations directly from database
      const { data: adminConversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          *
        `)
        .eq('student_id', studentId)
        .eq('conversation_type', 'student_admin')
        .eq('school_id', studentData.school_id)
        .eq('deleted_by_student', false)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (convError) {
        console.error('Error fetching admin conversations:', convError);
        throw convError;
      }

      return adminConversations || [];
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
        // Only handle student-admin conversations
        if (conversation.conversation_type !== 'student_admin') return;

        console.log('🔄 [Student-Admin] Realtime UPDATE detected:', conversation);

        // Ignore updates for conversations that were deleted
        if (conversation.deleted_by_student) {
          console.log('❌ [Student-Admin] Ignoring UPDATE for deleted conversation:', conversation.id);
          return;
        }

        // Invalidate conversation queries
        queryClient.invalidateQueries({
          queryKey: ['student-admin-conversations', studentId],
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
    queryClient.setQueryData(['student-admin-conversations', studentId || 'none'], (oldData) => {
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
    conversations: conversations,
    isLoading,
    error,
    refetch,
    clearUnreadCount: clearUnreadCountRef.current
  };
};

/**
 * Hook for managing messages in a student-admin conversation
 */
export const useStudentAdminMessages = ({
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
    queryKey: ['student-admin-messages', conversationId || 'none'],
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
        console.log('📨 [Student-Admin] New message received:', newMessage);

        // Add message to cache optimistically
        queryClient.setQueryData(['student-admin-messages', conversationId], (oldMessages) => {
          if (!oldMessages) return [newMessage];

          // Check if message already exists (prevent duplicates)
          const exists = oldMessages.some(msg => msg.id === newMessage.id);
          if (exists) return oldMessages;

          return [...oldMessages, newMessage];
        });

        // Update conversation list with new message preview
        queryClient.invalidateQueries({
          queryKey: ['student-admin-conversations', studentId],
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
        null, // classId
        subject
      );
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['student-admin-messages', conversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['student-admin-messages', conversationId]);

      // Optimistically add the message
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        conversation_id: conversationId,
        sender_id: variables.senderId,
        sender_type: variables.senderType,
        receiver_id: variables.receiverId,
        receiver_type: variables.receiverType,
        message_text: variables.messageText,
        subject: variables.subject,
        is_read: false,
        created_at: new Date().toISOString(),
        _optimistic: true
      };

      queryClient.setQueryData(['student-admin-messages', conversationId], (old) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { previousMessages, optimisticMessage };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['student-admin-messages', conversationId], context.previousMessages);
      }
      console.error('❌ [Student-Admin] Failed to send message:', err);
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData(['student-admin-messages', conversationId], (old) => {
        if (!old) return [data];
        return old.map(msg =>
          msg.id === context?.optimisticMessage?.id ? data : msg
        );
      });

      // Update conversation list
      queryClient.invalidateQueries({
        queryKey: ['student-admin-conversations', studentId],
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
 * Hook for creating or getting a student-admin conversation
 */
export const useCreateStudentAdminConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      subject
    }) => {
      // Get student's school_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('school_id')
        .eq('id', studentId)
        .maybeSingle();

      if (studentError || !studentData?.school_id) {
        throw new Error('Could not find student school');
      }

      const result = await MessageService.getOrCreateStudentAdminConversation(
        studentId,
        studentData.school_id,
        subject
      );

      // Return the conversation ID properly
      if (Array.isArray(result) && result.length > 0) {
        return result[0].conversation_id;
      }
      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate conversations list to include new conversation
      queryClient.invalidateQueries({
        queryKey: ['student-admin-conversations', variables.studentId],
        refetchType: 'active'
      });
    }
  });
};
