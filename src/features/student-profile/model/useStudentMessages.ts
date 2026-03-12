/**
 * Consolidated Student Messages Hook
 * 
 * Consolidates:
 * - useStudentMessages
 * - useStudentMessageNotifications
 * - useStudentEducatorMessages
 * - useStudentAdminMessages
 * - useStudentCollegeAdminMessages
 * - useStudentCollegeLecturerMessages
 * 
 * Returns: messages, notifications, conversations (all types)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { MessageService, Message } from '@/features/messaging';
import { useMessageStore } from '@/features/messaging';
import { supabase } from '@/shared/api/supabaseClient';

export interface UseStudentMessagesOptions {
  studentId: string | null;
  conversationId?: string | null;
  conversationType?: 'all' | 'student_recruiter' | 'student_educator' | 'student_admin' | 'student_college_admin' | 'student_college_educator';
  enabled?: boolean;
  enableRealtime?: boolean;
  enableNotifications?: boolean;
}

export interface Conversation {
  id: string;
  conversation_type: string;
  student_id: string;
  recruiter_id?: string;
  educator_id?: string;
  admin_id?: string;
  last_message_at: string;
  last_message_text: string;
  student_unread_count: number;
  created_at: string;
}

export const useStudentMessages = ({
  studentId,
  conversationId = null,
  conversationType = 'all',
  enabled = true,
  enableRealtime = true,
  enableNotifications = false
}: UseStudentMessagesOptions) => {
  const queryClient = useQueryClient();
  const {
    messages,
    addMessage,
    setMessages,
    setIsLoadingMessages,
    addOptimisticMessage,
    removeOptimisticMessage,
    incrementUnreadCount,
    setUnreadCount
  } = useMessageStore();

  // Fetch messages for a specific conversation
  const {
    data: fetchedMessages,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['student-messages', conversationId || 'none'],
    queryFn: async () => {
      if (!conversationId) return [];
      setIsLoadingMessages(true);
      try {
        const msgs = await MessageService.getConversationMessages(conversationId);
        return msgs;
      } finally {
        setIsLoadingMessages(false);
      }
    },
    enabled: enabled && !!conversationId && !!studentId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchInterval: false
  });

  // Sync fetched messages to zustand store
  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages, setMessages]);

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['student-conversations', studentId || 'none', conversationType],
    queryFn: async () => {
      if (!studentId) return [];
      
      const allConversations = await MessageService.getUserConversations(
        studentId,
        'student',
        false,
        true,
        conversationType === 'all' ? undefined : conversationType
      );
      
      return allConversations;
    },
    enabled: enabled && !!studentId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    retry: 1
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['student-unread-count', studentId || 'none'],
    queryFn: async () => {
      if (!studentId) return 0;
      const count = await MessageService.getUnreadCount(studentId, 'student');
      setUnreadCount(count);
      return count;
    },
    enabled: enabled && !!studentId,
    refetchInterval: 60000,
    staleTime: 30000
  });

  // Realtime subscription for conversation messages
  useEffect(() => {
    if (!conversationId || !enabled || !enableRealtime) return;

    const channel = supabase
      .channel(`student-conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          addMessage(newMessage);
          queryClient.invalidateQueries({ 
            queryKey: ['student-messages', conversationId],
            refetchType: 'none'
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          useMessageStore.getState().updateMessage(updatedMessage.id, updatedMessage);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, enabled, enableRealtime, addMessage, queryClient]);

  // Realtime subscription for unread count
  useEffect(() => {
    if (!studentId || !enabled || !enableRealtime) return;

    const channel = supabase
      .channel(`student-unread:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${studentId}`
        },
        () => {
          incrementUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${studentId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          if (updatedMessage.is_read && !(payload.old as Message).is_read) {
            useMessageStore.getState().decrementUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [studentId, enabled, enableRealtime, incrementUnreadCount]);

  // Realtime subscription for conversations
  useEffect(() => {
    if (!studentId || !enabled || !enableRealtime) return;

    const channel = supabase
      .channel(`student-conversations:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          const updatedConv = payload.new as any;
          
          if (updatedConv.deleted_by_student || updatedConv.deleted_by_recruiter) {
            return;
          }
          
          queryClient.invalidateQueries({ 
            queryKey: ['student-conversations', studentId || 'none', conversationType],
            refetchType: 'active'
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `student_id=eq.${studentId}`
        },
        () => {
          refetchConversations();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [studentId, enabled, enableRealtime, conversationType, refetchConversations, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      senderId,
      senderType,
      receiverId,
      receiverType,
      messageText,
      applicationId,
      opportunityId,
      classId,
      subject
    }: {
      senderId: string;
      senderType: 'student' | 'recruiter' | 'educator' | 'admin';
      receiverId: string;
      receiverType: 'student' | 'recruiter' | 'educator' | 'admin';
      messageText: string;
      applicationId?: number;
      opportunityId?: number;
      classId?: string;
      subject?: string;
    }) => {
      if (!conversationId) throw new Error('No conversation selected');
      
      return await MessageService.sendMessage(
        conversationId,
        senderId,
        senderType,
        receiverId,
        receiverType,
        messageText,
        applicationId,
        opportunityId,
        classId,
        subject
      );
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['student-messages', conversationId] });

      const tempId = addOptimisticMessage({
        conversation_id: conversationId!,
        sender_id: variables.senderId,
        sender_type: variables.senderType,
        receiver_id: variables.receiverId,
        receiver_type: variables.receiverType,
        message_text: variables.messageText,
        application_id: variables.applicationId,
        opportunity_id: variables.opportunityId
      });

      return { tempId };
    },
    onSuccess: (realMessage, variables, context) => {
      if (context?.tempId) {
        removeOptimisticMessage(context.tempId);
      }
      addMessage(realMessage);
    },
    onError: (error, variables, context) => {
      if (context?.tempId) {
        removeOptimisticMessage(context.tempId);
      }
    }
  });

  // Clear unread count for a conversation
  const clearUnreadCount = useCallback((convId: string) => {
    const currentConversations = queryClient.getQueryData<any[]>(
      ['student-conversations', studentId || 'none', conversationType]
    ) || [];
    
    const optimisticConversations = currentConversations.map(conv => {
      if (conv.id === convId) {
        return { ...conv, student_unread_count: 0 };
      }
      return conv;
    });
    
    queryClient.setQueryData(
      ['student-conversations', studentId || 'none', conversationType],
      optimisticConversations
    );
  }, [studentId, conversationType, queryClient]);

  // Get conversations by type
  const getConversationsByType = useCallback((type: string) => {
    return conversations.filter(conv => conv.conversation_type === type);
  }, [conversations]);

  return {
    // Messages
    messages,
    isLoadingMessages,
    messagesError,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    refetchMessages,
    
    // Conversations
    conversations,
    isLoadingConversations,
    conversationsError,
    refetchConversations,
    clearUnreadCount,
    
    // Conversation helpers
    recruiterConversations: getConversationsByType('student_recruiter'),
    educatorConversations: getConversationsByType('student_educator'),
    adminConversations: getConversationsByType('student_admin'),
    collegeAdminConversations: getConversationsByType('student_college_admin'),
    collegeLecturerConversations: getConversationsByType('student_college_educator'),
    
    // Notifications
    unreadCount,
    
    // Loading states
    loading: isLoadingMessages || isLoadingConversations,
    error: messagesError || conversationsError
  };
};
