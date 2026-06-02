/**
 * Conversation actions hook
 * Provides archive, unarchive, delete, and restore operations for conversations
 * Supports role-specific soft delete and archive flags
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getLogger } from '@/shared/config/logging';
import { MessageService } from '../../../shared/api/messageService';
import { messagesKeys } from '@/shared/lib/queryKeys/messages';
import type { UserRole } from '../api/types';
import { apiPost } from '@/shared/api/apiClient';

const logger = getLogger('UseConversationActions');

// ============================================================================
// Hook Options Interface
// ============================================================================

/**
 * Options for configuring the useConversationActions hook
 */
export interface UseConversationActionsOptions {
    /** User ID for the current user */
    userId: string;

    /** Role of the current user */
    userRole: UserRole;
}

// ============================================================================
// Hook Return Interface
// ============================================================================

/**
 * Return value from useConversationActions hook
 */
export interface UseConversationActionsReturn {
    /** Archive a conversation (set archived_by_{role}=true) */
    archiveConversation: (conversationId: string) => Promise<void>;

    /** Unarchive a conversation (set archived_by_{role}=false) */
    unarchiveConversation: (conversationId: string) => Promise<void>;

    /** Delete a conversation (set deleted_by_{role}=true) */
    deleteConversation: (conversationId: string) => Promise<void>;

    /** Restore a deleted conversation (set deleted_by_{role}=false) */
    restoreConversation: (conversationId: string) => Promise<void>;

    /** Archiving state */
    isArchiving: boolean;

    /** Unarchiving state */
    isUnarchiving: boolean;

    /** Deleting state */
    isDeleting: boolean;

    /** Restoring state */
    isRestoring: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for conversation actions (archive, unarchive, delete, restore)
 * 
 * @param options - Configuration options
 * @returns Conversation action mutations and loading states
 * 
 * @example
 * const { archiveConversation, deleteConversation } = useConversationActions({
 *   userId: 'user-123',
 *   userRole: 'learner'
 * });
 * 
 * await archiveConversation('conv-456');
 * await deleteConversation('conv-789');
 */
export function useConversationActions(
    options: UseConversationActionsOptions
): UseConversationActionsReturn {
    const { userId, userRole } = options;
    const queryClient = useQueryClient();

    // ========================================================================
    // Archive Mutation
    // ========================================================================

    const archiveMutation = useMutation({
        mutationFn: async (conversationId: string) => {
            await apiPost('/messaging/actions', {
                action: 'archive-conversation-for-user',
                conversationId,
                userId,
                userType: userRole,
            });
        },
        onSuccess: () => {
            // Invalidate conversations list query
            queryClient.invalidateQueries({
                queryKey: messagesKeys.conversations(userId, userRole),
            });
        },
        onError: (error) => {
            logger.error('Failed to archive conversation', error as Error);
        },
    });

    // ========================================================================
    // Unarchive Mutation
    // ========================================================================

    const unarchiveMutation = useMutation({
        mutationFn: async (conversationId: string) => {
            await apiPost('/messaging/actions', {
                action: 'unarchive-conversation-for-user',
                conversationId,
                userId,
                userType: userRole,
            });
        },
        onSuccess: () => {
            // Invalidate conversations list query
            queryClient.invalidateQueries({
                queryKey: messagesKeys.conversations(userId, userRole),
            });
        },
        onError: (error) => {
            logger.error('Failed to unarchive conversation', error as Error);
        },
    });

    // ========================================================================
    // Delete Mutation
    // ========================================================================

    const deleteMutation = useMutation({
        mutationFn: async (conversationId: string) => {
            await MessageService.deleteConversationForUser(
                conversationId,
                userId,
                userRole as any // Type assertion needed due to MessageService signature
            );
        },
        onSuccess: () => {
            // Invalidate conversations list query
            queryClient.invalidateQueries({
                queryKey: messagesKeys.conversations(userId, userRole),
            });
        },
        onError: (error) => {
            logger.error('Failed to delete conversation', error as Error);
        },
    });

    // ========================================================================
    // Restore Mutation
    // ========================================================================

    const restoreMutation = useMutation({
        mutationFn: async (conversationId: string) => {
            await MessageService.restoreConversation(
                conversationId,
                userId,
                userRole as any // Type assertion needed due to MessageService signature
            );
        },
        onSuccess: () => {
            // Invalidate conversations list query
            queryClient.invalidateQueries({
                queryKey: messagesKeys.conversations(userId, userRole),
            });
        },
        onError: (error) => {
            logger.error('Failed to restore conversation', error as Error);
        },
    });

    // ========================================================================
    // Return Value
    // ========================================================================

    return {
        archiveConversation: archiveMutation.mutateAsync,
        unarchiveConversation: unarchiveMutation.mutateAsync,
        deleteConversation: deleteMutation.mutateAsync,
        restoreConversation: restoreMutation.mutateAsync,

        isArchiving: archiveMutation.isPending,
        isUnarchiving: unarchiveMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isRestoring: restoreMutation.isPending,
    };
}
