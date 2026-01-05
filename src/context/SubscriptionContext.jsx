/**
 * SubscriptionContext
 * 
 * Provides subscription access state to the entire application.
 * Used by SubscriptionProtectedRoute to gate access to /student/* routes.
 * 
 * Features:
 * - Checks subscription access via Cloudflare Worker
 * - Caches results with React Query
 * - Provides access state, warnings, and subscription data
 * - Auto-refreshes on auth state changes
 * - Manages add-on entitlements for feature gating
 * - Supports purchasing add-ons and bundles
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import addOnPaymentService from '../services/addOnPaymentService';
import entitlementService from '../services/entitlementService';
import { checkSubscriptionAccess } from '../services/paymentsApiService';
import { useSupabaseAuth } from './SupabaseAuthContext';

// Access reasons for UI handling
export const ACCESS_REASONS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  GRACE_PERIOD: 'grace_period',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  NO_SUBSCRIPTION: 'no_subscription',
};

// Warning types for banner display
export const WARNING_TYPES = {
  EXPIRING_SOON: 'expiring_soon',
  GRACE_PERIOD: 'grace_period',
  PAUSED: 'paused',
};

const SubscriptionContext = createContext(null);

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within SubscriptionProvider');
  }
  return context;
};

// Query keys
const SUBSCRIPTION_ACCESS_KEY = 'subscription-access';
const USER_ENTITLEMENTS_KEY = 'user-entitlements';
const STALE_TIME = 2 * 60 * 1000; // 2 minutes
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export const SubscriptionProvider = ({ children }) => {
  const { user, session } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [purchaseError, setPurchaseError] = useState(null);

  // Fetch subscription access from Cloudflare Worker
  const {
    data: accessData,
    isLoading,
    error,
    isRefetching,
  } = useQuery({
    queryKey: [SUBSCRIPTION_ACCESS_KEY, user?.id],
    queryFn: async () => {
      if (!session?.access_token) {
        return {
          hasAccess: false,
          accessReason: ACCESS_REASONS.NO_SUBSCRIPTION,
          subscription: null,
          showWarning: false,
        };
      }
      
      const result = await checkSubscriptionAccess(session.access_token);
      return result;
    },
    enabled: !!user && !!session?.access_token,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch user entitlements (add-ons)
  const {
    data: entitlementsData,
    isLoading: isLoadingEntitlements,
    error: entitlementsError,
  } = useQuery({
    queryKey: [USER_ENTITLEMENTS_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { entitlements: [], totalCost: { monthly: 0, annual: 0 } };
      }
      
      const [entitlementsResult, costResult] = await Promise.all([
        entitlementService.getUserEntitlements(user.id),
        entitlementService.calculateTotalCost(user.id)
      ]);
      
      return {
        entitlements: entitlementsResult.success ? entitlementsResult.data : [],
        totalCost: costResult.success ? costResult.data : { monthly: 0, annual: 0 }
      };
    },
    enabled: !!user?.id,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  // Refresh subscription access (call after payment, etc.)
  const refreshAccess = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [SUBSCRIPTION_ACCESS_KEY, user?.id],
    });
  }, [queryClient, user?.id]);

  // Refresh user entitlements
  const fetchUserEntitlements = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [USER_ENTITLEMENTS_KEY, user?.id],
    });
  }, [queryClient, user?.id]);

  // Clear subscription cache (on logout)
  const clearAccessCache = useCallback(() => {
    queryClient.removeQueries({
      queryKey: [SUBSCRIPTION_ACCESS_KEY],
    });
    queryClient.removeQueries({
      queryKey: [USER_ENTITLEMENTS_KEY],
    });
  }, [queryClient]);

  /**
   * Check if user has access to a specific add-on feature
   * Checks both plan-based access and individual entitlements
   */
  const hasAddOnAccess = useCallback(async (featureKey) => {
    if (!user?.id) return false;
    
    const result = await entitlementService.hasFeatureAccess(user.id, featureKey);
    return result.success && result.data?.hasAccess;
  }, [user?.id]);

  /**
   * Synchronous check for add-on access using cached entitlements
   * Use this for immediate UI rendering decisions
   */
  const hasAddOnAccessSync = useCallback((featureKey) => {
    if (!entitlementsData?.entitlements) return false;
    
    const activeEntitlements = entitlementsData.entitlements.filter(
      ent => ent.status === 'active' || ent.status === 'grace_period'
    );
    
    return activeEntitlements.some(ent => ent.feature_key === featureKey);
  }, [entitlementsData?.entitlements]);

  // Purchase add-on mutation
  const purchaseAddOnMutation = useMutation({
    mutationFn: async ({ featureKey, billingPeriod }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const result = await addOnPaymentService.createAddOnOrder({
        featureKey,
        userId: user.id,
        billingPeriod,
        userEmail: user.email,
        userName: user.user_metadata?.full_name
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onError: (error) => {
      setPurchaseError(error.message);
    },
    onSuccess: () => {
      setPurchaseError(null);
    }
  });

  // Purchase bundle mutation
  const purchaseBundleMutation = useMutation({
    mutationFn: async ({ bundleId, billingPeriod }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const result = await addOnPaymentService.createBundleOrder({
        bundleId,
        userId: user.id,
        billingPeriod,
        userEmail: user.email,
        userName: user.user_metadata?.full_name
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onError: (error) => {
      setPurchaseError(error.message);
    },
    onSuccess: () => {
      setPurchaseError(null);
    }
  });

  // Cancel add-on mutation
  const cancelAddOnMutation = useMutation({
    mutationFn: async (entitlementId) => {
      const result = await entitlementService.cancelAddOn(entitlementId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      fetchUserEntitlements();
    }
  });

  /**
   * Purchase an add-on - returns order data for Razorpay
   */
  const purchaseAddOn = useCallback(async (featureKey, billingPeriod) => {
    return purchaseAddOnMutation.mutateAsync({ featureKey, billingPeriod });
  }, [purchaseAddOnMutation]);

  /**
   * Purchase a bundle - returns order data for Razorpay
   */
  const purchaseBundle = useCallback(async (bundleId, billingPeriod) => {
    return purchaseBundleMutation.mutateAsync({ bundleId, billingPeriod });
  }, [purchaseBundleMutation]);

  /**
   * Cancel an add-on subscription
   */
  const cancelAddOn = useCallback(async (entitlementId) => {
    return cancelAddOnMutation.mutateAsync(entitlementId);
  }, [cancelAddOnMutation]);

  // Memoized values
  const hasAccess = useMemo(() => accessData?.hasAccess ?? false, [accessData]);
  const accessReason = useMemo(() => accessData?.accessReason ?? ACCESS_REASONS.NO_SUBSCRIPTION, [accessData]);
  const subscription = useMemo(() => accessData?.subscription ?? null, [accessData]);
  const showWarning = useMemo(() => accessData?.showWarning ?? false, [accessData]);
  const warningType = useMemo(() => accessData?.warningType ?? null, [accessData]);
  const warningMessage = useMemo(() => accessData?.warningMessage ?? null, [accessData]);
  const daysUntilExpiry = useMemo(() => accessData?.daysUntilExpiry ?? null, [accessData]);
  
  // Add-on entitlements
  const userEntitlements = useMemo(() => entitlementsData?.entitlements ?? [], [entitlementsData]);
  const activeEntitlements = useMemo(() => 
    userEntitlements.filter(ent => ent.status === 'active' || ent.status === 'grace_period'),
    [userEntitlements]
  );
  const totalAddOnCost = useMemo(() => entitlementsData?.totalCost ?? { monthly: 0, annual: 0 }, [entitlementsData]);

  const value = useMemo(() => ({
    // User data (needed for feature gating)
    user,
    
    // Access state
    hasAccess,
    accessReason,
    isLoading,
    error,
    isRefetching,
    
    // Subscription data
    subscription,
    daysUntilExpiry,
    
    // Warning state
    showWarning,
    warningType,
    warningMessage,
    
    // Add-on entitlements
    userEntitlements,
    activeEntitlements,
    totalAddOnCost,
    isLoadingEntitlements,
    entitlementsError,
    
    // Actions
    refreshAccess,
    clearAccessCache,
    fetchUserEntitlements,
    hasAddOnAccess,
    hasAddOnAccessSync,
    purchaseAddOn,
    purchaseBundle,
    cancelAddOn,
    
    // Purchase state
    isPurchasing: purchaseAddOnMutation.isPending || purchaseBundleMutation.isPending,
    isCancelling: cancelAddOnMutation.isPending,
    purchaseError,
    clearPurchaseError: () => setPurchaseError(null),
    
    // Helper booleans
    isActive: accessReason === ACCESS_REASONS.ACTIVE,
    isPaused: accessReason === ACCESS_REASONS.PAUSED,
    isInGracePeriod: accessReason === ACCESS_REASONS.GRACE_PERIOD,
    isExpired: accessReason === ACCESS_REASONS.EXPIRED,
    hasNoSubscription: accessReason === ACCESS_REASONS.NO_SUBSCRIPTION,
  }), [
    user,
    hasAccess,
    accessReason,
    isLoading,
    error,
    isRefetching,
    subscription,
    daysUntilExpiry,
    showWarning,
    warningType,
    warningMessage,
    userEntitlements,
    activeEntitlements,
    totalAddOnCost,
    isLoadingEntitlements,
    entitlementsError,
    refreshAccess,
    clearAccessCache,
    fetchUserEntitlements,
    hasAddOnAccess,
    hasAddOnAccessSync,
    purchaseAddOn,
    purchaseBundle,
    cancelAddOn,
    purchaseAddOnMutation.isPending,
    purchaseBundleMutation.isPending,
    cancelAddOnMutation.isPending,
    purchaseError,
  ]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
