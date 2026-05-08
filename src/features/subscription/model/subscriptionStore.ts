import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
﻿import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getActiveSubscription } from '@/features/subscription/api';
import { addOnPaymentService } from '@/features/subscription';
import { supabase } from '@/shared/api/supabaseClient';
import { entitlementService } from '@/features/subscription';
import { clearFeatureAccessCache } from '@/features/subscription/';

// ============================================================================
// Types
// ============================================================================

export type AccessReason =
  | 'active'
  | 'paused'
  | 'grace_period'
  | 'expired'
  | 'cancelled'
  | 'no_subscription';

export type WarningType =
  | 'expiring_soon'
  | 'grace_period'
  | 'paused';

export const WARNING_TYPES = {
  EXPIRING_SOON: 'expiring_soon' as const,
  GRACE_PERIOD: 'grace_period' as const,
  PAUSED: 'paused' as const
} as const;

export const ACCESS_REASONS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  GRACE_PERIOD: 'grace_period',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  NO_SUBSCRIPTION: 'no_subscription',
} as const;

export interface Subscription {
  id: string;
  status: string;
  plan_type?: string;
  plan?: string;
  planName?: string;
  planPrice?: number;
  billingCycle?: string;
  was_revoked?: boolean;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  isOrganizationLicense?: boolean;
  organizationId?: string;
  organizationType?: string;
  licenseAssignmentId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  razorpaySubscriptionId?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  features?: any[];
  userRole?: string;
  [key: string]: any;
}

export interface Entitlement {
  id: string;
  feature_key: string;
  status: 'active' | 'grace_period' | 'cancelled' | 'expired';
  end_date?: string;
  [key: string]: any;
}

export interface SubscriptionCost {
  monthly: number;
  annual: number;
}

// ============================================================================
// Store State Interface
// ============================================================================

interface SubscriptionState {
  // Access state
  hasAccess: boolean;
  accessReason: AccessReason;
  subscription: Subscription | null;
  isLoading: boolean;
  isRefetching: boolean;
  error: Error | null;

  // Warning state
  showWarning: boolean;
  warningType: WarningType | null;
  warningMessage: string | null;
  daysUntilExpiry: number | null;

  // Entitlements
  userEntitlements: Entitlement[];
  activeEntitlements: Entitlement[];
  totalAddOnCost: SubscriptionCost;
  isLoadingEntitlements: boolean;
  entitlementsError: Error | null;

  // Purchase state
  isPurchasing: boolean;
  isCancelling: boolean;
  purchaseError: string | null;

  // Internal
  _lastFetchTime: number | null;
  _currentUserId: string | null;
  _fetchSubPromise: Promise<void> | null;
  _fetchEntitlementsPromise: Promise<void> | null;

  // Computed helpers
  getIsActive: () => boolean;
  getIsPaused: () => boolean;
  getIsInGracePeriod: () => boolean;
  getIsExpired: () => boolean;
  getHasNoSubscription: () => boolean;

