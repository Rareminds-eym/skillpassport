import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState, useMemo } from 'react';
import { getWSClient } from '@/shared/api/wsRealtimeClient';

import MessageService from '@/shared/api/messageService';
import type { Message } from '@/shared/api/messageService';
import { queryKeys } from '@/shared/lib/queryKeys';

import { useMessageStore } from '@/shared/model/useMessageStore';

interface UseLearnerMessagesOptions {
  learnerId: string | null;
  conversationId?: string | null;
  enabled?: boolean;
  enableRealtime?: boolean;
}

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
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages, setMessages]);

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

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    refetch
  };
};

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
    refetchInterval: 60000,
    staleTime: 30000
  });

  useEffect(() => {
    if (!learnerId || !enabled) return;

    const wsClient = getWSClient();
    const unsubInsert = wsClient.subscribe('messages', {
      event: 'INSERT',
      filter: `receiver_id=eq.${learnerId}`
    }, () => {
      useMessageStore.getState().incrementUnreadCount();
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
  }, [learnerId, enabled]);

  return { unreadCount, isLoading };
};

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
        const convs = await MessageService.getUserConversations(
          learnerId,
          'learner',
          false,
          true,
          'learner_recruiter'
        );
        return convs;
      } finally {
        setIsLoadingConversations(false);
      }
    },
    enabled: enabled && !!learnerId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    retry: 1
  });

  const clearUnreadCount = useCallback((conversationId: string) => {
    const currentConversations = queryClient.getQueryData<any[]>(
      queryKeys.learner.conversations.byLearner(learnerId || 'none', 'learner_recruiter')
    ) || [];

    const optimisticConversations = currentConversations.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, learner_unread_count: 0 };
      }
      return conv;
    });

    queryClient.setQueryData(
      queryKeys.learner.conversations.byLearner(learnerId || 'none', 'learner_recruiter'),
      optimisticConversations
    );
  }, [learnerId, queryClient]);

  useEffect(() => {
    if (!learnerId || !enabled) return;

    const wsClient = getWSClient();
    const unsubUpdate = wsClient.subscribe('conversations', {
      event: 'UPDATE',
      filter: `learner_id=eq.${learnerId}`
    }, (event) => {
      if (event.type === 'change') {
        const updatedConv = event.payload as any;
        if (updatedConv.deleted_by_learner || updatedConv.deleted_by_recruiter) return;
        queryClient.invalidateQueries({
          queryKey: queryKeys.learner.conversations.byLearner(learnerId || 'none', 'learner_recruiter'),
          refetchType: 'active'
        });
      }
    });

    const unsubInsert = wsClient.subscribe('conversations', {
      event: 'INSERT',
      filter: `learner_id=eq.${learnerId}`
    }, () => {
      refetch();
    });

    return () => {
      unsubUpdate();
      unsubInsert();
    };
  }, [learnerId, enabled, refetch, queryClient]);

  return {
    conversations,
    isLoading,
    error,
    refetch,
    clearUnreadCount
  };
};
