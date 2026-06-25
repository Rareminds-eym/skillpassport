import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageMutationService, MessageQueryService } from '../api';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-conversation-mutations');

/**
 * Consolidated feature-level hook for all conversation mutations
 * Handles conversation creation and message sending with cache invalidation
 */
export function useConversationMutations() {
  const queryClient = useQueryClient();

  const createLearnerAdminConversationMutation = useMutation({
    mutationFn: async (params: { learnerId: string; schoolId: string; subject?: string }) => {
      const conversation = await MessageMutationService.getOrCreateLearnerAdminConversation(params);
      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      MessageQueryService.clearConversationCache();
    },
    onError: (error) => {
      logger.error('Failed to create learner-admin conversation', error);
    }
  });

  const createLearnerCollegeAdminConversationMutation = useMutation({
    mutationFn: async (params: { learnerId: string; collegeId: string; subject?: string }) => {
      const conversation = await MessageMutationService.getOrCreateLearnerCollegeAdminConversation(params);
      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      MessageQueryService.clearConversationCache();
    },
    onError: (error) => {
      logger.error('Failed to create learner-college-admin conversation', error);
    }
  });

  const createLearnerEducatorConversationMutation = useMutation({
    mutationFn: async (params: { learnerId: string; educatorId: string; classId?: string; subject?: string }) => {
      const conversation = await MessageMutationService.getOrCreateLearnerEducatorConversation(params);
      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      MessageQueryService.clearConversationCache();
    },
    onError: (error) => {
      logger.error('Failed to create learner-educator conversation', error);
    }
  });

  const archiveConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await MessageMutationService.archiveConversation(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      MessageQueryService.clearConversationCache();
    },
    onError: (error) => {
      logger.error('Failed to archive conversation', error);
    }
  });

  const unarchiveConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await MessageMutationService.unarchiveConversation(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      MessageQueryService.clearConversationCache();
    },
    onError: (error) => {
      logger.error('Failed to unarchive conversation', error);
    }
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (params: { conversationId: string; userId: string; userType: string }) => {
      await MessageMutationService.deleteConversationForUser(params.conversationId, params.userId, params.userType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      MessageQueryService.clearConversationCache();
    },
    onError: (error) => {
      logger.error('Failed to delete conversation', error);
    }
  });

  return {
    createLearnerAdminConversation: createLearnerAdminConversationMutation.mutateAsync,
    createLearnerCollegeAdminConversation: createLearnerCollegeAdminConversationMutation.mutateAsync,
    createLearnerEducatorConversation: createLearnerEducatorConversationMutation.mutateAsync,
    archiveConversation: archiveConversationMutation.mutateAsync,
    unarchiveConversation: unarchiveConversationMutation.mutateAsync,
    deleteConversation: deleteConversationMutation.mutateAsync,

    // Return mutation states
    createLearnerAdminConversationMutation,
    createLearnerCollegeAdminConversationMutation,
    createLearnerEducatorConversationMutation,
    archiveConversationMutation,
    unarchiveConversationMutation,
    deleteConversationMutation
  };
}
