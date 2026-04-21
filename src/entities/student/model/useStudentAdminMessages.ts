// TODO: This hook needs MessageService passed as a parameter
// Example: export function useConversationStudents(messageService: typeof MessageService)
// Then update all call sites to pass MessageService from @/features/messaging

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import MessageService from '@/features/messaging/api/messageService';
import { queryKeys } from '@/shared/lib/queryKeys';
/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please migrate to the new unified messaging hooks from @/features/messaging:
 * 
 * **Migration Guide:**
 * ```typescript
 * // Before:
 * import { useStudentMessages } from '@/entities/student' (or @/features/student-profile);
 * const { messages, isLoading, sendMessage } = useStudentMessages({ studentId, conversationId });
 * 
 * // After:
 * import { useStudentMessages } from '@/features/messaging';
 * const { messages, isLoadingMessages, sendMessage } = useStudentMessages(
 *   studentId,
 *   { conversationId }
 * );
 * ```
 * 
 * @see {@link useStudentMessages} from @/features/messaging - New unified student messaging hook
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
    queryKey: queryKeys.student.messages.conversation(conversationId || 'none'),
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
        queryClient.setQueryData(queryKeys.student.messages.conversation(conversationId!), (oldMessages) => {
          if (!oldMessages) return [newMessage];

          // Check if message already exists (prevent duplicates)
          const exists = oldMessages.some(msg => msg.id === newMessage.id);
          if (exists) return oldMessages;

          return [...oldMessages, newMessage];
        });

        // Update conversation list with new message preview
        queryClient.invalidateQueries({
          queryKey: queryKeys.student.conversations.byStudent(studentId, 'student_admin'),
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
      await queryClient.cancelQueries({ queryKey: queryKeys.student.messages.conversation(conversationId!) });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(queryKeys.student.messages.conversation(conversationId!));

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

      queryClient.setQueryData(queryKeys.student.messages.conversation(conversationId!), (old) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { previousMessages, optimisticMessage };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKeys.student.messages.conversation(conversationId!), context.previousMessages);
      }
      console.error('❌ [Student-Admin] Failed to send message:', err);
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData(queryKeys.student.messages.conversation(conversationId!), (old) => {
        if (!old) return [data];
        return old.map(msg =>
          msg.id === context?.optimisticMessage?.id ? data : msg
        );
      });

      // Update conversation list
      queryClient.invalidateQueries({
        queryKey: queryKeys.student.conversations.byStudent(studentId, 'student_admin'),
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
 * Hook for fetching student-admin conversations
 * @deprecated Use useStudentMessages from @/features/messaging instead
 */
export const useStudentAdminConversations = (studentId, enabled = true) => {
  const queryClient = useQueryClient();
  const clearUnreadCountRef = useRef(null);

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.student.conversations.byStudent(studentId, 'student_admin'),
    queryFn: async () => {
      if (!studentId) return [];
      return await MessageService.getConversationsByStudent(studentId, 'student_admin');
    },
    enabled: !!studentId && enabled,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  clearUnreadCountRef.current = (conversationId) => {
    queryClient.setQueryData(
      queryKeys.student.conversations.byStudent(studentId, 'student_admin'),
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
        queryKey: queryKeys.student.conversations.byStudent(variables.studentId, 'student_admin'),
        refetchType: 'active'
      });
    }
  });
};
