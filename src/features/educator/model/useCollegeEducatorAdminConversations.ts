import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import MessageService from '@/shared/api/messageService';
import { queryKeys } from '@/shared/lib/queryKeys';

/**
 * Hook for managing college educator-admin conversations
 * Handles both educator and admin perspectives
 * 
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please migrate to the new unified messaging hooks:
 * 
 * **Migration Guide:**
 * ```typescript
 * // Before:
 * import { useCollegeEducatorAdminConversations } from '@/features/educator';
 * const { conversations, isLoading } = useCollegeEducatorAdminConversations({
 *   userId, userType, collegeId, enabled
 * });
 * 
 * // After:
 * import { useEducatorMessages } from '@/features/messaging';
 * const { conversations, isLoadingConversations } = useEducatorMessages(
 *   userId,
 *   { conversationType: 'college_educator_admin', enabled }
 * );
 * ```
 * 
 * @see {@link useEducatorMessages} from @/features/messaging
 */
export const useCollegeEducatorAdminConversations = ({
  userId,
  userType, // 'college_educator' or 'college_admin'
  collegeId,
  includeArchived = false,
  enabled = true
}) => {
  const queryClient = useQueryClient();

  // Fetch conversations based on user type
  const { data: conversations = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.college.admin.conversations.byEducator(userId || '', collegeId || '', includeArchived ? 'archived' : 'active'),
    queryFn: async () => {
      if (!userId || !collegeId) return [];

      const res = await apiPost('/educator/actions', {
        action: 'fetch-educator-conversations',
        userId,
        collegeId,
        userType,
        includeArchived,
      });

      if (!res?.error && Array.isArray(res?.data)) {
        return res.data;
      }

      return [];
    },
    enabled: enabled && !!userId && !!collegeId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled || !userId || !collegeId) return;

    const subscription = MessageService.subscribeToUserConversations(
      userType === 'college_educator' ? userId : collegeId,
      userType,
      (conversation) => {
        // Only handle college educator-admin conversations
        if (conversation.conversation_type !== 'college_educator_admin') return;

        // Check if conversation is deleted for current user
        const isDeleted = userType === 'college_educator' 
          ? conversation.deleted_by_educator 
          : conversation.deleted_by_college_admin;

        if (isDeleted) {
          return;
        }

        // Invalidate and refetch conversations
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.college.admin.conversations.all,
          refetchType: 'active'
        });
      }
    );

    return () => {
      subscription();
    };
  }, [enabled, userId, userType, collegeId, queryClient]);

  return {
    conversations,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook specifically for college educators to get admin conversations
 */
export const useCollegeEducatorAdminConversationsForEducator = ({
  educatorId,
  collegeId,
  includeArchived = false,
  enabled = true
}) => {
  return useCollegeEducatorAdminConversations({
    userId: educatorId,
    userType: 'college_educator',
    collegeId,
    includeArchived,
    enabled
  });
};

/**
 * Hook specifically for college admins to get educator conversations
 */
export const useCollegeEducatorAdminConversationsForAdmin = ({
  adminId,
  collegeId,
  includeArchived = false,
  enabled = true
}) => {
  return useCollegeEducatorAdminConversations({
    userId: adminId,
    userType: 'college_admin',
    collegeId,
    includeArchived,
    enabled
  });
};

export default useCollegeEducatorAdminConversations;