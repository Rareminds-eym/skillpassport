// Export all subscription hooks
// NOTE: useSubscription is the Zustand version from subscriptionStore.ts.
// The legacy useSubscription.js is kept for reference but not re-exported.
export { default as useOrganizationSubscription } from './useOrganizationSubscription';
export { default as usePaymentVerification, usePaymentVerificationFromURL } from '../lib/usePaymentVerification';
export { default as useSubscriptionPlansData } from './useSubscriptionPlansData';
export { useSubscriptionQuery, prefetchSubscriptionData, useSubscriptionCache } from './useSubscriptionQuery';
export { useFeatureGate, clearFeatureAccessCache } from './useFeatureGate';
export { useAddOnCatalog } from './useAddOnCatalog';

// Zustand store hooks (from subscriptionStore.ts)
export {
  useSubscription,
  useSubscriptionContext,
  useSubscriptionAccess,
  useSubscriptionWarnings,
  useUserEntitlements,
  useSubscriptionPurchase,
  WARNING_TYPES,
  ACCESS_REASONS,
} from './subscriptionStore';
