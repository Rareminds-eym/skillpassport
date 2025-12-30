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
 */

import { createContext, useContext, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { checkSubscriptionAccess } from '../services/paymentsApiService';

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

// Query key for subscription access
const SUBSCRIPTION_ACCESS_KEY = 'subscription-access';
const STALE_TIME = 2 * 60 * 1000; // 2 minutes
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export const SubscriptionProvider = ({ children }) => {
  const { user, session } = useSupabaseAuth();
  const queryClient = useQueryClient();

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

  // Refresh subscription access (call after payment, etc.)
  const refreshAccess = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [SUBSCRIPTION_ACCESS_KEY, user?.id],
    });
  }, [queryClient, user?.id]);

  // Clear subscription cache (on logout)
  const clearAccessCache = useCallback(() => {
    queryClient.removeQueries({
      queryKey: [SUBSCRIPTION_ACCESS_KEY],
    });
  }, [queryClient]);

  // Memoized values
  const hasAccess = useMemo(() => accessData?.hasAccess ?? false, [accessData]);
  const accessReason = useMemo(() => accessData?.accessReason ?? ACCESS_REASONS.NO_SUBSCRIPTION, [accessData]);
  const subscription = useMemo(() => accessData?.subscription ?? null, [accessData]);
  const showWarning = useMemo(() => accessData?.showWarning ?? false, [accessData]);
  const warningType = useMemo(() => accessData?.warningType ?? null, [accessData]);
  const warningMessage = useMemo(() => accessData?.warningMessage ?? null, [accessData]);
  const daysUntilExpiry = useMemo(() => accessData?.daysUntilExpiry ?? null, [accessData]);

  const value = useMemo(() => ({
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
    
    // Actions
    refreshAccess,
    clearAccessCache,
    
    // Helper booleans
    isActive: accessReason === ACCESS_REASONS.ACTIVE,
    isPaused: accessReason === ACCESS_REASONS.PAUSED,
    isInGracePeriod: accessReason === ACCESS_REASONS.GRACE_PERIOD,
    isExpired: accessReason === ACCESS_REASONS.EXPIRED,
    hasNoSubscription: accessReason === ACCESS_REASONS.NO_SUBSCRIPTION,
  }), [
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
    refreshAccess,
    clearAccessCache,
  ]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
