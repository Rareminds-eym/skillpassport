import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import MessageService from '../services/messageService';

/**
 * Hook to get total unread messages count for recruiter sidebar badge
 */
export const useUnreadMessagesCount = (recruiterId: string | undefined) => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['recruiter-unread-count', recruiterId],
    queryFn: async () => {
      if (!recruiterId) return 0;
      
      try {
        // Fetch all active conversations (not archived)
        const conversations = await MessageService.getUserConversations(
          recruiterId,
          'recruiter',
          false
        );
        
        // Sum up all unread counts
        return conversations.reduce(
          (sum, conv) => sum + (conv.recruiter_unread_count || 0),
          0
        );
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
        return 0;
      }
    },
    enabled: !!recruiterId,
    staleTime: 10000, // Cache for 10 seconds (shorter to pick up changes faster)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: false, // Rely on real-time updates
    refetchOnWindowFocus: true,
  });

  // Subscribe to conversation updates - this ensures sidebar updates even when not on Messages page
  useEffect(() => {
    if (!recruiterId || subscriptionRef.current) return;
    
    subscriptionRef.current = MessageService.subscribeToUserConversations(
      recruiterId,
      'recruiter',
      () => {
        // Invalidate the unread count query to trigger refetch
        queryClient.invalidateQueries({ 
          queryKey: ['recruiter-unread-count', recruiterId],
          refetchType: 'active'
        });
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [recruiterId, queryClient]);
  
  return { unreadCount };
};
