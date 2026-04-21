/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Base messaging hook - role-agnostic messaging functionality
 * Consolidates 42 messaging hooks into a single unified implementation
 * 
 * Features:
 * - Role-agnostic operation (supports all UserRole types)
 * - Three-layer cache coordination (MessageService, React Query, Zustand)
 * - Optimistic updates with automatic rollback
 * - Real-time subscriptions with duplicate detection
 * - Type-safe conversation filtering
 * - Comprehensive error handling
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '../api/messageService';
import { useMessageStore } from './useMessageStore';
import { messagesKeys } from '@/shared/lib/queryKeys/messages';
import type {
  UserRole,
  ConversationType,
  Message,
  Conversation,
  SendMessageParams,
  CreateConversationParams,
} from '../api/types';

// ============================================================================
// Hook Options Interface
// ============================================================================

/**
 * Options for configuring the useMessages hook
 */
export interface UseMessagesOptions {
  /** User ID for the current user */
  userId: string;

  /** Role of the current user */
  userRole: UserRole;

  /** Optional conversation ID to fetch messages for */
  conversationId?: string | null;

  /** Optional filter by conversation type ('all' or specific type) */
  conversationType?: ConversationType | 'all';

  /** Enable real-time subscriptions (default: true) */
  enableRealtime?: boolean;

  /** Enable queries (default: true) */
  enabled?: boolean;
}

// ============================================================================
// Hook Return Interface
// ============================================================================

/**
 * Return value from useMessages hook
 */
export interface UseMessagesReturn {
  // Data
  /** Messages in the current conversation */
  messages: Message[];

  /** List of conversations for the user */
  conversations: Conversation[];

  /** Unread message count for the user */
  unreadCount: number;

  // Loading states
  /** Loading state for messages query */
  isLoadingMessages: boolean;

  /** Loading state for conversations query */
  isLoadingConversations: boolean;

  /** Loading state for unread count query */
  isLoadingUnreadCount: boolean;

  // Mutations
  /** Send a message with optimistic updates */
  sendMessage: (params: Omit<SendMessageParams, 'senderId' | 'senderType'>) => Promise<Message>;

  /** Sending state */
  isSending: boolean;

  /** Mark a conversation as read */
  markAsRead: (conversationId: string) => Promise<void>;

  /** Marking as read state */
  isMarkingAsRead: boolean;

  /** Create a new conversation */
  createConversation: (params: Omit<CreateConversationParams, 'userId1'>) => Promise<Conversation>;

  /** Creating conversation state */
  isCreatingConversation: boolean;

  /** Clear unread count for a conversation */
  clearUnreadCount: (conversationId: string) => Promise<void>;

  // Errors
  /** Error from messages query */
  messagesError: Error | null;

  /** Error from conversations query */
  conversationsError: Error | null;

  /** Error from unread count query */
  unreadCountError: Error | null;

  // Refetch functions
  /** Manually refetch messages */
  refetchMessages: () => Promise<void>;

  /** Manually refetch conversations */
  refetchConversations: () => Promise<void>;

  /** Manually refetch unread count */
  refetchUnreadCount: () => Promise<void>;
}

// ============================================================================
// Base Hook Implementation
// ============================================================================

/**
 * Base messaging hook that provides role-agnostic messaging functionality
 * 
 * @param options - Configuration options
 * @returns Messaging data, loading states, mutations, and errors
 * 
 * @example
 * // Student messaging
 * const { messages, sendMessage } = useMessages({
 *   userId: 'student-123',
 *   userRole: 'student',
 *   conversationId: 'conv-456'
 * });
 * 
 * @example
 * // Admin messaging with conversation type filter
 * const { conversations } = useMessages({
 *   userId: 'admin-123',
 *   userRole: 'college_admin',
 *   conversationType: 'student_college_admin'
 * });
 */
