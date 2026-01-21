import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import MessageService from '../services/messageService';

/**
 * Hook for managing college admin conversations with students
 */
export const useCollegeAdminConversations = (collegeAdminId, enabled = true) => {
  const queryClient = useQueryClient();
  const clearUnreadCountRef = useRef(null);

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['college-admin-conversations', collegeAdminId],
    queryFn: async () => {
      if (!collegeAdminId) return [];

      // Get college admin's college_id first
      const { data: collegeData, error: collegeError } = await supabase
        .from('college_lecturers')
        .select('collegeId, college_id')
        .or(`user_id.eq.${collegeAdminId},userId.eq.${collegeAdminId}`)
        .maybeSingle();

      if (collegeError || (!collegeData?.collegeId && !collegeData?.college_id)) {
        // Fallback: check if user is college owner in organizations table
        const { data: ownerData, error: ownerError } = await supabase
          .from('organizations')
          .select('id')
          .eq('organization_type', 'college')
          .eq('admin_id', collegeAdminId)
          .maybeSingle();

        if (ownerError || !ownerData?.id) {
          console.error('Error fetching college admin college:', collegeError);
          return [];
        }

        const collegeId = ownerData.id;

        // Fetch college admin conversations
        const { data: collegeAdminConversations, error: convError } = await supabase
          .from('conversations')
          .select(
            `
            *,
            student:students(id, name, email, university, branch_field),
            college:organizations!college_id(id, name)
          `
          )
          .eq('college_id', collegeId)
          .eq('conversation_type', 'student_college_admin')
          .eq('deleted_by_college_admin', false)
          .order('last_message_at', { ascending: false, nullsFirst: false });

        if (convError) {
          console.error('Error fetching college admin conversations:', convError);
          throw convError;
        }

        return collegeAdminConversations || [];
      }

      const collegeId = collegeData.collegeId || collegeData.college_id;

      // Fetch college admin conversations
      // Note: colleges table doesn't exist - fetch college name from organizations separately
      const { data: collegeAdminConversations, error: convError } = await supabase
        .from('conversations')
        .select(
          `
          *,
          student:students(id, name, email, university, branch_field)
        `
        )
        .eq('college_id', collegeId)
        .eq('conversation_type', 'student_college_admin')
        .eq('deleted_by_college_admin', false)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (convError) {
        console.error('Error fetching college admin conversations:', convError);
        throw convError;
      }

      // Fetch college name from organizations table
      if (collegeAdminConversations && collegeAdminConversations.length > 0) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', collegeId)
          .maybeSingle();

        // Add college info to each conversation
        return collegeAdminConversations.map((conv) => ({
          ...conv,
          college: orgData || null,
        }));
      }

      return collegeAdminConversations || [];
    },
    enabled: !!collegeAdminId && enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!collegeAdminId || !enabled) return;

    const subscription = MessageService.subscribeToUserConversations(
      collegeAdminId,
      'college_admin',
      (conversation) => {
        // Only handle student-college_admin conversations
        if (conversation.conversation_type !== 'student_college_admin') return;

        console.log('🔄 [College Admin] Realtime UPDATE detected:', conversation);

        // Ignore updates for conversations that were deleted
        if (conversation.deleted_by_college_admin) {
          console.log(
            '❌ [College Admin] Ignoring UPDATE for deleted conversation:',
            conversation.id
          );
          return;
        }

        // Invalidate conversation queries
        queryClient.invalidateQueries({
          queryKey: ['college-admin-conversations', collegeAdminId],
          refetchType: 'active',
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [collegeAdminId, enabled, queryClient]);

  // Clear unread count function
  const clearUnreadCount = (conversationId) => {
    queryClient.setQueryData(['college-admin-conversations', collegeAdminId], (oldData) => {
      if (!oldData) return oldData;
      return oldData.map((conv) =>
        conv.id === conversationId ? { ...conv, college_admin_unread_count: 0 } : conv
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
    clearUnreadCount: clearUnreadCountRef.current,
  };
};

/**
 * Hook for managing messages in a college admin conversation
 */
export const useCollegeAdminMessages = ({
  conversationId,
  enabled = true,
  enableRealtime = true,
}) => {
  const queryClient = useQueryClient();

  // Fetch messages
  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['college-admin-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      return await MessageService.getConversationMessages(conversationId, { useCache: true });
    },
    enabled: !!conversationId && enabled,
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId || !enableRealtime) return;

    const subscription = MessageService.subscribeToConversation(conversationId, (newMessage) => {
      console.log('📨 [College Admin] New message received:', newMessage);

      // Add message to cache optimistically
      queryClient.setQueryData(['college-admin-messages', conversationId], (oldMessages) => {
        if (!oldMessages) return [newMessage];

        // Check if message already exists (prevent duplicates)
        const exists = oldMessages.some((msg) => msg.id === newMessage.id);
        if (exists) return oldMessages;

        return [...oldMessages, newMessage];
      });
    });

    return () => {
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
      subject,
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
      await queryClient.cancelQueries({ queryKey: ['college-admin-messages', conversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['college-admin-messages', conversationId]);

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
        _optimistic: true,
      };

      queryClient.setQueryData(['college-admin-messages', conversationId], (old) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { previousMessages, optimisticMessage };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['college-admin-messages', conversationId],
          context.previousMessages
        );
      }
      console.error('❌ [College Admin] Failed to send message:', err);
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic message with real one
      queryClient.setQueryData(['college-admin-messages', conversationId], (old) => {
        if (!old) return [data];
        return old.map((msg) => (msg.id === context?.optimisticMessage?.id ? data : msg));
      });
    },
  });

  return {
    messages,
    isLoading,
    error,
    refetch,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
  };
};
