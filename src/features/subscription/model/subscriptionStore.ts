import { useAuthStore } from '@/shared/model/authStore';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { addOnPaymentService } from '@/features/subscription';

import { entitlementService } from '@/features/subscription';
import { clearFeatureAccessCache } from '@/features/subscription/';

// ============================================================================
// Types
// ============================================================================

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
  userEntitlements: Entitlement[];
  activeEntitlements: Entitlement[];
  totalAddOnCost: SubscriptionCost;
  isLoadingEntitlements: boolean;
  entitlementsError: Error | null;

  isPurchasing: boolean;
  isCancelling: boolean;
  purchaseError: string | null;

  _fetchEntitlementsPromise: Promise<void> | null;

  fetchUserEntitlements: (userId?: string) => Promise<void>;
  setEntitlementsData: (data: Partial<SubscriptionState>) => void;
  setPurchaseState: (state: { isPurchasing?: boolean; isCancelling?: boolean; purchaseError?: string | null }) => void;
  clearAccessCache: () => void;
  clearPurchaseError: () => void;
  hasAddOnAccessSync: (featureKey: string) => boolean;
}

// ============================================================================
// Stale time (2 minutes)
// ============================================================================

const STALE_TIME = 2 * 60 * 1000;

// Manual override TTL (30 seconds)
// After setAccessData({ hasAccess: true }), fetchSubscription will refuse to
// downgrade access for this duration. Gives the database time to propagate
// newly-created subscriptions.
const MANUAL_OVERRIDE_TTL = 30 * 1000;

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
    paymentStatus: data.status === 'active' ? 'success' : 'pending',
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
    userEntitlements: [],
    activeEntitlements: [],
    totalAddOnCost: { monthly: 0, annual: 0 },
    isLoadingEntitlements: false,
    entitlementsError: null,

    isPurchasing: false,
    isCancelling: false,
    purchaseError: null,

    _fetchEntitlementsPromise: null,

    fetchUserEntitlements: async (explicitUserId?: string) => {
      const userId = explicitUserId || useAuthStore.getState().user?.id;
      if (!userId) return;

      if (get()._fetchEntitlementsPromise) {
        return get()._fetchEntitlementsPromise;
      }

      const fetchPromise = (async () => {
        set((s) => { s.isLoadingEntitlements = true; s.entitlementsError = null; });
        try {
          const result = await entitlementService.getUserEntitlements(userId);

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
          set((s) => {
            s.isLoadingEntitlements = false;
            s.entitlementsError = err instanceof Error ? err : new Error(String(err));
          });
        } finally {
          set((s) => { s._fetchEntitlementsPromise = null; });
        }
      })();

      set((s) => { s._fetchEntitlementsPromise = fetchPromise; });

      return fetchPromise;
    },

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
        state.userEntitlements = [];
        state.activeEntitlements = [];
        state._fetchEntitlementsPromise = null;
      });
    },

    clearPurchaseError: () => {
      set((state) => { state.purchaseError = null; });
    },

    hasAddOnAccessSync: (featureKey) => {
      const { activeEntitlements } = get();
      return activeEntitlements.some((ent) => ent.feature_key === featureKey);
    },
  }))
);

// ============================================================================
// Convenience Hooks
// ============================================================================

export const useUserEntitlements = () => {
  const userEntitlements = useSubscriptionStore((s) => s.userEntitlements);
  const activeEntitlements = useSubscriptionStore((s) => s.activeEntitlements);
  const totalAddOnCost = useSubscriptionStore((s) => s.totalAddOnCost);
  const isLoadingEntitlements = useSubscriptionStore((s) => s.isLoadingEntitlements);
  const entitlementsError = useSubscriptionStore((s) => s.entitlementsError);
  const hasAddOnAccessSync = useSubscriptionStore((s) => s.hasAddOnAccessSync);
  const fetchUserEntitlements = useSubscriptionStore((s) => s.fetchUserEntitlements);

  return { userEntitlements, activeEntitlements, totalAddOnCost, isLoadingEntitlements, entitlementsError, hasAddOnAccessSync, fetchUserEntitlements };
};

export const useSubscriptionPurchase = () => {
  const isPurchasing = useSubscriptionStore((s) => s.isPurchasing);
  const isCancelling = useSubscriptionStore((s) => s.isCancelling);
  const purchaseError = useSubscriptionStore((s) => s.purchaseError);
  const clearPurchaseError = useSubscriptionStore((s) => s.clearPurchaseError);
  const setPurchaseState = useSubscriptionStore((s) => s.setPurchaseState);

  const purchaseAddOn = async (featureKey: string, billingPeriod: string = 'monthly') => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not authenticated');
    setPurchaseState({ isPurchasing: true, purchaseError: null });
    try {
      const result = await addOnPaymentService.createAddOnOrder({
        featureKey,
        userId: user.id,
        billingPeriod,
        userEmail: user.email || '',
        userName: user.user_metadata?.name || user.email || '',
      });
      setPurchaseState({ isPurchasing: false });
      return result;
    } catch (err: any) {
      setPurchaseState({ isPurchasing: false, purchaseError: err.message });
      throw err;
    }
  };

  const purchaseBundle = async (bundleId: string, billingPeriod: string = 'monthly') => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not authenticated');
    setPurchaseState({ isPurchasing: true, purchaseError: null });
    try {
      const result = await addOnPaymentService.createBundleOrder({
        bundleId,
        userId: user.id,
        billingPeriod,
        userEmail: user.email || '',
        userName: user.user_metadata?.name || user.email || '',
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

// Combined hook – single import for components that need entitlements + purchase
export const useSubscription = () => {
  const entitlements = useUserEntitlements();
  const purchase = useSubscriptionPurchase();

  return {
    ...entitlements,
    ...purchase,
    refreshAccess: async () => {
      clearFeatureAccessCache();
      await useSubscriptionStore.getState().fetchUserEntitlements();
    },
    cancelAddOn: async (entitlementId: string) => {
      return entitlementService.cancelAddOn(entitlementId);
    },
  };
};


