/**
 * Conversation actions hook
 * Provides archive, unarchive, delete, and restore operations for conversations
 * Supports role-specific soft delete and archive flags
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '../../../shared/api/messageService';
import { messagesKeys } from '@/shared/lib/queryKeys/messages';
import type { UserRole } from '../api/types';
import { supabase } from '@/shared/api/supabase';

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
// Helper Functions
// ============================================================================

/**
 * Get the role-specific archive column name
 */
function getArchiveColumn(userRole: UserRole): string {
    switch (userRole) {
        case 'student':
            return 'archived_by_student';
        case 'recruiter':
            return 'archived_by_recruiter';
        case 'educator':
        case 'college_educator':
            return 'archived_by_educator';
        case 'school_admin':
        case 'university_admin':
            return 'archived_by_admin';
        case 'college_admin':
            return 'archived_by_college_admin';
        default:
            throw new Error(`Invalid user role: ${userRole}`);
    }
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
 *   userRole: 'student'
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
            const archiveColumn = getArchiveColumn(userRole);

            const { error } = await supabase
                .from('conversations')
                .update({
                    [archiveColumn]: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', conversationId);

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate conversations list query
            queryClient.invalidateQueries({
                queryKey: messagesKeys.conversations(userId, userRole),
            });
        },
        onError: (error) => {
            console.error('[useConversationActions] Error archiving conversation:', error);
        },
    });

    // ========================================================================
    // Unarchive Mutation
    // ========================================================================

    const unarchiveMutation = useMutation({
        mutationFn: async (conversationId: string) => {
            const archiveColumn = getArchiveColumn(userRole);

            const { error } = await supabase
                .from('conversations')
                .update({
                    [archiveColumn]: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', conversationId);

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate conversations list query
            queryClient.invalidateQueries({
                queryKey: messagesKeys.conversations(userId, userRole),
            });
        },
        onError: (error) => {
            console.error('[useConversationActions] Error unarchiving conversation:', error);
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
            console.error('[useConversationActions] Error deleting conversation:', error);
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
            console.error('[useConversationActions] Error restoring conversation:', error);
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
