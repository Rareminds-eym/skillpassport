import { useAuthStore } from '@/shared/model/authStore';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { addOnPaymentService } from '@/features/subscription';

import { entitlementService } from '@/features/subscription';
import { clearFeatureAccessCache } from '@/features/subscription/';

// =====================================================================
// Types
// =====================================================================
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

// =====================================================================
// Store State Interface
// =====================================================================
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

// =====================================================================
// Store
// =====================================================================
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

    fetchUserEntitlements: async (explicitUserId?: string): Promise<void> => {
      const userId = explicitUserId || useAuthStore.getState().user?.id;
      if (!userId) {
        return;
      }

      const existingPromise = get()._fetchEntitlementsPromise;
      if (existingPromise) {
        return existingPromise;
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

// =====================================================================
// Convenience Hooks
// =====================================================================
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setPurchaseState({ isPurchasing: false, purchaseError: errorMessage });
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setPurchaseState({ isPurchasing: false, purchaseError: errorMessage });
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

// Alias for backward compatibility (was previously a context hook)
export const useSubscriptionContext = useSubscription;

// Selector utilities
// =====================================================================
/**
 * Compute payment status from subscription status
 * Derived value - not stored in state
 */
export const getPaymentStatus = (status: string | undefined): 'success' | 'pending' => {
  return status === 'active' ? 'success' : 'pending';
};