  // Core actions
  fetchSubscription: (userId: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  fetchUserEntitlements: (userId?: string) => Promise<void>;
  setAccessData: (data: Partial<SubscriptionState>) => void;
  setEntitlementsData: (data: Partial<SubscriptionState>) => void;
  setPurchaseState: (state: { isPurchasing?: boolean; isCancelling?: boolean; purchaseError?: string | null }) => void;
  clearAccessCache: () => void;
  clearPurchaseError: () => void;

  // Feature access
  hasAddOnAccessSync: (featureKey: string) => boolean;
  hasAddOnAccess: (featureKey: string) => Promise<boolean>;
}

// ============================================================================
// Stale time (2 minutes)
// ============================================================================

const STALE_TIME = 2 * 60 * 1000;

// ============================================================================
// Format raw subscription data from Supabase into normalized shape
// ============================================================================

function formatSubscriptionData(data: any): Subscription {
  const planId = data.subscription_plans?.plan_code || data.plan_type || data.plan_code;
  const planName = data.subscription_plans?.name || data.plan_type;

  return {
    id: data.id,
    plan: planId,
    plan_type: planId,
    status: data.status,
    startDate: data.subscription_start_date,
    endDate: data.subscription_end_date,
    end_date: data.subscription_end_date,
    features: data.features || [],
    autoRenew: data.auto_renew !== false,
    planName,
    planPrice: data.plan_amount,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    billingCycle: data.billing_cycle,
    razorpaySubscriptionId: data.razorpay_subscription_id,
    cancelledAt: data.cancelled_at,
    cancellationReason: data.cancellation_reason,
    userRole: data.users?.role || null,
    isOrganizationLicense: data.is_organization_license || false,
    organizationId: data.organization_id || null,
    organizationType: data.organization_type || null,
    licenseAssignmentId: data.license_assignment_id || null,
    was_revoked: false,
  };
}

// ============================================================================
// Compute access, warning, and reason from subscription data
// ============================================================================

function computeAccessState(sub: Subscription | null) {
  if (!sub) {
    return {
      hasAccess: false,
      accessReason: 'no_subscription' as AccessReason,
      showWarning: false,
      warningType: null as WarningType | null,
      warningMessage: null as string | null,
      daysUntilExpiry: null as number | null,
    };
  }

  const status = sub.status;
  let accessReason: AccessReason = 'no_subscription';
  let hasAccess = false;
  let showWarning = false;
  let warningType: WarningType | null = null;
  let warningMessage: string | null = null;
  let daysUntilExpiry: number | null = null;

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
    const endDate = sub.endDate || sub.end_date;
    const daysLeft = endDate
      ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    warningMessage = daysLeft != null && daysLeft > 0
      ? `Your subscription is in a grace period. Renew within ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to avoid losing access.`
      : 'Your subscription is in a grace period. Please renew to continue access.';
  } else if (status === 'cancelled') {
    accessReason = 'cancelled';
    // Cancelled but not expired – user keeps access until end date
    const endDate = sub.endDate || sub.end_date;
    if (endDate && new Date(endDate) >= new Date()) {
      hasAccess = true;
    }
  }