export function useMessages(options: UseMessagesOptions): UseMessagesReturn {
  const {
    userId,
    userRole,
    conversationId = null,
    conversationType = 'all',
    enableRealtime = true,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const messageStore = useMessageStore();

  // Track subscription cleanup
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // ========================================================================
  // Queries
  // ========================================================================

  // Messages query - fetch messages for a specific conversation
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessagesQuery,
  } = useQuery({
    queryKey: messagesKeys.conversation(conversationId),
    queryFn: async () => {
      if (!conversationId) return [];

      try {
        const msgs = await MessageService.getConversationMessages(conversationId, {
          useCache: true,
        });

        // Update Zustand store if this is the current conversation
        if (messageStore.currentConversationId === conversationId) {
          messageStore.setMessages(msgs);
        }

        return msgs;
      } catch (error) {
        console.error('[useMessages] Error fetching messages:', error);
        throw error;
      }
    },
    enabled: enabled && !!conversationId,
    staleTime: 60000, // 1 minute
    gcTime: 600000, // 10 minutes
  });

  // Conversations query - fetch user's conversations list
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversationsQuery,
  } = useQuery({
    queryKey: messagesKeys.conversations(userId, userRole, conversationType),
    queryFn: async () => {
      try {
        const convs = await MessageService.getUserConversations(
          userId,
          userRole as any, // Type assertion needed due to MessageService signature
          false, // includeArchived
          true, // useCache
          conversationType === 'all' ? undefined : conversationType
        );

        // Update Zustand store
        messageStore.setConversations(convs);

        return convs;
      } catch (error) {
        console.error('[useMessages] Error fetching conversations:', error);
        throw error;
      }
    },
    enabled: enabled,
    staleTime: 60000, // 1 minute
    gcTime: 600000, // 10 minutes
  });

  // Unread count query - fetch user's unread message count
  const {
    data: unreadCount = 0,
    isLoading: isLoadingUnreadCount,
    error: unreadCountError,
    refetch: refetchUnreadCountQuery,
  } = useQuery({
    queryKey: messagesKeys.unreadCount(userId, userRole),
    queryFn: async () => {
      try {
        const count = await MessageService.getUnreadCount(userId, userRole as any);

        // Update Zustand store
        messageStore.setUnreadCount(count);

        return count;
      } catch (error) {
        console.error('[useMessages] Error fetching unread count:', error);
        throw error;
      }
    },
    enabled: enabled,
    staleTime: 60000, // 1 minute
    gcTime: 600000, // 10 minutes
  });

  // ========================================================================
  // Mutations
  // ========================================================================

  // Send message mutation with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async (params: Omit<SendMessageParams, 'senderId' | 'senderType'>) => {
      const fullParams: SendMessageParams = {
        ...params,
        senderId: userId,
        senderType: userRole,
      };

      // MessageService.sendMessage has individual parameters, not a metadata object
      return await MessageService.sendMessage(
        fullParams.conversationId,
        fullParams.senderId,
        fullParams.senderType as any, // Type assertion needed due to MessageService signature
        fullParams.receiverId,
        fullParams.receiverType as any, // Type assertion needed due to MessageService signature
        fullParams.messageText,
        fullParams.metadata?.applicationId,
        fullParams.metadata?.opportunityId,
        fullParams.metadata?.classId as any,
        undefined, // subject
        fullParams.metadata?.attachments
      );
    },
    onMutate: async (params) => {
      // Check for duplicate sends (within 1 second window)
      const recentMessages = messageStore.messages.filter(
        m =>
          m.sender_id === userId &&
          m.message_text === params.messageText &&
          Date.now() - new Date(m.created_at).getTime() < 1000
      );

      if (recentMessages.length > 0) {
        throw new Error('Duplicate send detected - please wait before sending again');
      }

      // Create optimistic message
      const tempId = messageStore.addOptimisticMessage({
        conversation_id: params.conversationId,
        sender_id: userId,
        sender_type: userRole,
        receiver_id: params.receiverId,
        receiver_type: params.receiverType,
        message_text: params.messageText,
        attachments: params.metadata?.attachments || [],
        application_id: params.metadata?.applicationId,
        opportunity_id: params.metadata?.opportunityId,
        class_id: params.metadata?.classId,
      } as any);

      // Update React Query cache with optimistic message
      queryClient.setQueryData<Message[]>(
        messagesKeys.conversation(params.conversationId),
        (old = []) => {
          const optimisticMsg = messageStore.messages.find(m => m.id === tempId);
          if (!optimisticMsg) return old;

          return [...old, optimisticMsg].sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
      );

      return { tempId };
    },
    onSuccess: (realMessage, _params, context) => {
      // Remove optimistic message
      if (context?.tempId) {
        messageStore.removeOptimisticMessage(context.tempId);
      }

      // Add real message
      messageStore.addMessage(realMessage);

      // Update React Query cache with real message
      queryClient.setQueryData<Message[]>(
        messagesKeys.conversation(realMessage.conversation_id),
        (old = []) => {
          const withoutOptimistic = old.filter(m => m.id !== context?.tempId);
          return [...withoutOptimistic, realMessage].sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
      );

      // Invalidate conversations list (update last message)
      queryClient.invalidateQueries({
        queryKey: messagesKeys.conversations(userId, userRole),
      });

      // Clear MessageService cache
      MessageService.clearMessageCache(realMessage.conversation_id);
    },
    onError: (error, params, context) => {
      console.error('[useMessages] Error sending message:', error);

      // Rollback optimistic update
      if (context?.tempId) {
        messageStore.removeOptimisticMessage(context.tempId);

        queryClient.setQueryData<Message[]>(
          messagesKeys.conversation(params.conversationId),
          (old = []) => old.filter(m => m.id !== context.tempId)
        );
      }
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await MessageService.markConversationAsRead(conversationId, userId);
    },
    onMutate: async (conversationId) => {
      // Optimistically update unread count in cache
      queryClient.setQueryData<number>(
        messagesKeys.unreadCount(userId, userRole),
        (old = 0) => {
          // Find the conversation to get its unread count
          const conversation = conversations.find(c => c.id === conversationId);
          if (!conversation) return old;

          // Get role-specific unread count
          let roleUnreadCount = 0;
          if (userRole === 'student') roleUnreadCount = conversation.student_unread_count;
          else if (userRole === 'recruiter') roleUnreadCount = conversation.recruiter_unread_count;
          else if (userRole === 'educator') roleUnreadCount = conversation.educator_unread_count;
          else if (userRole === 'school_admin' || userRole === 'university_admin') {
            roleUnreadCount = conversation.admin_unread_count || 0;
          } else if (userRole === 'college_admin') {
            roleUnreadCount = conversation.college_admin_unread_count || 0;
          }

          return Math.max(0, old - roleUnreadCount);
        }
      );

      // Update Zustand store
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        let roleUnreadCount = 0;
        if (userRole === 'student') roleUnreadCount = conversation.student_unread_count;
        else if (userRole === 'recruiter') roleUnreadCount = conversation.recruiter_unread_count;
        else if (userRole === 'educator') roleUnreadCount = conversation.educator_unread_count;
        else if (userRole === 'school_admin' || userRole === 'university_admin') {
          roleUnreadCount = conversation.admin_unread_count || 0;
        } else if (userRole === 'college_admin') {
          roleUnreadCount = conversation.college_admin_unread_count || 0;
        }

        messageStore.decrementUnreadCount(roleUnreadCount);
      }
    },
    onSuccess: () => {
      // Invalidate unread count query
      queryClient.invalidateQueries({
        queryKey: messagesKeys.unreadCount(userId, userRole),
      });
    },
    onError: (error) => {
      console.error('[useMessages] Error marking as read:', error);

      // Refetch to get correct count
      queryClient.invalidateQueries({
        queryKey: messagesKeys.unreadCount(userId, userRole),
      });
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (params: Omit<CreateConversationParams, 'userId1'>) => {
      const fullParams: CreateConversationParams = {
        ...params,
        userId1: userId,
      };

      // MessageService.getOrCreateConversation has specific parameters
      return await MessageService.getOrCreateConversation(
        fullParams.userId1,
        fullParams.userId2,
        fullParams.metadata?.applicationId,
        fullParams.metadata?.opportunityId,
        fullParams.metadata?.subject
      );
    },
    onSuccess: () => {
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: messagesKeys.conversations(userId, userRole),
      });

      // Clear MessageService cache
      MessageService.clearConversationCache(userId);
    },
    onError: (error) => {
      console.error('[useMessages] Error creating conversation:', error);
    },
  });

  // ========================================================================
  // Helper Functions
  // ========================================================================

  /**
   * Clear unread count for a conversation (mark as read)
   */
  const clearUnreadCount = useCallback(
    async (conversationId: string) => {
      await markAsReadMutation.mutateAsync(conversationId);
    },
    [markAsReadMutation]
  );

  /**
   * Refetch messages manually
   */
  const refetchMessages = useCallback(async () => {
    await refetchMessagesQuery();
  }, [refetchMessagesQuery]);

  /**
   * Refetch conversations manually
   */
  const refetchConversations = useCallback(async () => {
    await refetchConversationsQuery();
  }, [refetchConversationsQuery]);

  /**
   * Refetch unread count manually
   */
  const refetchUnreadCount = useCallback(async () => {
    await refetchUnreadCountQuery();
  }, [refetchUnreadCountQuery]);

  // ========================================================================
  // Real-time Subscriptions
  // ========================================================================

  useEffect(() => {
    // Only setup subscription if enabled and conversationId provided
    if (!enableRealtime || !conversationId || !enabled) {
      return;
    }

    // Setup real-time subscription
    const subscription = MessageService.subscribeToConversation(
      conversationId,
      (newMessage: Message) => {
        // Check for duplicates
        if (messageStore.isDuplicateMessage(newMessage.id)) {
          return;
        }

        // Update React Query cache
        queryClient.setQueryData<Message[]>(
          messagesKeys.conversation(conversationId),
          (oldMessages = []) => {
            const exists = oldMessages.some(m => m.id === newMessage.id);
            if (exists) return oldMessages;

            return [...oldMessages, newMessage].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          }
        );

        // Update Zustand store if this is the current conversation
        if (messageStore.currentConversationId === conversationId) {
          messageStore.addMessage(newMessage);
        }

        // Update unread count if message is for current user
        if (newMessage.receiver_id === userId && !newMessage.is_read) {
          messageStore.incrementUnreadCount();
          queryClient.invalidateQueries({
            queryKey: messagesKeys.unreadCount(userId, userRole),
          });
        }
      }
    );

    subscriptionRef.current = subscription;

    // Cleanup subscription on unmount or conversationId change
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [conversationId, enableRealtime, enabled, userId, userRole, messageStore, queryClient]);

  // ========================================================================
  // Return Value
  // ========================================================================

  return {
    // Data
    messages,
    conversations,
    unreadCount,

    // Loading states
    isLoadingMessages,
    isLoadingConversations,
    isLoadingUnreadCount,

    // Mutations
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,

    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,

    createConversation: createConversationMutation.mutateAsync,
    isCreatingConversation: createConversationMutation.isPending,

    clearUnreadCount,

    // Errors
    messagesError: messagesError as Error | null,
    conversationsError: conversationsError as Error | null,
    unreadCountError: unreadCountError as Error | null,

    // Refetch functions
    refetchMessages,
    refetchConversations,
    refetchUnreadCount,
  };
}
