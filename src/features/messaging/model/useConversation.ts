/**
 * useConversation - Backward compatibility wrapper
 * 
 * This hook provides backward compatibility for components that used the old
 * useConversation API. It wraps the new useMessages hook and provides the
 * same interface as before.
 * 
 * @deprecated Use useMessages directly for new code
 */

import { useEffect } from 'react';
import { getLogger } from '@/shared/config/logging';
import { useMessages } from './useMessages';
import type { Conversation } from '../api/types';

const logger = getLogger('UseConversation');

interface UseConversationReturn {
    conversation: Conversation | null;
    isLoading: boolean;
    error: Error | null;
    markAsRead: () => Promise<void>;
}

/**
 * Get or create a conversation between two users
 * 
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @param applicationId - Optional application ID
 * @param opportunityId - Optional opportunity ID
 * @param subject - Optional subject
 * @param enabled - Whether to enable the query
 * @returns Conversation data and operations
 */
export function useConversation(
    userId1: string,
    userId2: string,
    applicationId?: number,
    opportunityId?: number,
    subject?: string,
    enabled: boolean = true
): UseConversationReturn {
    // We need to determine the current user's role
    // For backward compatibility, we'll assume the first user is the current user
    // and try to infer the role from the context

    // This is a simplified implementation - in reality, you'd get the current user's role
    // from auth context or props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole: any = 'student'; // Default assumption

    const {
        conversations,
        isLoadingConversations,
        conversationsError,
        createConversation,
        isCreatingConversation,
        markAsRead: markConversationAsRead,
    } = useMessages({
        userId: userId1,
        userRole: userRole,
        enabled,
    });

    // Find existing conversation between the two users
    const conversation = conversations.find(
        (conv) =>
            (conv.student_id === userId1 && conv.recruiter_id === userId2) ||
            (conv.student_id === userId2 && conv.recruiter_id === userId1) ||
            (conv.student_id === userId1 && conv.educator_id === userId2) ||
            (conv.educator_id === userId1 && conv.student_id === userId2)
    ) || null;

    // Auto-create conversation if it doesn't exist and modal is open
    useEffect(() => {
        if (enabled && !conversation && !isLoadingConversations && !isCreatingConversation) {
            createConversation({
                userId2,
                conversationType: 'student_recruiter', // Default - should be determined by user roles
                metadata: {
                    applicationId,
                    opportunityId,
                    subject,
                },
            }).catch((error) => {
                const errorMessage = error?.message || error?.error_description || String(error) || 'Unknown error';
                logger.error('Failed to create conversation', new Error(errorMessage));
            });
        }
    }, [
        enabled,
        conversation,
        isLoadingConversations,
        isCreatingConversation,
        createConversation,
        userId2,
        applicationId,
        opportunityId,
        subject,
    ]);

    const markAsRead = async () => {
        if (conversation) {
            await markConversationAsRead(conversation.id);
        }
    };

    return {
        conversation,
        isLoading: isLoadingConversations || isCreatingConversation,
        error: conversationsError,
        markAsRead,
    };
}