  // Check expiry warning (for active/paused)
  if (hasAccess) {
    const endDate = sub.endDate || sub.end_date;
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
}

// ============================================================================
// Store
// ============================================================================

export const useSubscriptionStore = create<SubscriptionState>()(
  immer((set, get) => ({
    // Initial state
    hasAccess: false,
    accessReason: 'no_subscription',
    subscription: null,
    isLoading: true,
    isRefetching: false,
    error: null,

    // DEBUG: Store identity marker
    _storeId: 'canonical-' + Math.random().toString(36).slice(2, 8),

    showWarning: false,
    warningType: null,
    warningMessage: null,
    daysUntilExpiry: null,

    userEntitlements: [],
    activeEntitlements: [],
    totalAddOnCost: { monthly: 0, annual: 0 },
    isLoadingEntitlements: false,
    entitlementsError: null,

    isPurchasing: false,
    isCancelling: false,
    purchaseError: null,

    _lastFetchTime: null,
    _currentUserId: null,
    _fetchSubPromise: null,
    _fetchEntitlementsPromise: null,

    // Computed helpers
    getIsActive: () => get().accessReason === 'active',
    getIsPaused: () => get().accessReason === 'paused',
    getIsInGracePeriod: () => get().accessReason === 'grace_period',
    getIsExpired: () => get().accessReason === 'expired',
    getHasNoSubscription: () => get().accessReason === 'no_subscription',

    // ====================================================================
    // fetchSubscription – the SINGLE async action that replaces React Query
    // ====================================================================
    fetchSubscription: async (userId: string) => {
      const state = get();

      // Skip if data is fresh (within stale time) and for the same user
      if (
        state._lastFetchTime &&
        state._currentUserId === userId &&
        Date.now() - state._lastFetchTime < STALE_TIME &&
        !state.error
      ) {
        // Data is fresh, just make sure loading is false
        if (state.isLoading) {
          set((s) => { s.isLoading = false; });
        }
        return;
      }

      // If a fetch for this user is already in progress, return the existing Promise
      if (state._fetchSubPromise && state._currentUserId === userId) {
        return state._fetchSubPromise;
      }

      const fetchPromise = (async () => {
        // Set loading (isRefetching if we already have data)
        const isRefetch = !!get().subscription;
        set((s) => {
          s.isLoading = !isRefetch;
          s.isRefetching = isRefetch;
          s._currentUserId = userId;
        });

        try {
          const result = await getActiveSubscription();

          // Race condition guard: if user changed while we were fetching, discard
          if (get()._currentUserId !== userId) {
            return;
          }

          if (result.success && result.data) {
            const subscription = formatSubscriptionData(result.data);
            const accessState = computeAccessState(subscription);

            set((s) => {
              s.subscription = subscription;
              s.hasAccess = accessState.hasAccess;
              s.accessReason = accessState.accessReason;
              s.showWarning = accessState.showWarning;
              s.warningType = accessState.warningType;
              s.warningMessage = accessState.warningMessage;
              s.daysUntilExpiry = accessState.daysUntilExpiry;
              s.isLoading = false;
              s.isRefetching = false;
              s.error = null;
              s._lastFetchTime = Date.now();
            });
          } else {
            // No subscription
            set((s) => {
              s.subscription = null;
              s.hasAccess = false;
              s.accessReason = 'no_subscription';
              s.showWarning = false;
              s.warningType = null;
              s.warningMessage = null;
              s.daysUntilExpiry = null;
              s.isLoading = false;
              s.isRefetching = false;
              s.error = null;
              s._lastFetchTime = Date.now();
            });
          }
        } catch (err) {
          if (get()._currentUserId !== userId) return;
          set((s) => {
            s.isLoading = false;
            s.isRefetching = false;
            s.error = err instanceof Error ? err : new Error(String(err));
            s._lastFetchTime = Date.now();
          });
        } finally {
          set((s) => {
            if (s._currentUserId === userId) {
              s._fetchSubPromise = null;
            }
          });
        }
      })();

      set((s) => {
        s._fetchSubPromise = fetchPromise;
      });

      return fetchPromise;
    },

    // Force refresh – bypasses stale time
    refreshSubscription: async () => {
      const userId = get()._currentUserId;
      if (!userId) return;

      // Clear stale time to force refetch
      set((s) => { s._lastFetchTime = null; });
      await get().fetchSubscription(userId);
    },

    // Fetch user entitlements from the DB (separate from subscription)
    // Accepts optional explicit userId to prevent stale reads during sequential calls
    fetchUserEntitlements: async (explicitUserId?: string) => {
      const userId = explicitUserId || get()._currentUserId;
      if (!userId) return;

      const state = get();

      if (state._fetchEntitlementsPromise && state._currentUserId === userId) {
        return state._fetchEntitlementsPromise;
      }

      const fetchPromise = (async () => {
        set((s) => { s.isLoadingEntitlements = true; s.entitlementsError = null; });
        try {
          const result = await entitlementService.getUserEntitlements(userId);

          // Race condition guard
          if (get()._currentUserId !== userId) return;

          if (result.success && result.data) {
            const entitlements = result.data;
            const now = new Date();
            set((s) => {
              s.userEntitlements = entitlements as any;
              s.activeEntitlements = (entitlements as any[]).filter((ent) => {
                if (ent.status === 'active' || ent.status === 'grace_period') return true;
                if (ent.status === 'cancelled' && ent.end_date && new Date(ent.end_date) >= now) return true;
                return false;
              });
              s.isLoadingEntitlements = false;
            });
          } else {
            set((s) => {
              s.isLoadingEntitlements = false;
              s.entitlementsError = new Error(result.error || 'Failed to fetch entitlements');
            });
          }
        } catch (err) {
          if (get()._currentUserId !== userId) return;
          set((s) => {
            s.isLoadingEntitlements = false;
            s.entitlementsError = err instanceof Error ? err : new Error(String(err));
          });
        } finally {
          set((s) => {
            if (s._currentUserId === userId) {
              s._fetchEntitlementsPromise = null;
            }
          });
        }
      })();

      set((s) => {
        s._fetchEntitlementsPromise = fetchPromise;
      });

      return fetchPromise;
    },

    // Manual setter (for edge cases or testing)
    setAccessData: (data) => {
      set((state) => {
        if (data.hasAccess !== undefined) state.hasAccess = data.hasAccess;
        if (data.accessReason) state.accessReason = data.accessReason;
        if (data.subscription !== undefined) state.subscription = data.subscription;
        if (data.isLoading !== undefined) state.isLoading = data.isLoading;
        if (data.isRefetching !== undefined) state.isRefetching = data.isRefetching;
        if (data.error !== undefined) state.error = data.error;
        if (data.showWarning !== undefined) state.showWarning = data.showWarning;
        if (data.warningType !== undefined) state.warningType = data.warningType;
        if (data.warningMessage !== undefined) state.warningMessage = data.warningMessage;
        if (data.daysUntilExpiry !== undefined) state.daysUntilExpiry = data.daysUntilExpiry;
      });
    },

    // Set entitlements data
    setEntitlementsData: (data) => {
      set((state) => {
        if (data.userEntitlements) {
          state.userEntitlements = data.userEntitlements;
          const now = new Date();
          state.activeEntitlements = data.userEntitlements.filter((ent) => {
            if (ent.status === 'active' || ent.status === 'grace_period') return true;
            if (ent.status === 'cancelled' && ent.end_date && new Date(ent.end_date) >= now) return true;
            return false;
          });
        }
        if (data.totalAddOnCost) state.totalAddOnCost = data.totalAddOnCost;
        if (data.isLoadingEntitlements !== undefined) state.isLoadingEntitlements = data.isLoadingEntitlements;
        if (data.entitlementsError !== undefined) state.entitlementsError = data.entitlementsError;
      });
    },

    // Set purchase state
    setPurchaseState: (purchaseState) => {
      set((state) => {
        if (purchaseState.isPurchasing !== undefined) state.isPurchasing = purchaseState.isPurchasing;
        if (purchaseState.isCancelling !== undefined) state.isCancelling = purchaseState.isCancelling;
        if (purchaseState.purchaseError !== undefined) state.purchaseError = purchaseState.purchaseError;
      });
    },

    clearAccessCache: () => {
      clearFeatureAccessCache();
      set((state) => {
        state.hasAccess = false;
        state.accessReason = 'no_subscription';
        state.subscription = null;
        state.userEntitlements = [];
        state.activeEntitlements = [];
        state.isLoading = true;
        state._lastFetchTime = null;
        state._currentUserId = null;
        state._fetchSubPromise = null;
        state._fetchEntitlementsPromise = null;
      });
    },

    clearPurchaseError: () => {
      set((state) => {
        state.purchaseError = null;
      });
    },

    // Synchronous check (uses cached entitlements)
    hasAddOnAccessSync: (featureKey) => {
      const { activeEntitlements } = get();
      return activeEntitlements.some((ent) => ent.feature_key === featureKey);
    },

    // Async check (for now returns sync check)
    hasAddOnAccess: async (featureKey) => {
      return get().hasAddOnAccessSync(featureKey);
    },
  }))
);

// ============================================================================
// Convenience Hooks
// ============================================================================

export const useSubscriptionAccess = () => {
  const hasAccess = useSubscriptionStore((s) => s.hasAccess);
  const accessReason = useSubscriptionStore((s) => s.accessReason);
  const subscription = useSubscriptionStore((s) => s.subscription);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const isRefetching = useSubscriptionStore((s) => s.isRefetching);
  const error = useSubscriptionStore((s) => s.error);
  const isActive = useSubscriptionStore((s) => s.getIsActive());
  const isPaused = useSubscriptionStore((s) => s.getIsPaused());
  const isInGracePeriod = useSubscriptionStore((s) => s.getIsInGracePeriod());
  const isExpired = useSubscriptionStore((s) => s.getIsExpired());
  const hasNoSubscription = useSubscriptionStore((s) => s.getHasNoSubscription());
  const refreshSubscription = useSubscriptionStore((s) => s.refreshSubscription);
  const fetchEntitlements = useSubscriptionStore((s) => s.fetchUserEntitlements);

  // refreshAccess refreshes BOTH subscription + entitlements
  // Captures userId upfront to prevent stale reads between sequential calls
  const refreshAccess = async () => {
    const userId = useSubscriptionStore.getState()._currentUserId;
    if (!userId) return;

    // Clear local feature gate cache so newly purchased addons are accessible immediately
    clearFeatureAccessCache();

    await refreshSubscription();
    // Pass userId explicitly – _currentUserId may have changed during refreshSubscription
    await fetchEntitlements(userId);
  };

  return {
    hasAccess, accessReason, subscription, isLoading, isRefetching, error,
    isActive, isPaused, isInGracePeriod, isExpired, hasNoSubscription,
    refreshSubscription,
    // Aliases for consumer compatibility (useSubscriptionQuery used these names)
    subscriptionData: subscription,
    loading: isLoading,
    // refreshAccess refreshes both subscription and entitlements
    refreshAccess,
    // fetchUserEntitlements fetches only entitlements from the DB
    fetchUserEntitlements: fetchEntitlements,
  };
};

export const useSubscriptionWarnings = () => {
  const showWarning = useSubscriptionStore((s) => s.showWarning);
  const warningType = useSubscriptionStore((s) => s.warningType);
  const warningMessage = useSubscriptionStore((s) => s.warningMessage);
  const daysUntilExpiry = useSubscriptionStore((s) => s.daysUntilExpiry);

  return { showWarning, warningType, warningMessage, daysUntilExpiry };
};

export const useUserEntitlements = () => {
  const userEntitlements = useSubscriptionStore((s) => s.userEntitlements);
  const activeEntitlements = useSubscriptionStore((s) => s.activeEntitlements);
  const totalAddOnCost = useSubscriptionStore((s) => s.totalAddOnCost);
  const isLoadingEntitlements = useSubscriptionStore((s) => s.isLoadingEntitlements);
  const entitlementsError = useSubscriptionStore((s) => s.entitlementsError);
  const hasAddOnAccessSync = useSubscriptionStore((s) => s.hasAddOnAccessSync);

  return { userEntitlements, activeEntitlements, totalAddOnCost, isLoadingEntitlements, entitlementsError, hasAddOnAccessSync };
};

export const useSubscriptionPurchase = () => {
  const isPurchasing = useSubscriptionStore((s) => s.isPurchasing);
  const isCancelling = useSubscriptionStore((s) => s.isCancelling);
  const purchaseError = useSubscriptionStore((s) => s.purchaseError);
  const clearPurchaseError = useSubscriptionStore((s) => s.clearPurchaseError);
  const setPurchaseState = useSubscriptionStore((s) => s.setPurchaseState);

  // Convenience wrapper: create add-on order via the payments API
  const purchaseAddOn = async (featureKey: string, billingPeriod: string = 'monthly') => {
    const { data: { session } } = await getCurrentSession();
    if (!session?.user) throw new Error('Not authenticated');
    setPurchaseState({ isPurchasing: true, purchaseError: null });
    try {
      const result = await addOnPaymentService.createAddOnOrder({
        featureKey,
        userId: session.user.id,
        billingPeriod,
        userEmail: session.user.email || '',
        userName: session.user.user_metadata?.name || session.user.email || '',
      });
      setPurchaseState({ isPurchasing: false });
      return result;
    } catch (err: any) {
      setPurchaseState({ isPurchasing: false, purchaseError: err.message });
      throw err;
    }
  };

  // Convenience wrapper: create bundle order via the payments API
  const purchaseBundle = async (bundleId: string, billingPeriod: string = 'monthly') => {
    const { data: { session } } = await getCurrentSession();
    if (!session?.user) throw new Error('Not authenticated');
    setPurchaseState({ isPurchasing: true, purchaseError: null });
    try {
      const result = await addOnPaymentService.createBundleOrder({
        bundleId,
        userId: session.user.id,
        billingPeriod,
        userEmail: session.user.email || '',
        userName: session.user.user_metadata?.name || session.user.email || '',
      });
      setPurchaseState({ isPurchasing: false });
      return result;
    } catch (err: any) {
      setPurchaseState({ isPurchasing: false, purchaseError: err.message });
      throw err;
    }
  };

  return { isPurchasing, isCancelling, purchaseError, clearPurchaseError, purchaseAddOn, purchaseBundle };
};

// Combined hook – single import for components that need everything
export const useSubscription = () => {
  const access = useSubscriptionAccess();
  const warnings = useSubscriptionWarnings();
  const entitlements = useUserEntitlements();
  const purchase = useSubscriptionPurchase();

  return {
    ...access,
    ...warnings,
    ...entitlements,
    ...purchase,
  };
};

// Alias for backward compatibility (was previously a context hook)
export const useSubscriptionContext = useSubscription;
