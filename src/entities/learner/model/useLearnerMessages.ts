import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState, useMemo } from 'react';
import { supabase } from '@/shared/api/supabaseClient';

import MessageService from '@/shared/api/messageService';
import type { Message } from '@/shared/api/messageService';
import { queryKeys } from '@/shared/lib/queryKeys';

import { useMessageStore } from '@/shared/model/useMessageStore';
/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please migrate to the new unified messaging hooks from @/features/messaging:
 * 
 * **Migration Guide:**
 * ```typescript
 * // Before:
 * import { useLearnerMessages } from '@/entities/learner' (or @/features/learner-profile);
 * const { messages, isLoading, sendMessage } = useLearnerMessages({ learnerId, conversationId });
 * 
 * // After:
 * import { useLearnerMessages } from '@/features/messaging';
 * const { messages, isLoadingMessages, sendMessage } = useLearnerMessages(
 *   learnerId,
 *   { conversationId }
 * );
 * ```
 * 
 * @see {@link useLearnerMessages} from @/features/messaging - New unified learner messaging hook
 */
export const useLearnerMessages = ({
  learnerId,
  conversationId = null,
  enabled = true,
  enableRealtime = true
}: UseLearnerMessagesOptions) => {
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
    queryKey: queryKeys.learner.messages.conversation(conversationId || 'none'),
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
    enabled: enabled && !!conversationId && !!learnerId,
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
      .channel(`learner-conversation:${conversationId}`)
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
            queryKey: queryKeys.learner.messages.conversation(conversationId),
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
      senderType: 'learner' | 'recruiter';
      receiverId: string;
      receiverType: 'learner' | 'recruiter';
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
      await queryClient.cancelQueries({ queryKey: queryKeys.learner.messages.conversation(conversationId!) });

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
 * Hook for fetching unread count for learner
 */
export const useLearnerUnreadCount = (learnerId: string | null, enabled = true) => {
  const { setUnreadCount } = useMessageStore();

  const { data: unreadCount = 0, isLoading } = useQuery({
    queryKey: queryKeys.learner.unread.count(learnerId || 'none'),
    queryFn: async () => {
      if (!learnerId) return 0;
      const count = await MessageService.getUnreadCount(learnerId, 'learner');
      setUnreadCount(count);
      return count;
    },
    enabled: enabled && !!learnerId,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000
  });

  // Realtime subscription for unread count updates
  useEffect(() => {
    if (!learnerId || !enabled) return;

    const channel = supabase
      .channel(`learner-unread:${learnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${learnerId}`
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
          filter: `receiver_id=eq.${learnerId}`
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
  }, [learnerId, enabled]);

  return { unreadCount, isLoading };
};

/**
 * Hook for fetching learner conversations
 */
export const useLearnerConversations = (learnerId: string | null, enabled = true) => {
  const { setConversations, setIsLoadingConversations } = useMessageStore();
  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.learner.conversations.byLearner(learnerId || 'none', 'learner_recruiter'),
    queryFn: async () => {
      if (!learnerId) return [];
      setIsLoadingConversations(true);
      try {
        // Only fetch learner-recruiter conversations for this hook
        const convs = await MessageService.getUserConversations(
          learnerId,
          'learner',
          false, // includeArchived
          true,  // useCache
          'learner_recruiter' // conversationType filter
        );
        return convs;
      } finally {
        setIsLoadingConversations(false);
      }
    },
    enabled: enabled && !!learnerId,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false, // Disable - rely on real-time updates
    refetchInterval: false, // Disable polling - use real-time instead
    refetchOnMount: false, // Only fetch if data is stale
    retry: 1 // Only retry once on failure
  });

  /**
   * Optimistically clear unread count for a conversation
   * This makes the UI feel instant when marking messages as read
   */
  const clearUnreadCount = useCallback((conversationId: string) => {

    // Get current data from React Query cache
    const currentConversations = queryClient.getQueryData<any[]>(
      queryKeys.learner.conversations.byLearner(learnerId || 'none', 'learner_recruiter')
    ) || [];


    const optimisticConversations = currentConversations.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, learner_unread_count: 0 };
      }
      return conv;
    });

    // Update React Query cache immediately
    queryClient.setQueryData(
      queryKeys.learner.conversations.byLearner(learnerId || 'none', 'learner_recruiter'),
      optimisticConversations
    );

  }, [learnerId, queryClient]);

  // Realtime subscription for conversation updates
  useEffect(() => {
    if (!learnerId || !enabled) return;

    const channel = supabase
      .channel(`learner-conversations:${learnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `learner_id=eq.${learnerId}`
        },
        (payload) => {
          const updatedConv = payload.new as any;

          // CRITICAL: Ignore updates for conversations that were deleted
          // This prevents re-fetching deleted conversations back into the cache
          if (updatedConv.deleted_by_learner || updatedConv.deleted_by_recruiter) {
            return; // Don't refetch
          }

          // Invalidate and refetch to get updated data
          queryClient.invalidateQueries({
            queryKey: queryKeys.learner.conversations.byLearner(learnerId || 'none', 'learner_recruiter'),
            refetchType: 'active' // Only refetch if query is active
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `learner_id=eq.${learnerId}`
        },
        () => {
          // New conversation - immediately refetch
          refetch();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [learnerId, enabled, refetch, queryClient]);

  // Return conversations directly from query - React Query handles reactivity
  return {
    conversations,
    isLoading,
    error,
    refetch,
    clearUnreadCount
  };
};

