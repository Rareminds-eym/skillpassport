import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MessageService from '../services/messageService';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook for managing educator-admin messages
 * Similar to useEducatorMessages but for educator-admin conversations
 */
export const useEducatorAdminMessages = ({ conversationId, enabled = true }) => {
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  // Fetch messages for the conversation
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['educator-admin-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return MessageService.getConversationMessages(conversationId, { useCache: false });
    },
    enabled: enabled && !!conversationId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Send message function
  const sendMessage = useCallback(
    async ({ senderId, senderType, receiverId, receiverType, messageText, subject }) => {
      if (!conversationId || !senderId || !receiverId || !messageText?.trim()) {
        throw new Error('Missing required fields for message');
      }

      setIsSending(true);

      try {
        console.log('📤 Sending educator-admin message:', {
          conversationId,
          senderId,
          senderType,
          receiverId,
          receiverType,
          messageText: messageText.substring(0, 50) + '...',
          subject,
        });

        const message = await MessageService.sendMessage(
          conversationId,
          senderId,
          senderType,
          receiverId,
          receiverType,
          messageText,
          undefined, // applicationId
          undefined, // opportunityId
          undefined, // classId
          subject
        );

        console.log('✅ Educator-admin message sent:', message);

        // Optimistically update the messages list
        queryClient.setQueryData(['educator-admin-messages', conversationId], (oldMessages) => {
          if (!oldMessages) return [message];
          return [...oldMessages, message];
        });

        // Invalidate and refetch to ensure consistency
        queryClient.invalidateQueries({
          queryKey: ['educator-admin-messages', conversationId],
          refetchType: 'active',
        });

        // Also invalidate conversation lists for both parties
        queryClient.invalidateQueries({
          queryKey: ['educator-conversations'],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['school-admin-conversations'],
          refetchType: 'active',
        });

        return message;
      } catch (error) {
        console.error('❌ Error sending educator-admin message:', error);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, queryClient]
  );

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId || !enabled) return;

    console.log(
      '🔄 Setting up real-time subscription for educator-admin conversation:',
      conversationId
    );

    const subscription = MessageService.subscribeToConversation(conversationId, (newMessage) => {
      console.log('📨 New educator-admin message received:', newMessage);

      // Update messages cache
      queryClient.setQueryData(['educator-admin-messages', conversationId], (oldMessages) => {
        if (!oldMessages) return [newMessage];

        // Check if message already exists to avoid duplicates
        const exists = oldMessages.some((msg) => msg.id === newMessage.id);
        if (exists) return oldMessages;

        return [...oldMessages, newMessage];
      });

      // Invalidate conversation lists to update unread counts
      queryClient.invalidateQueries({
        queryKey: ['educator-conversations'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: ['school-admin-conversations'],
        refetchType: 'active',
      });
    });

    return () => {
      console.log('🔄 Cleaning up educator-admin message subscription');
      subscription.unsubscribe();
    };
  }, [conversationId, enabled, queryClient]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    isSending,
    refetch,
  };
};
