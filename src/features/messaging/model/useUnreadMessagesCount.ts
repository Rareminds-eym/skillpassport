import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getLogger } from '@/shared/config/logging';
import { MessageService } from '@/features/messaging';
import { queryKeys } from '@/shared/lib/queryKeys';

const logger = getLogger('UseUnreadMessagesCount');

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Please use the `unreadCount` from the unified messaging hooks instead.
 * 
 * @see {@link useLearnerMessages}, {@link useEducatorMessages}, {@link useRecruiterMessages}
 */
export const useUnreadMessagesCount = (recruiterId: string | undefined) => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: queryKeys.recruiter.messages.unread(recruiterId),
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
        logger.error('Failed to fetch unread count', error as Error);
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
          queryKey: queryKeys.recruiter.messages.unread(recruiterId),
          refetchType: 'active'
        });
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [recruiterId, queryClient]);
  
  return { unreadCount };
};
