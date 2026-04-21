import type { UserRole, ConversationType } from '@/shared/types/messaging';

/**
 * Query key factory for messaging system
 * Provides centralized, type-safe query keys for all messaging-related queries
 */
export const messagesKeys = {
    /**
     * Base key for all messaging queries
     */
    all: ['messages'] as const,

    /**
     * Query key for conversation messages
     * @param conversationId - The conversation ID to fetch messages for
     * @returns Query key tuple for React Query
     * 
     * @example
     * queryKeys.messages.conversation('conv-123')
     * // Returns: ['messages', 'conversation', 'conv-123']
     */
    conversation: (conversationId: string | null) =>
        ['messages', 'conversation', conversationId] as const,

    /**
     * Query key for user conversations list
     * @param userId - The user ID
     * @param userRole - The user's role
     * @param conversationType - Optional filter by conversation type ('all' or specific type)
     * @returns Query key tuple for React Query
     * 
     * @example
     * queryKeys.messages.conversations('user-123', 'student', 'student_recruiter')
     * // Returns: ['messages', 'conversations', 'user-123', 'student', 'student_recruiter']
     * 
     * @example
     * queryKeys.messages.conversations('user-123', 'student', 'all')
     * // Returns: ['messages', 'conversations', 'user-123', 'student', 'all']
     */
    conversations: (
        userId: string,
        userRole: UserRole,
        conversationType?: ConversationType | 'all'
    ) =>
        ['messages', 'conversations', userId, userRole, conversationType] as const,

    /**
     * Query key for user unread message count
     * @param userId - The user ID
     * @param userRole - The user's role
     * @returns Query key tuple for React Query
     * 
     * @example
     * queryKeys.messages.unreadCount('user-123', 'student')
     * // Returns: ['messages', 'unreadCount', 'user-123', 'student']
     */
    unreadCount: (userId: string, userRole: UserRole) =>
        ['messages', 'unreadCount', userId, userRole] as const,
} as const;
