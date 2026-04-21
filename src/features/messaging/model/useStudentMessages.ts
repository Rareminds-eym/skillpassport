/**
 * Student-specific messaging hook
 * Convenience wrapper around useMessages for student role
 */

import { useMessages, type UseMessagesOptions, type UseMessagesReturn } from './useMessages';

/**
 * Hook for student messaging functionality
 * 
 * @param studentId - The student's user ID
 * @param options - Optional configuration (omit userId and userRole)
 * @returns Messaging data, loading states, mutations, and errors
 * 
 * @example
 * const { messages, sendMessage, conversations } = useStudentMessages('student-123', {
 *   conversationId: 'conv-456',
 *   enableRealtime: true
 * });
 */
export function useStudentMessages(
    studentId: string,
    options?: Omit<UseMessagesOptions, 'userId' | 'userRole'>
): UseMessagesReturn {
    return useMessages({
        userId: studentId,
        userRole: 'student',
        ...options,
    });
}
