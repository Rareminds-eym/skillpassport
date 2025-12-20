import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import MessageService from '../services/messageService';
import { UICandidate } from './useStudents';

/**
 * Hook to get students from educator conversations
 * This provides the same UICandidate format as useStudents but from conversation data
 */
export function useConversationStudents() {
  const { user } = useAuth();
  const educatorId = user?.id;

  // Fetch active conversations with comprehensive student data
  const { data: activeConversations = [], isLoading: loadingActive, error: errorActive } = useQuery({
    queryKey: ['educator-conversations', educatorId, 'active'],
    queryFn: async () => {
      if (!educatorId) return [];
      const allConversations = await MessageService.getUserConversations(educatorId, 'educator', false);
      return allConversations.filter(conv => conv.conversation_type === 'student_educator');
    },
    enabled: !!educatorId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Fetch archived conversations with comprehensive student data
  const { data: archivedConversations = [], isLoading: loadingArchived, error: errorArchived } = useQuery({
    queryKey: ['educator-conversations', educatorId, 'archived'],
    queryFn: async () => {
      if (!educatorId) return [];
      const allConversations = await MessageService.getUserConversations(educatorId, 'educator', true);
      return allConversations.filter(conv => 
        conv.conversation_type === 'student_educator' && conv.status === 'archived'
      );
    },
    enabled: !!educatorId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Extract and transform students from conversations
  const students = useMemo(() => {
    const allConversations = [...activeConversations, ...archivedConversations];
    return extractStudentsFromConversations(allConversations);
  }, [activeConversations, archivedConversations]);

  // Calculate stats
  const stats = useMemo(() => ({ 
    count: students.length,
    activeConversations: activeConversations.length,
    archivedConversations: archivedConversations.length
  }), [students.length, activeConversations.length, archivedConversations.length]);

  const loading = loadingActive || loadingArchived;
  const error = errorActive || errorArchived;

  return {
    students,
    loading,
    error: error ? (error as Error).message : null,
    stats,
    refetch: () => {
      // This will be handled by the query invalidation in the Communication component
    }
  };
}