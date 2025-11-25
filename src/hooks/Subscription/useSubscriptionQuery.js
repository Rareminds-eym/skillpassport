import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { getActiveSubscription } from '../../services/Subscriptions/subscriptionService';
import { queryLogger } from '../../utils/queryLogger';
import { isActiveOrPaused } from '../../utils/subscriptionHelpers';

/**
 * React Query configuration for subscription
 */
const SUBSCRIPTION_QUERY_KEY = 'subscription';
const STALE_TIME = 2 * 60 * 1000; // 2 minutes
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Format raw subscription data from API
 */
const formatSubscriptionData = (data) => {
  if (!data) return null;

  const planTypeMap = {
    'basic': 'basic',
    'professional': 'pro',
    'enterprise': 'enterprise'
  };

  const planFeatures = {
    basic: [
      'Access to basic skill assessments',
      'Limited profile visibility',
      'Basic analytics',
      'Email support'
    ],
    pro: [
      'All Basic features',
      'Advanced skill assessments',
      'Priority profile visibility',
      'Detailed analytics',
      'Priority support',
      'Personalized recommendations'
    ],
    enterprise: [
      'All Professional features',
      'Custom skill assessments',
      'Premium profile visibility',
      'Advanced analytics',
      '24/7 Premium support',
      'Custom integrations',
      'Dedicated account manager'
    ]
  };

  const planType = data.plan_type?.toLowerCase() || 'basic';
  const planId = planTypeMap[planType] || 'basic';

  return {
    id: data.id, // Subscription ID for cancellation
    plan: planId,
    status: data.status,
    startDate: data.subscription_start_date,
    endDate: data.subscription_end_date,
    features: planFeatures[planId] || [],
    autoRenew: data.auto_renew !== false,
    nextBillingDate: data.subscription_end_date,
    paymentStatus: data.status === 'active' ? 'success' : 'pending',
    planName: data.plan_type,
    planPrice: data.plan_amount,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    billingCycle: data.billing_cycle,
    razorpaySubscriptionId: data.razorpay_subscription_id,
    cancelledAt: data.cancelled_at,
    cancellationReason: data.cancellation_reason,
    // user_role column removed from database - using entity_type from users table instead
    entityType: data.users?.entity_type || null,
    userTableRole: data.users?.role || null
  };
};

/**
 * Fetch subscription data
 */
const fetchSubscription = async (userId) => {
  if (!userId) return null;

  const result = await getActiveSubscription();

  if (result.success && result.data) {
    return formatSubscriptionData(result.data);
  }

  return null;
};

/**
 * Main hook for subscription data with React Query
 * @returns {Object} Subscription query result
 */
export const useSubscriptionQuery = () => {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [SUBSCRIPTION_QUERY_KEY, user?.id],
    queryFn: () => fetchSubscription(user?.id),
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME, // Changed from cacheTime (deprecated in v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Changed from 'always' - only fetch if stale
    retry: 1,
  });

  // Log when data changes (replaces onSuccess) - dev only
  useEffect(() => {
    if (query.data) {
      queryLogger.log('📦 [React Query] Subscription cached:', query.data?.status);
    }
  }, [query.data]);

  // Log errors (replaces onError)
  useEffect(() => {
    if (query.error) {
      queryLogger.error('❌ [React Query] Subscription fetch error:', query.error);
    }
  }, [query.error]);

  // Prefetch subscription data (useful for navigation)
  const prefetchSubscription = async () => {
    if (!user?.id) return;
    
    await queryClient.prefetchQuery({
      queryKey: [SUBSCRIPTION_QUERY_KEY, user.id],
      queryFn: () => fetchSubscription(user.id),
      staleTime: STALE_TIME,
    });
  };

  // Invalidate and refetch subscription
  const refreshSubscription = () => {
    return queryClient.invalidateQueries({
      queryKey: [SUBSCRIPTION_QUERY_KEY, user?.id]
    });
  };

  // Clear subscription cache
  const clearSubscriptionCache = () => {
    queryClient.removeQueries({
      queryKey: [SUBSCRIPTION_QUERY_KEY]
    });
  };

  // Memoize expensive checks
  const hasActiveSubscription = useMemo(
    () => query.data?.status === 'active',
    [query.data?.status]
  );

  const hasActiveOrPausedSubscription = useMemo(
    () => query.data && isActiveOrPaused(query.data.status),
    [query.data]
  );

  return {
    subscriptionData: query.data,
    loading: query.isLoading,
    error: query.error,
    isRefetching: query.isRefetching,
    hasActiveSubscription,
    hasActiveOrPausedSubscription,
    prefetchSubscription,
    refreshSubscription,
    clearSubscriptionCache,
  };
};

/**
 * Prefetch subscription data before navigation
 * Call this when you know user will navigate to subscription pages
 */
export const prefetchSubscriptionData = (queryClient, userId) => {
  if (!userId) return;

  return queryClient.prefetchQuery({
    queryKey: [SUBSCRIPTION_QUERY_KEY, userId],
    queryFn: () => fetchSubscription(userId),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook to get subscription status without triggering fetch
 * Useful for quick checks when data might already be cached
 */
export const useSubscriptionCache = () => {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();

  const cachedData = queryClient.getQueryData([SUBSCRIPTION_QUERY_KEY, user?.id]);

  return {
    subscriptionData: cachedData,
    hasActiveSubscription: cachedData?.status === 'active',
    hasActiveOrPausedSubscription: cachedData && isActiveOrPaused(cachedData.status),
    isCached: !!cachedData,
  };
};

