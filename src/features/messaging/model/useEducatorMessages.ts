/**
 * Educator-specific messaging hook
 * Convenience wrapper around useMessages for educator role
 */

import { useMessages, type UseMessagesOptions, type UseMessagesReturn } from './useMessages';

/**
 * Hook for educator messaging functionality
 * 
 * @param educatorId - The educator's user ID
 * @param options - Optional configuration (omit userId and userRole)
 * @returns Messaging data, loading states, mutations, and errors
 * 
 * @example
 * const { messages, sendMessage, conversations } = useEducatorMessages('educator-123', {
 *   conversationId: 'conv-456',
 *   enableRealtime: true
 * });
 */
export function useEducatorMessages(
    educatorId: string,
    options?: Omit<UseMessagesOptions, 'userId' | 'userRole'>
): UseMessagesReturn {
    return useMessages({
        userId: educatorId,
        userRole: 'educator',
        ...options,
    });
}
