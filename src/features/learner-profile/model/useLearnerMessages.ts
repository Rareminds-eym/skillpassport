/**
 * Consolidated Learner Messages Hook
 * 
 * Consolidates:
 * - useLearnerMessages
 * - useLearnerMessageNotifications
 * - useLearnerEducatorMessages
 * - useLearnerAdminMessages
 * - useLearnerCollegeAdminMessages
 * - useLearnerCollegeLecturerMessages
 * 
 * Returns: messages, notifications, conversations (all types)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { MessageService, Message } from '@/features/messaging';
import { useMessageStore } from '@/shared/model/useMessageStore';
import { supabase } from '@/shared/api/supabaseClient';
import { queryKeys } from '@/shared/lib/queryKeys';

export interface UseLearnerMessagesOptions {
  learnerId: string | null;
  conversationId?: string | null;
  conversationType?: 'all' | 'learner_recruiter' | 'learner_educator' | 'learner_admin' | 'learner_college_admin' | 'learner_college_educator';
  enabled?: boolean;
  enableRealtime?: boolean;
  enableNotifications?: boolean;
}

export interface Conversation {
  id: string;
  conversation_type: string;
  learner_id: string;
  recruiter_id?: string;
  educator_id?: string;
  admin_id?: string;
  last_message_at: string;
  last_message_text: string;
  learner_unread_count: number;
  created_at: string;
}

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
  conversationType = 'all',
  enabled = true,
  enableRealtime = true,
  enableNotifications = false
}: UseLearnerMessagesOptions) => {
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
    queryKey: queryKeys.learner.conversations.byLearner(learnerId || 'none', conversationType),
    queryFn: async () => {
      if (!learnerId) return [];

      const allConversations = await MessageService.getUserConversations(
        learnerId,
        'learner',
        false,
        true,
        conversationType === 'all' ? undefined : conversationType
      );

      return allConversations;
    },
    enabled: enabled && !!learnerId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    retry: 1
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.learner.unread.count(learnerId || 'none'),
    queryFn: async () => {
      if (!learnerId) return 0;
      const count = await MessageService.getUnreadCount(learnerId, 'learner');
      setUnreadCount(count);
      return count;
    },
    enabled: enabled && !!learnerId,
    refetchInterval: 60000,
    staleTime: 30000
  });

  // Realtime subscription for conversation messages
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
          addMessage(newMessage);
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
    if (!learnerId || !enabled || !enableRealtime) return;

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
          incrementUnreadCount();
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
          if (updatedMessage.is_read && !(payload.old as Message).is_read) {
            useMessageStore.getState().decrementUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [learnerId, enabled, enableRealtime, incrementUnreadCount]);

  // Realtime subscription for conversations
  useEffect(() => {
    if (!learnerId || !enabled || !enableRealtime) return;

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

          if (updatedConv.deleted_by_learner || updatedConv.deleted_by_recruiter) {
            return;
          }

          queryClient.invalidateQueries({
            queryKey: queryKeys.learner.conversations.byLearner(learnerId || 'none', conversationType),
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
          filter: `learner_id=eq.${learnerId}`
        },
        () => {
          refetchConversations();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [learnerId, enabled, enableRealtime, conversationType, refetchConversations, queryClient]);

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
      senderType: 'learner' | 'recruiter' | 'educator' | 'admin';
      receiverId: string;
      receiverType: 'learner' | 'recruiter' | 'educator' | 'admin';
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
      await queryClient.cancelQueries({ queryKey: queryKeys.learner.messages.conversation(conversationId!) });

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
      queryKeys.learner.conversations.byLearner(learnerId || 'none', conversationType)
    ) || [];

    const optimisticConversations = currentConversations.map(conv => {
      if (conv.id === convId) {
        return { ...conv, learner_unread_count: 0 };
      }
      return conv;
    });

    queryClient.setQueryData(
      queryKeys.learner.conversations.byLearner(learnerId || 'none', conversationType),
      optimisticConversations
    );
  }, [learnerId, conversationType, queryClient]);

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
    recruiterConversations: getConversationsByType('learner_recruiter'),
    educatorConversations: getConversationsByType('learner_educator'),
    adminConversations: getConversationsByType('learner_admin'),
    collegeAdminConversations: getConversationsByType('learner_college_admin'),
    collegeLecturerConversations: getConversationsByType('learner_college_educator'),

    // Notifications
    unreadCount,

    // Loading states
    loading: isLoadingMessages || isLoadingConversations,
    error: messagesError || conversationsError
  };
};
