import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { getActiveSubscription } from '@/features/subscription/api';
import { queryLogger } from '@/shared/lib/debug/queryLogger';
import { isActiveOrPaused } from '@/features/subscription/lib';
import { queryKeys } from '@/shared/lib/queryKeys';

import { useUser } from '@/shared/model/authStore';
/**
 * React Query configuration for subscription
 */
const STALE_TIME = 2 * 60 * 1000; // 2 minutes
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Format raw subscription data from API
 */
const formatSubscriptionData = (data) => {
  if (!data) return null;

  // The database `subscription_plans` is the source of truth for the plan code and name.
  // Fallback to legacy `plan_type` text on the `subscriptions` table only if join data is missing.
  const planId = data.subscription_plans?.plan_code || data.plan_type || data.plan_code;
  const planName = data.subscription_plans?.name || data.plan_type;

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
    planName,
    planPrice: data.plan_amount,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    billingCycle: data.billing_cycle,
    razorpaySubscriptionId: data.razorpay_subscription_id,
    cancelledAt: data.cancelled_at,
    cancellationReason: data.cancellation_reason,
    // role column uses user_role enum type with values like school_admin, learner, etc.
    userRole: data.users?.role || null,
    // Organization license fields
    isOrganizationLicense: data.is_organization_license || false,
    organizationId: data.organization_id || null,
    organizationType: data.organization_type || null,
    licenseAssignmentId: data.license_assignment_id || null,
  };
};

/**
 * Compute access state from subscription data
 * Determines whether the user has platform access, why, and any warnings.
 */
const computeAccessState = (sub) => {
  if (!sub) {
    return {
      hasAccess: false,
      accessReason: 'no_subscription',
      showWarning: false,
      warningType: null,
      warningMessage: null,
      daysUntilExpiry: null,
    };
  }

  const status = sub.status;
  let accessReason = 'no_subscription';
  let hasAccess = false;
  let showWarning = false;
  let warningType = null;
  let warningMessage = null;
  let daysUntilExpiry = null;

  if (status === 'active') {
    accessReason = 'active';
    hasAccess = true;
  } else if (status === 'paused') {
    accessReason = 'paused';
    hasAccess = true;
    showWarning = true;
    warningType = 'paused';
    warningMessage = 'Your subscription is paused. Some features may be limited.';
  } else if (status === 'grace_period') {
    accessReason = 'grace_period';
    hasAccess = true;
    showWarning = true;
    warningType = 'grace_period';
    const endDate = sub.endDate;
    const daysLeft = endDate
      ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    warningMessage = daysLeft != null && daysLeft > 0
      ? `Your subscription is in a grace period. Renew within ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to avoid losing access.`
      : 'Your subscription is in a grace period. Please renew to continue access.';
  } else if (status === 'cancelled') {
    accessReason = 'cancelled';
    const endDate = sub.endDate;
    if (endDate && new Date(endDate) >= new Date()) {
      hasAccess = true;
    }
  }

  // Check expiry warning (for active/paused)
  if (hasAccess) {
    const endDate = sub.endDate;
    if (endDate) {
      const msUntilExpiry = new Date(endDate).getTime() - Date.now();
      daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0 && status === 'active') {
        showWarning = true;
        warningType = 'expiring_soon';
        warningMessage = `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}. Renew now to avoid interruption.`;
      }
    }
  }

  return { hasAccess, accessReason, showWarning, warningType, warningMessage, daysUntilExpiry };
};

/**
 * Fetch subscription data
 * Returns null if no subscription exists (user should be redirected to subscription page)
 */
const fetchSubscription = async (userId) => {
  if (!userId) return null;

  const result = await getActiveSubscription();

  if (result.success && result.data) {
    return formatSubscriptionData(result.data);
  }

  // No subscription found - return null instead of throwing
  // Frontend will handle showing subscription purchase page
  return null;
};

/**
 * Main hook for subscription data with React Query
 * @returns {Object} Subscription query result
 */
export const useSubscriptionQuery = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  // Check if the query can run
  const isQueryEnabled = !!user;

  const query = useQuery({
    queryKey: user?.id ? queryKeys.subscription.data.byOrganization(user.id) : queryKeys.subscription.data.all,
    queryFn: () => fetchSubscription(user?.id),
    enabled: isQueryEnabled,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // ponytail: Only fetch once per session, not on every component mount
    retry: (failureCount, error) => {
      // ponytail: Only retry if no data exists (initial sync after login)
      // If we have data, don't retry - it's cached and fresh
      if (query.data) return false;
      return failureCount < 3; // Max 3 retries for initial load
    },
    retryDelay: (attemptIndex) => {
      // ponytail: Exponential backoff for queue sync - 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
    },
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
      queryKey: queryKeys.subscription.data.byOrganization(user.id),
      queryFn: () => fetchSubscription(user.id),
      staleTime: STALE_TIME,
    });
  };

  // Invalidate and refetch subscription
  const refreshSubscription = () => {
    return queryClient.invalidateQueries({
      queryKey: user?.id ? queryKeys.subscription.data.byOrganization(user.id) : queryKeys.subscription.data.all
    });
  };

  // Clear subscription cache
  const clearSubscriptionCache = () => {
    queryClient.removeQueries({
      queryKey: queryKeys.subscription.all
    });
  };

  // Access state (from computeAccessState)
  const accessState = useMemo(
    () => computeAccessState(query.data),
    [query.data]
  );

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
    // 3. Query is fetching/retrying (covers queue sync delay after login)
    // This prevents premature redirects when subscription is still syncing
    loading: query.isLoading || query.isPending || !isQueryEnabled || query.isFetching,
    error: query.error,
    isRefetching: query.isRefetching,
    hasActiveSubscription,
    hasActiveOrPausedSubscription,
    hasValidSubscriptionAccess,
    // Access state (matches computeAccessState from subscriptionStore)
    hasAccess: accessState.hasAccess,
    accessReason: accessState.accessReason,
    showWarning: accessState.showWarning,
    warningType: accessState.warningType,
    warningMessage: accessState.warningMessage,
    daysUntilExpiry: accessState.daysUntilExpiry,
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
    queryKey: queryKeys.subscription.data.byOrganization(userId),
    queryFn: () => fetchSubscription(userId),
    staleTime: STALE_TIME,
  });
};

/**
 * Hook to get subscription status without triggering fetch
 * Useful for quick checks when data might already be cached
 */
export const useSubscriptionCache = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  const cachedData = queryClient.getQueryData(
    user?.id ? queryKeys.subscription.data.byOrganization(user.id) : queryKeys.subscription.data.all
  );

  return {
    subscriptionData: cachedData,
    hasActiveSubscription: cachedData?.status === 'active',
    hasActiveOrPausedSubscription: cachedData && isActiveOrPaused(cachedData.status),
    isCached: !!cachedData,
  };
};

