import { useEffect, useCallback } from 'react';
import { MessageService, Message } from '@/features/messaging';
import { useMessageStore } from '@/shared/model/useMessageStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/queryKeys';
import { getWSClient } from '@/shared/api/wsRealtimeClient';

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

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages, setMessages]);

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

  useEffect(() => {
    if (!conversationId || !enabled || !enableRealtime) return;

    const wsClient = getWSClient();
    const unsubInsert = wsClient.subscribe('messages', {
      event: 'INSERT',
      filter: `conversation_id=eq.${conversationId}`
    }, (event) => {
      if (event.type === 'change') {
        const newMessage = event.payload as Message;
        addMessage(newMessage);
        queryClient.invalidateQueries({
          queryKey: queryKeys.learner.messages.conversation(conversationId),
          refetchType: 'none'
        });
      }
    });

    const unsubUpdate = wsClient.subscribe('messages', {
      event: 'UPDATE',
      filter: `conversation_id=eq.${conversationId}`
    }, (event) => {
      if (event.type === 'change') {
        const updatedMessage = event.payload as Message;
        useMessageStore.getState().updateMessage(updatedMessage.id, updatedMessage);
      }
    });

    return () => {
      unsubInsert();
      unsubUpdate();
    };
  }, [conversationId, enabled, enableRealtime, addMessage, queryClient]);

  useEffect(() => {
    if (!learnerId || !enabled || !enableRealtime) return;

    const wsClient = getWSClient();
    const unsubInsert = wsClient.subscribe('messages', {
      event: 'INSERT',
      filter: `receiver_id=eq.${learnerId}`
    }, () => {
      incrementUnreadCount();
    });

    const unsubUpdate = wsClient.subscribe('messages', {
      event: 'UPDATE',
      filter: `receiver_id=eq.${learnerId}`
    }, (event) => {
      if (event.type === 'change') {
        const updatedMessage = event.payload as Message;
        if (updatedMessage.is_read && updatedMessage.receiver_id === learnerId) {
          useMessageStore.getState().decrementUnreadCount();
        }
      }
    });

    return () => {
      unsubInsert();
      unsubUpdate();
    };
  }, [learnerId, enabled, enableRealtime, incrementUnreadCount]);

  useEffect(() => {
    if (!learnerId || !enabled || !enableRealtime) return;

    const wsClient = getWSClient();
    const unsubUpdate = wsClient.subscribe('conversations', {
      event: 'UPDATE',
      filter: `learner_id=eq.${learnerId}`
    }, (event) => {
      if (event.type === 'change') {
        const updatedConv = event.payload as any;
        if (updatedConv.deleted_by_learner || updatedConv.deleted_by_recruiter) return;
        queryClient.invalidateQueries({
          queryKey: queryKeys.learner.conversations.byLearner(learnerId || 'none', conversationType),
          refetchType: 'active'
        });
      }
    });

    const unsubInsert = wsClient.subscribe('conversations', {
      event: 'INSERT',
      filter: `learner_id=eq.${learnerId}`
    }, () => {
      refetchConversations();
    });

    return () => {
      unsubUpdate();
      unsubInsert();
    };
  }, [learnerId, enabled, enableRealtime, conversationType, refetchConversations, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      senderId, senderType, receiverId, receiverType, messageText,
      applicationId, opportunityId, classId, subject
    }: {
      senderId: string; senderType: 'learner' | 'recruiter' | 'educator' | 'admin';
      receiverId: string; receiverType: 'learner' | 'recruiter' | 'educator' | 'admin';
      messageText: string; applicationId?: number; opportunityId?: number;
      classId?: string; subject?: string;
    }) => {
      if (!conversationId) throw new Error('No conversation selected');
      return await MessageService.sendMessage(
        conversationId, senderId, senderType, receiverId, receiverType,
        messageText, applicationId, opportunityId, classId, subject
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
      if (context?.tempId) removeOptimisticMessage(context.tempId);
      addMessage(realMessage);
    },
    onError: (error, variables, context) => {
      if (context?.tempId) removeOptimisticMessage(context.tempId);
    }
  });

  const clearUnreadCount = useCallback((convId: string) => {
    const currentConversations = queryClient.getQueryData<any[]>(
      queryKeys.learner.conversations.byLearner(learnerId || 'none', conversationType)
    ) || [];

    const optimisticConversations = currentConversations.map(conv => {
      if (conv.id === convId) return { ...conv, learner_unread_count: 0 };
      return conv;
    });

    queryClient.setQueryData(
      queryKeys.learner.conversations.byLearner(learnerId || 'none', conversationType),
      optimisticConversations
    );
  }, [learnerId, conversationType, queryClient]);

  const getConversationsByType = useCallback((type: string) => {
    return conversations.filter(conv => conv.conversation_type === type);
  }, [conversations]);

  return {
    messages,
    isLoadingMessages,
    messagesError,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    refetchMessages,
    conversations,
    isLoadingConversations,
    conversationsError,
    refetchConversations,
    clearUnreadCount,
    recruiterConversations: getConversationsByType('learner_recruiter'),
    educatorConversations: getConversationsByType('learner_educator'),
    adminConversations: getConversationsByType('learner_admin'),
    collegeAdminConversations: getConversationsByType('learner_college_admin'),
    collegeLecturerConversations: getConversationsByType('learner_college_educator'),
    unreadCount,
    loading: isLoadingMessages || isLoadingConversations,
    error: messagesError || conversationsError
  };
};
