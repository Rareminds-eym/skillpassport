/**
 * Learner-specific messaging hook
 * Convenience wrapper around useMessages for learner role
 */

import { useMessages, type UseMessagesOptions, type UseMessagesReturn } from './useMessages';

/**
 * Hook for learner messaging functionality
 * 
 * @param learnerId - The learner's user ID
 * @param options - Optional configuration (omit userId and userRole)
 * @returns Messaging data, loading states, mutations, and errors
 * 
 * @example
 * const { messages, sendMessage, conversations } = useLearnerMessages('learner-123', {
 *   conversationId: 'conv-456',
 *   enableRealtime: true
 * });
 */
export function useLearnerMessages(
    learnerId: string,
    options?: Omit<UseMessagesOptions, 'userId' | 'userRole'>
): UseMessagesReturn {
    return useMessages({
        userId: learnerId,
        userRole: 'learner',
        ...options,
    });
}
