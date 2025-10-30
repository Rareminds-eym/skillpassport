import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState, useMemo } from 'react';
import MessageService, { Message } from '../services/messageService';
import { useMessageStore } from '../stores/useMessageStore';
import { supabase } from '../lib/supabaseClient';

interface UseStudentMessagesOptions {
  studentId: string | null;
  conversationId?: string | null;
  enabled?: boolean;
  enableRealtime?: boolean;
}

/**
 * Hook for managing student messages with zustand + react-query + realtime
 * Non-blocking, efficient state management with optimistic updates
 */
export const useStudentMessages = ({
  studentId,
  conversationId = null,
  enabled = true,
  enableRealtime = true
}: UseStudentMessagesOptions) => {
  const queryClient = useQueryClient();
  const {
    messages,
    addMessage,
    setMessages,
    setIsLoadingMessages,
    addOptimisticMessage,
    removeOptimisticMessage
  } = useMessageStore();

  // Fetch messages with React Query (non-blocking)
  const {
    data: fetchedMessages,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['student-messages', conversationId],
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
    enabled: enabled && !!conversationId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: false, // Rely on realtime instead of polling
  });

  // Sync fetched messages to zustand store
  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages, setMessages]);

  // Supabase realtime subscription for conversation messages
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
          
          // Add to zustand store (automatically deduplicates)
          addMessage(newMessage);
          
          // Invalidate query to keep react-query in sync
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
          
          // Update in zustand store
          useMessageStore.getState().updateMessage(updatedMessage.id, updatedMessage);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, enabled, enableRealtime, addMessage, queryClient]);

  // Send message mutation with optimistic updates
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
      if (!conversationId) throw new Error('No conversation selected');
      
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
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['student-messages', conversationId] });

      // Add optimistic message to zustand
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
      // Remove optimistic message
      if (context?.tempId) {
        removeOptimisticMessage(context.tempId);
      }
      
      // Add real message (will deduplicate via realtime)
      addMessage(realMessage);
    },
    onError: (error, variables, context) => {
      // Remove optimistic message on error
      if (context?.tempId) {
        removeOptimisticMessage(context.tempId);
      }
    }
  });

  return {
    messages, // From zustand store (always in sync)
    isLoading,
    error,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    refetch
  };
};

/**
 * Hook for fetching unread count for student
 */
export const useStudentUnreadCount = (studentId: string | null, enabled = true) => {
  const { setUnreadCount } = useMessageStore();
  
  const { data: unreadCount = 0, isLoading } = useQuery({
    queryKey: ['student-unread-count', studentId],
    queryFn: async () => {
      if (!studentId) return 0;
      const count = await MessageService.getUnreadCount(studentId, 'student');
      setUnreadCount(count);
      return count;
    },
    enabled: enabled && !!studentId,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000
  });

  // Realtime subscription for unread count updates
  useEffect(() => {
    if (!studentId || !enabled) return;

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
          // Increment unread count
          useMessageStore.getState().incrementUnreadCount();
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
          // If message was marked as read, decrement count
          if (updatedMessage.is_read && !(payload.old as Message).is_read) {
            useMessageStore.getState().decrementUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [studentId, enabled]);

  return { unreadCount, isLoading };
};

/**
 * Hook for fetching student conversations
 */
export const useStudentConversations = (studentId: string | null, enabled = true) => {
  const { setConversations, setIsLoadingConversations } = useMessageStore();
  const queryClient = useQueryClient();
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['student-conversations', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      setIsLoadingConversations(true);
      try {
        const convs = await MessageService.getUserConversations(studentId, 'student');
        // Don't sync to zustand here - it conflicts with optimistic updates
        // setConversations(convs);
        return convs;
      } finally {
        setIsLoadingConversations(false);
      }
    },
    enabled: enabled && !!studentId,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: false // Disable polling - use real-time instead
  });
  
  /**
   * Optimistically clear unread count for a conversation
   * This makes the UI feel instant when marking messages as read
   */
  const clearUnreadCount = useCallback((conversationId: string) => {
    console.log('📦 [Student Optimistic] Clearing unread count for:', conversationId);
    
    // Get current data from React Query cache
    const currentConversations = queryClient.getQueryData<any[]>(
      ['student-conversations', studentId]
    ) || [];
    
    console.log('📊 Current conversations in cache:', currentConversations.length);
    
    const optimisticConversations = currentConversations.map(conv => {
      if (conv.id === conversationId) {
        console.log('✅ Found conversation, clearing unread from', conv.student_unread_count, 'to 0');
        return { ...conv, student_unread_count: 0 };
      }
      return conv;
    });
    
    // Update React Query cache immediately
    queryClient.setQueryData(
      ['student-conversations', studentId],
      optimisticConversations
    );
    
    // Force re-render by invalidating without refetching
    queryClient.invalidateQueries({
      queryKey: ['student-conversations', studentId],
      refetchType: 'none'
    });
    
    // Trigger state update to force re-render
    setUpdateTrigger(prev => prev + 1);
    
    console.log('✅ [Student Optimistic] Cache updated and invalidated - UI should re-render');
  }, [studentId, queryClient]);

  // Realtime subscription for conversation updates
  useEffect(() => {
    if (!studentId || !enabled) return;

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
        () => {
          // Refetch conversations to get updated data
          refetch();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [studentId, enabled, refetch]);

  // Force conversations to be reactive to optimistic updates
  const reactiveConversations = useMemo(() => {
    // Re-compute when updateTrigger changes
    const cached = queryClient.getQueryData<any[]>(['student-conversations', studentId]) || [];
    return cached;
  }, [queryClient, studentId, updateTrigger, conversations]);

  return {
    conversations: reactiveConversations,
    isLoading,
    error,
    refetch,
    clearUnreadCount
  };
};

