import { useQuery, useQueryClient } from '@tanstack/react-query';
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

  // Map plan_type to plan ID - now matches database plan_code
  const planTypeMap = {
    'basic': 'basic',
    'professional': 'professional',
    'pro': 'professional',
    'enterprise': 'enterprise',
    'ecosystem': 'ecosystem'
  };

  const planType = data.plan_type?.toLowerCase() || data.plan_code?.toLowerCase() || 'basic';
  const planId = planTypeMap[planType] || planType;

  return {
    id: data.id, // Subscription ID for cancellation
    plan: planId,
    status: data.status,
    startDate: data.subscription_start_date,
    endDate: data.subscription_end_date,
    features: data.features || [], // Features will be fetched from plans API
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
    // role column uses user_role enum type with values like school_admin, college_student, etc.
    userRole: data.users?.role || null,
    // Organization license fields
    isOrganizationLicense: data.is_organization_license || false,
    organizationId: data.organization_id || null,
    organizationType: data.organization_type || null,
    licenseAssignmentId: data.license_assignment_id || null,
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

  // Check if the query can run
  const isQueryEnabled = !!user;

  const query = useQuery({
    queryKey: [SUBSCRIPTION_QUERY_KEY, user?.id],
    queryFn: () => fetchSubscription(user?.id),
    enabled: isQueryEnabled, // Only fetch when user is authenticated
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

  // Check if subscription has valid access (active, paused, or cancelled but not expired)
  const hasValidSubscriptionAccess = useMemo(() => {
    if (!query.data) return false;
    const status = query.data.status;
    if (status === 'active' || status === 'paused') return true;
    if (status === 'cancelled' && query.data.endDate) {
      return new Date(query.data.endDate) >= new Date();
    }
    return false;
  }, [query.data]);

  const hasActiveOrPausedSubscription = useMemo(
    () => query.data && isActiveOrPaused(query.data.status),
    [query.data]
  );

  return {
    subscriptionData: query.data,
    // loading is true if:
    // 1. The query is loading (initial fetch)
    // 2. The query is pending (not yet enabled - waiting for user)
    // This prevents premature redirects when user is not yet available
    loading: query.isLoading || query.isPending || !isQueryEnabled,
    error: query.error,
    isRefetching: query.isRefetching,
    hasActiveSubscription,
    hasActiveOrPausedSubscription,
    hasValidSubscriptionAccess,
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

