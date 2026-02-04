import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import MessageService from '../services/messageService';

/**
 * Hook for managing college educator ↔ admin conversations
 * Handles both educator and admin perspectives
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
    queryKey: ['college-educator-admin-conversations', userId, userType, collegeId, includeArchived ? 'archived' : 'active'],
    queryFn: async () => {
      if (!userId || !collegeId) return [];

      console.log('🔍 [useCollegeEducatorAdminConversations] Fetching conversations:', {
        userId,
        userType,
        collegeId,
        includeArchived
      });

      let query = supabase
        .from('conversations')
        .select(`
          *,
          college:organizations!conversations_college_id_fkey(id, name, admin_id)
        `)
        .eq('conversation_type', 'college_educator_admin')
        .eq('college_id', collegeId);

      console.log('🔍 [useCollegeEducatorAdminConversations] Query setup complete');

      // Filter by user type and deleted status
      if (userType === 'college_educator') {
        query = query
          .eq('educator_id', userId)
          .eq('deleted_by_educator', false);
      } else if (userType === 'college_admin') {
        // For college admin, we need to check if they're the admin of this college
        query = query.eq('deleted_by_college_admin', false);
      }

      // Filter by archived status
      if (includeArchived) {
        query = query.eq('status', 'archived');
      } else {
        query = query.neq('status', 'archived');
      }

      query = query.order('last_message_at', { ascending: false, nullsFirst: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ [useCollegeEducatorAdminConversations] Error:', error);
        
        // If the conversation type doesn't exist yet, return empty array
        if (error.message?.includes('college_educator_admin') || 
            error.message?.includes('relationship') ||
            error.code === 'PGRST200') {
          console.log('⚠️ [useCollegeEducatorAdminConversations] Conversation type not yet supported, returning empty array');
          return [];
        }
        
        throw error;
      }

      console.log('✅ [useCollegeEducatorAdminConversations] Raw conversations data:', data);
      console.log('✅ [useCollegeEducatorAdminConversations] Conversations loaded:', data?.length || 0);
      
      // If we have conversations, fetch educator details separately
      if (data && data.length > 0) {
        const educatorIds = [...new Set(data.map(conv => conv.educator_id).filter(Boolean))];
        
        if (educatorIds.length > 0) {
          console.log('🔍 [useCollegeEducatorAdminConversations] Fetching educator details for IDs:', educatorIds);
          
          const { data: educatorData, error: educatorError } = await supabase
            .from('college_lecturers')
            .select('id, first_name, last_name, email, department, specialization, user_id')
            .in('id', educatorIds);
          
          if (!educatorError && educatorData) {
            console.log('✅ [useCollegeEducatorAdminConversations] Educator details loaded:', educatorData.length);
            
            // Merge educator data with conversations
            const conversationsWithEducators = data.map(conv => {
              const educator = educatorData.find(edu => edu.id === conv.educator_id);
              return {
                ...conv,
                college_educator: educator || null
              };
            });
            
            console.log('✅ [useCollegeEducatorAdminConversations] Conversations with educator details:', conversationsWithEducators);
            return conversationsWithEducators;
          } else {
            console.error('❌ [useCollegeEducatorAdminConversations] Error fetching educator details:', educatorError);
          }
        }
      }
      
      return data || [];
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

    console.log('🔄 [useCollegeEducatorAdminConversations] Setting up real-time subscription');

    const subscription = MessageService.subscribeToUserConversations(
      userType === 'college_educator' ? userId : collegeId,
      userType,
      (conversation) => {
        // Only handle college educator-admin conversations
        if (conversation.conversation_type !== 'college_educator_admin') return;

        console.log('🔄 [useCollegeEducatorAdminConversations] Real-time update:', conversation);

        // Check if conversation is deleted for current user
        const isDeleted = userType === 'college_educator' 
          ? conversation.deleted_by_educator 
          : conversation.deleted_by_college_admin;

        if (isDeleted) {
          console.log('❌ [useCollegeEducatorAdminConversations] Ignoring deleted conversation:', conversation.id);
          return;
        }

        // Invalidate and refetch conversations
        queryClient.invalidateQueries({ 
          queryKey: ['college-educator-admin-conversations', userId, userType, collegeId],
          refetchType: 'active'
        });
      }
    );

    return () => {
      console.log('🔄 [useCollegeEducatorAdminConversations] Cleaning up subscription');
      subscription.unsubscribe();
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