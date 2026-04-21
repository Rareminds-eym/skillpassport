/**
 * Admin-specific messaging hook
 * Convenience wrapper around useMessages for admin roles
 * Supports school_admin, college_admin, and university_admin
 */

import { useMessages, type UseMessagesOptions, type UseMessagesReturn } from './useMessages';
import type { AdminRole } from '../api/types';

/**
 * Hook for admin messaging functionality
 * 
 * @param adminId - The admin's user ID
 * @param adminRole - The specific admin role (school_admin, college_admin, university_admin)
 * @param options - Optional configuration (omit userId and userRole)
 * @returns Messaging data, loading states, mutations, and errors
 * 
 * @example
 * const { messages, sendMessage, conversations } = useAdminMessages(
 *   'admin-123',
 *   'college_admin',
 *   {
 *     conversationId: 'conv-456',
 *     enableRealtime: true
 *   }
 * );
 */
export function useAdminMessages(
    adminId: string,
    adminRole: AdminRole,
    options?: Omit<UseMessagesOptions, 'userId' | 'userRole'>
): UseMessagesReturn {
    return useMessages({
        userId: adminId,
        userRole: adminRole,
        ...options,
    });
}
