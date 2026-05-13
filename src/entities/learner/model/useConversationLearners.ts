import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UICandidate } from './useLearners';
import { queryKeys } from '@/shared/lib/queryKeys';

interface User {
  id: string;
  email?: string;
}

interface MessageServiceType {
  getUserConversations: (userId: string, userType: string, archived: boolean) => Promise<any[]>;
}

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please use the new unified messaging hooks from @/features/messaging.
 * 
 * @see {@link useLearnerMessages}, {@link useEducatorMessages}, {@link useAdminMessages}
 */
export function useConversationlearners(
  user: User | null,
  messageService: MessageServiceType
) {
  const educatorId = user?.id;

  // Fetch active conversations with comprehensive learner data
  const { data: activeConversations = [], isLoading: loadingActive, error: errorActive } = useQuery({
    queryKey: queryKeys.educator.conversations.byEducator(educatorId || '', 'active'),
    queryFn: async () => {
      if (!educatorId) return [];
      const allConversations = await messageService.getUserConversations(educatorId, 'educator', false);
      return allConversations.filter(conv => conv.conversation_type === 'learner_educator');
    },
    enabled: !!educatorId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Fetch archived conversations with comprehensive learner data
  const { data: archivedConversations = [], isLoading: loadingArchived, error: errorArchived } = useQuery({
    queryKey: queryKeys.educator.conversations.byEducator(educatorId || '', 'archived'),
    queryFn: async () => {
      if (!educatorId) return [];
      const allConversations = await messageService.getUserConversations(educatorId, 'educator', true);
      return allConversations.filter(conv =>
        conv.conversation_type === 'learner_educator' && conv.status === 'archived'
      );
    },
    enabled: !!educatorId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Extract and transform learners from conversations
  const learners = useMemo(() => {
    const allConversations = [...activeConversations, ...archivedConversations];
    return extractlearnersFromConversations(allConversations);
  }, [activeConversations, archivedConversations]);

  // Calculate stats
  const stats = useMemo(() => ({
    count: learners.length,
    activeConversations: activeConversations.length,
    archivedConversations: archivedConversations.length
  }), [learners.length, activeConversations.length, archivedConversations.length]);

  const loading = loadingActive || loadingArchived;
  const error = errorActive || errorArchived;

  return {
    learners,
    loading,
    error: error ? (error as Error).message : null,
    stats,
    refetch: () => {
      // This will be handled by the query invalidation in the Communication component
    }
  };
}