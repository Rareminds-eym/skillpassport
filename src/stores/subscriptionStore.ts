import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useQueryClient } from '@tanstack/react-query';

// Types
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

export interface Subscription {
  id: string;
  status: string;
  plan_type?: string;
  was_revoked?: boolean;
  end_date?: string;
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
  
  // Computed helpers (as methods)
  getIsActive: () => boolean;
  getIsPaused: () => boolean;
  getIsInGracePeriod: () => boolean;
  getIsExpired: () => boolean;
  getHasNoSubscription: () => boolean;
  
  // Actions
  setAccessData: (data: Partial<SubscriptionState>) => void;
  setEntitlementsData: (data: Partial<SubscriptionState>) => void;
  setPurchaseState: (state: { isPurchasing?: boolean; isCancelling?: boolean; purchaseError?: string | null }) => void;
  refreshAccess: () => void;
  fetchUserEntitlements: () => void;
  clearAccessCache: () => void;
  clearPurchaseError: () => void;
  
  // Feature access check
  hasAddOnAccessSync: (featureKey: string) => boolean;
  hasAddOnAccess: (featureKey: string) => Promise<boolean>;
  
  // Mutations (to be called with your mutation hooks)
  purchaseAddOn: (featureKey: string, billingPeriod: 'monthly' | 'annual') => Promise<void>;
  purchaseBundle: (bundleId: string, billingPeriod: 'monthly' | 'annual') => Promise<void>;
  cancelAddOn: (entitlementId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  immer((set, get) => ({
    // Initial state
    hasAccess: false,
    accessReason: 'no_subscription',
    subscription: null,
    isLoading: true,
    isRefetching: false,
    error: null,
    
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
    
    // Computed (as methods)
    getIsActive: () => get().accessReason === 'active',
    getIsPaused: () => get().accessReason === 'paused',
    getIsInGracePeriod: () => get().accessReason === 'grace_period',
    getIsExpired: () => get().accessReason === 'expired',
    getHasNoSubscription: () => get().accessReason === 'no_subscription',

    // Set access data (called from React Query)
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

    // Set entitlements data (called from React Query)
    setEntitlementsData: (data) => {
      set((state) => {
        if (data.userEntitlements) {
          state.userEntitlements = data.userEntitlements;
          // Compute active entitlements
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

    // Trigger refresh (component calls invalidateQueries)
    refreshAccess: () => {
      // Components should call:
      // queryClient.invalidateQueries({ queryKey: ['subscription-access', userId] })
    },

    fetchUserEntitlements: () => {
      // Components should call:
      // queryClient.invalidateQueries({ queryKey: ['user-entitlements', userId] })
    },

    clearAccessCache: () => {
      // Components should call:
      // queryClient.removeQueries({ queryKey: ['subscription-access'] })
      // queryClient.removeQueries({ queryKey: ['user-entitlements'] })
      set((state) => {
        state.hasAccess = false;
        state.accessReason = 'no_subscription';
        state.subscription = null;
        state.userEntitlements = [];
        state.activeEntitlements = [];
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

    // Async check (fetches fresh data)
    hasAddOnAccess: async (featureKey) => {
      // This would call your entitlement service
      // For now, return sync check
      return get().hasAddOnAccessSync(featureKey);
    },

    // Placeholder mutations - actual implementation uses React Query mutations
    purchaseAddOn: async () => {
      // Component should use useMutation with addOnPaymentService.createAddOnOrder
      throw new Error('Use React Query mutation for purchases');
    },

    purchaseBundle: async () => {
      // Component should use useMutation with addOnPaymentService.createBundleOrder
      throw new Error('Use React Query mutation for purchases');
    },

    cancelAddOn: async () => {
      // Component should use useMutation with entitlementService.cancelAddOn
      throw new Error('Use React Query mutation for cancellations');
    },
  }))
);

// Hook for React Query integration
export const useSyncSubscriptionWithQuery = () => {
  const queryClient = useQueryClient();
  const store = useSubscriptionStore.getState();

  return {
    refreshAccess: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-access', userId] });
    },
    fetchUserEntitlements: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['user-entitlements', userId] });
    },
    clearAccessCache: () => {
      queryClient.removeQueries({ queryKey: ['subscription-access'] });
      queryClient.removeQueries({ queryKey: ['user-entitlements'] });
      store.clearAccessCache();
    },
  };
};

// Convenience hooks
export const useSubscriptionAccess = () => {
  const hasAccess = useSubscriptionStore((state) => state.hasAccess);
  const accessReason = useSubscriptionStore((state) => state.accessReason);
  const subscription = useSubscriptionStore((state) => state.subscription);
  const isLoading = useSubscriptionStore((state) => state.isLoading);
  const isActive = useSubscriptionStore((state) => state.getIsActive());
  const isPaused = useSubscriptionStore((state) => state.getIsPaused());
  const isInGracePeriod = useSubscriptionStore((state) => state.getIsInGracePeriod());
  const isExpired = useSubscriptionStore((state) => state.getIsExpired());
  const hasNoSubscription = useSubscriptionStore((state) => state.getHasNoSubscription());
  
  return { hasAccess, accessReason, subscription, isLoading, isActive, isPaused, isInGracePeriod, isExpired, hasNoSubscription };
};

export const useSubscriptionWarnings = () => {
  const showWarning = useSubscriptionStore((state) => state.showWarning);
  const warningType = useSubscriptionStore((state) => state.warningType);
  const warningMessage = useSubscriptionStore((state) => state.warningMessage);
  const daysUntilExpiry = useSubscriptionStore((state) => state.daysUntilExpiry);
  
  return { showWarning, warningType, warningMessage, daysUntilExpiry };
};

export const useUserEntitlements = () => {
  const userEntitlements = useSubscriptionStore((state) => state.userEntitlements);
  const activeEntitlements = useSubscriptionStore((state) => state.activeEntitlements);
  const totalAddOnCost = useSubscriptionStore((state) => state.totalAddOnCost);
  const isLoadingEntitlements = useSubscriptionStore((state) => state.isLoadingEntitlements);
  const entitlementsError = useSubscriptionStore((state) => state.entitlementsError);
  
  return { userEntitlements, activeEntitlements, totalAddOnCost, isLoadingEntitlements, entitlementsError };
};

export const useSubscriptionPurchase = () => {
  const isPurchasing = useSubscriptionStore((state) => state.isPurchasing);
  const isCancelling = useSubscriptionStore((state) => state.isCancelling);
  const purchaseError = useSubscriptionStore((state) => state.purchaseError);
  const clearPurchaseError = useSubscriptionStore((state) => state.clearPurchaseError);
  
  return { isPurchasing, isCancelling, purchaseError, clearPurchaseError };
};
