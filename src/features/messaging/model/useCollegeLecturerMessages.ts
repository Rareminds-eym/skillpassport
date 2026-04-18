import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { MessageService } from '@/features/messaging';
import { queryKeys } from '@/shared/lib/queryKeys';

/**
 * Hook for managing messages in a college lecturer conversation
 */
export const useCollegeLecturerMessages = ({ 
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
    queryKey: queryKeys.college.lecturer.messages(conversationId),
    queryFn: async () => {
      console.log('🔍 [College-Lecturer-Messages] === FETCH MESSAGES START ===');
      console.log('📋 Conversation ID:', conversationId);
      
      if (!conversationId) {
        console.log('❌ [College-Lecturer-Messages] No conversation ID provided');
        return [];
      }
      
      console.log('🚀 [College-Lecturer-Messages] Calling MessageService.getConversationMessages...');
      try {
        const fetchedMessages = await MessageService.getConversationMessages(conversationId, { useCache: true });
        console.log('✅ [College-Lecturer-Messages] Messages fetched successfully:', {
          count: fetchedMessages?.length || 0,
          conversationId,
          messages: fetchedMessages
        });
        
        if (fetchedMessages && fetchedMessages.length > 0) {
          console.log('📨 [College-Lecturer-Messages] Sample message:', fetchedMessages[0]);
          console.log('🔍 [College-Lecturer-Messages] All message sender/receiver types:', 
            fetchedMessages.map(msg => ({
              id: msg.id,
              sender_type: msg.sender_type,
              receiver_type: msg.receiver_type,
              text: msg.message_text?.substring(0, 30) + '...'
            }))
          );
        } else {
          console.log('⚠️ [College-Lecturer-Messages] No messages found for conversation:', conversationId);
        }
        
        return fetchedMessages;
      } catch (error) {
        console.error('❌ [College-Lecturer-Messages] Error fetching messages:', error);
        throw error;
      } finally {
        console.log('🏁 [College-Lecturer-Messages] === FETCH MESSAGES END ===');
      }
    },
    enabled: !!conversationId && enabled,
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Subscribe to real-time message updates
  useEffect(() => {
    console.log('🔄 [College-Lecturer-Messages] Setting up realtime subscription:', {
      conversationId,
      enableRealtime,
      hasConversationId: !!conversationId
    });
    
    if (!conversationId || !enableRealtime) {
      console.log('⏭️ [College-Lecturer-Messages] Skipping realtime setup - missing requirements');
      return;
    }

    const subscription = MessageService.subscribeToConversation(
      conversationId,
      (newMessage) => {
        console.log('📨 [College-Lecturer-Messages] New message received via realtime:', newMessage);
        
        // Add message to cache optimistically
        queryClient.setQueryData(queryKeys.college.lecturer.messages(conversationId), (oldMessages) => {
          console.log('🔄 [College-Lecturer-Messages] Updating cache with new message:', {
            oldCount: oldMessages?.length || 0,
            newMessageId: newMessage.id
          });
          
          if (!oldMessages) return [newMessage];
          
          // Check if message already exists (prevent duplicates)
          const exists = oldMessages.some(msg => msg.id === newMessage.id);
          if (exists) {
            console.log('⚠️ [College-Lecturer-Messages] Message already exists in cache, skipping');
            return oldMessages;
          }
          
          const updatedMessages = [...oldMessages, newMessage];
          console.log('✅ [College-Lecturer-Messages] Cache updated, new count:', updatedMessages.length);
          return updatedMessages;
        });

        // Update conversation list with new message preview
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.college.lecturer.all,
          refetchType: 'active'
        });
      }
    );

    console.log('✅ [College-Lecturer-Messages] Realtime subscription established');
    
    return () => {
      console.log('🔌 [College-Lecturer-Messages] Cleaning up realtime subscription');
      subscription.unsubscribe();
    };
  }, [conversationId, enableRealtime, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      senderId, 
      senderType, 
      receiverId, 
      receiverType, 
      messageText, 
      programSectionId,
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
        null, // classId (not used for college)
        subject,
        null, // attachments
        programSectionId // program section context
      );
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.college.lecturer.messages(conversationId) });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['college-lecturer-messages', conversationId]);

      // Optimistically add the message
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        conversation_id: conversationId,
        sender_id: variables.senderId,
        sender_type: variables.senderType,
        receiver_id: variables.receiverId,
        receiver_type: variables.receiverType,
        message_text: variables.messageText,
        program_section_id: variables.programSectionId,
        subject: variables.subject,
        is_read: false,
        created_at: new Date().toISOString(),
        _optimistic: true
      };

      queryClient.setQueryData(queryKeys.college.lecturer.messages(conversationId), (old) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { previousMessages, optimisticMessage };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['college-lecturer-messages', conversationId], context.previousMessages);
      }
      console.error('❌ [College-Lecturer] Failed to send message:', err);
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData(queryKeys.college.lecturer.messages(conversationId), (old) => {
        if (!old) return [data];
        return old.map(msg => 
          msg.id === context?.optimisticMessage?.id ? data : msg
        );
      });

      // Update conversation list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.college.lecturer.all,
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
 * Hook for sending college lecturer messages
 * Convenience method for college lecturer messaging
 */
export const useCollegeLecturerSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      conversationId,
      senderId, 
      senderType, 
      receiverId, 
      receiverType, 
      messageText, 
      programSectionId,
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
        subject,
        null, // attachments
        programSectionId
      );
    },
    onSuccess: (data, variables) => {
      // Update message cache
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.college.lecturer.messages(variables.conversationId),
        refetchType: 'active'
      });

      // Update conversation list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.college.lecturer.all,
        refetchType: 'active'
      });
    },
    onError: (error) => {
      console.error('❌ [College-Lecturer] Failed to send message:', error);
    }
  });
};