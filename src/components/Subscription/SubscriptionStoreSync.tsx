import { useEffect, useRef } from 'react';
import { useSubscriptionQuery } from '../../hooks/Subscription/useSubscriptionQuery';
import { useSubscriptionStore } from '../../stores/subscriptionStore';

interface SubscriptionData {
  id: string;
  status: 'active' | 'paused' | 'cancelled' | 'trialing' | 'incomplete' | 'past_due' | 'unpaid';
  plan_id: string;
  current_period_end?: string;
  plan?: { name?: string };
}

interface SubscriptionQueryResult {
  subscriptionData?: SubscriptionData;
  loading: boolean;
  error?: string | Error;
  hasActiveSubscription: boolean;
  hasValidSubscriptionAccess: boolean;
}

/**
 * SubscriptionStoreSync Component
 * 
 * Syncs React Query subscription data to Zustand store.
 * This ensures route guards work correctly with the migrated store.
 */
export function SubscriptionStoreSync(): null {
  const queryResult = useSubscriptionQuery() as SubscriptionQueryResult;
  const { 
    subscriptionData, 
    loading, 
    error,
    hasActiveSubscription,
    hasValidSubscriptionAccess 
  } = queryResult;
  
  const setAccessData = useSubscriptionStore((state) => state.setAccessData);
  const initialSyncDone = useRef(false);

  // Immediate sync for loading state - this prevents race conditions
  useEffect(() => {
    if (loading && !initialSyncDone.current) {
      setAccessData({
        isLoading: true,
        isRefetching: true,
      });
    }
  }, [loading, setAccessData]);

  // Full sync when data arrives or loading completes
  useEffect(() => {
    if (loading && !initialSyncDone.current) {
      // Still loading, just update loading state
      setAccessData({
        isLoading: true,
        isRefetching: true,
      });
      return;
    }

    initialSyncDone.current = true;

    if (subscriptionData) {
      // Determine access reason based on status
      let accessReason: 'active' | 'paused' | 'cancelled' | 'no_subscription' = 'no_subscription';
      if (subscriptionData.status === 'active') accessReason = 'active';
      else if (subscriptionData.status === 'paused') accessReason = 'paused';
      else if (subscriptionData.status === 'cancelled') accessReason = 'cancelled';
      
      const hasAccess = hasValidSubscriptionAccess || hasActiveSubscription;
      
      console.log('[SubscriptionStoreSync] Syncing to store:', {
        hasAccess,
        accessReason,
        status: subscriptionData.status,
        hasActiveSubscription,
        hasValidSubscriptionAccess,
      });
      
      setAccessData({
        hasAccess,
        accessReason,
        subscription: {
          id: subscriptionData.id,
          status: subscriptionData.status,
          plan_type: subscriptionData.plan?.name || subscriptionData.plan_id,
          end_date: subscriptionData.current_period_end,
          was_revoked: false,
        },
        isLoading: false,
        isRefetching: false,
        error: error ? (typeof error === 'string' ? new Error(error) : error as Error) : null,
      });
    } else if (!loading) {
      // No subscription data and not loading = no subscription
      console.log('[SubscriptionStoreSync] No subscription, setting no_subscription');
      setAccessData({
        hasAccess: false,
        accessReason: 'no_subscription',
        subscription: null,
        isLoading: false,
        isRefetching: false,
        error: error ? (typeof error === 'string' ? new Error(error) : error as Error) : null,
      });
    }
  }, [subscriptionData, loading, error, hasActiveSubscription, hasValidSubscriptionAccess, setAccessData]);

  // This component doesn't render anything
  return null;
}

export default SubscriptionStoreSync;
