import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { prefetchSubscriptionData } from '../../hooks/Subscription/useSubscriptionQuery';
import { queryLogger } from '../../utils/queryLogger';

/**
 * Subscription Prefetch Component
 * Automatically prefetches subscription data when user is authenticated
 * Place this component at the app level (in App.tsx or layout)
 */
const SubscriptionPrefetch = () => {
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();
  const hasPrefetchedRef = useRef(false);

  useEffect(() => {
    if (user?.id && !hasPrefetchedRef.current) {
      // Check if data is already cached
      const cachedData = queryClient.getQueryData(['subscription', user.id]);

      if (!cachedData) {
        // Only prefetch if not already cached
        const timer = setTimeout(() => {
          queryLogger.log('🚀 [Prefetch] Prefetching subscription data for user:', user.id);
          prefetchSubscriptionData(queryClient, user.id);
          hasPrefetchedRef.current = true;
        }, 1000); // Increased delay to 1 second

        return () => clearTimeout(timer);
      } else {
        queryLogger.log('📦 [Prefetch] Using cached subscription data');
        hasPrefetchedRef.current = true;
      }
    }

    // Reset flag when user changes
    if (!user) {
      hasPrefetchedRef.current = false;
    }
  }, [user?.id, queryClient]);

  // This component doesn't render anything
  return null;
};

export default SubscriptionPrefetch;
