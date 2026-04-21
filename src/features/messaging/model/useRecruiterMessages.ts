/**
 * Recruiter-specific messaging hook
 * Convenience wrapper around useMessages for recruiter role
 */

import { useMessages, type UseMessagesOptions, type UseMessagesReturn } from './useMessages';

/**
 * Hook for recruiter messaging functionality
 * 
 * @param recruiterId - The recruiter's user ID
 * @param options - Optional configuration (omit userId and userRole)
 * @returns Messaging data, loading states, mutations, and errors
 * 
 * @example
 * const { messages, sendMessage, conversations } = useRecruiterMessages('recruiter-123', {
 *   conversationId: 'conv-456',
 *   enableRealtime: true
 * });
 */
export function useRecruiterMessages(
    recruiterId: string,
    options?: Omit<UseMessagesOptions, 'userId' | 'userRole'>
): UseMessagesReturn {
    return useMessages({
        userId: recruiterId,
        userRole: 'recruiter',
        ...options,
    });
}
