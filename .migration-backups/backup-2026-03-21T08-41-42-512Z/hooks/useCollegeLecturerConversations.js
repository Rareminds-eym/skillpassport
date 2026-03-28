import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import MessageService from '../services/messageService';

/**
 * Hook for managing college lecturer conversations
 * For college lecturers to view their student conversations
 */
export const useCollegeLecturerConversations = (
  collegeLecturerId, 
  enabled = true,
  includeArchived = false
) => {
  const queryClient = useQueryClient();

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['college-lecturer-conversations', collegeLecturerId || 'none', includeArchived],
    queryFn: async () => {
      if (!collegeLecturerId) return [];
      
      // Get all conversations for this college lecturer
      return await MessageService.getUserConversations(
        collegeLecturerId, 
        'college_educator', 
        includeArchived, // includeArchived
        true,  // useCache
        'student_college_educator' // conversationType filter
      );
    },
    enabled: !!collegeLecturerId && enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!collegeLecturerId || !enabled) return;

    const subscription = MessageService.subscribeToUserConversations(
      collegeLecturerId,
      'college_educator',
      (conversation) => {
        // Only handle student-college lecturer conversations
        if (conversation.conversation_type !== 'student_college_educator') return;
        
        console.log('🔄 [College-Lecturer] Realtime UPDATE detected:', conversation);
        
        // Ignore updates for conversations that were deleted by college educator
        if (conversation.deleted_by_college_educator) {
          console.log('❌ [College-Lecturer] Ignoring UPDATE for deleted conversation:', conversation.id);
          return;
        }
        
        // Invalidate conversation queries
        queryClient.invalidateQueries({ 
          queryKey: ['college-lecturer-conversations', collegeLecturerId],
          refetchType: 'active'
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [collegeLecturerId, enabled, queryClient]);

  // Clear unread count function
  const clearUnreadCount = (conversationId) => {
    queryClient.setQueryData(
      ['college-lecturer-conversations', collegeLecturerId || 'none', includeArchived], 
      (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(conv => 
          conv.id === conversationId 
            ? { ...conv, college_educator_unread_count: 0 }
            : conv
        );
      }
    );
  };

  return {
    conversations,
    isLoading,
    error,
    refetch,
    clearUnreadCount
  };
};

/**
 * Hook for getting students in a college lecturer's program sections
 * Used for creating new conversations
 */
export const useCollegeLecturerStudents = (collegeLecturerId, enabled = true) => {
  const {
    data: students = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['college-lecturer-students', collegeLecturerId || 'none'],
    queryFn: async () => {
      if (!collegeLecturerId) return [];
      
      // Get students from program sections where this lecturer is assigned
      // This would need to be implemented in a service
      // For now, return empty array - will be implemented when needed
      return [];
    },
    enabled: !!collegeLecturerId && enabled,
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    students,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook for creating conversations from college lecturer side
 */
export const useCreateCollegeLecturerConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      studentId, 
      collegeLecturerId, 
      collegeId,
      programSectionId, 
      subject 
    }) => {
      return await MessageService.getOrCreateStudentCollegeLecturerConversation(
        studentId,
        collegeLecturerId,
        collegeId,
        programSectionId,
        subject
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate conversations list to include new conversation
      queryClient.invalidateQueries({ 
        queryKey: ['college-lecturer-conversations', variables.collegeLecturerId],
        refetchType: 'active'
      });
      
      // Also invalidate student conversations if needed
      queryClient.invalidateQueries({ 
        queryKey: ['student-college-lecturer-conversations', variables.studentId],
        refetchType: 'active'
      });
    },
    onError: (error) => {
      console.error('❌ [College-Lecturer] Failed to create conversation:', error);
    }
  });
};

/**
 * Hook for archiving/unarchiving college lecturer conversations
 */
export const useCollegeLecturerConversationActions = (collegeLecturerId) => {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: async (conversationId) => {
      return await MessageService.archiveConversation(conversationId);
    },
    onSuccess: () => {
      // Refetch both active and archived conversations
      queryClient.invalidateQueries({ 
        queryKey: ['college-lecturer-conversations', collegeLecturerId],
        refetchType: 'active'
      });
    }
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (conversationId) => {
      return await MessageService.unarchiveConversation(conversationId);
    },
    onSuccess: () => {
      // Refetch both active and archived conversations
      queryClient.invalidateQueries({ 
        queryKey: ['college-lecturer-conversations', collegeLecturerId],
        refetchType: 'active'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (conversationId) => {
      return await MessageService.deleteConversationForUser(
        conversationId, 
        collegeLecturerId, 
        'college_educator'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['college-lecturer-conversations', collegeLecturerId],
        refetchType: 'active'
      });
    }
  });

  return {
    archiveConversation: archiveMutation.mutateAsync,
    unarchiveConversation: unarchiveMutation.mutateAsync,
    deleteConversation: deleteMutation.mutateAsync,
    isArchiving: archiveMutation.isPending,
    isUnarchiving: unarchiveMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};