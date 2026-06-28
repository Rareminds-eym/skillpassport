// React Query hooks (preferred for subscription server state)
export { useSubscriptionQuery, prefetchSubscriptionData, useSubscriptionCache } from './useSubscriptionQuery';
export { default as useOrganizationSubscription } from './useOrganizationSubscription';
export { default as usePaymentVerification, usePaymentVerificationFromURL } from '../lib/usePaymentVerification';
export { default as useSubscriptionPlansData } from './useSubscriptionPlansData';
export { useFeatureGate, clearFeatureAccessCache } from './useFeatureGate';
export { useAddOnCatalog } from './useAddOnCatalog';
export { useOptimisticSubscription } from './useOptimisticSubscription';

// Zustand store hooks (entitlements + purchase actions only)
// NOTE: useSubscription is a combined hook that wraps useSubscriptionQuery + entitlements
export {
  useSubscription,
  useUserEntitlements,
  useSubscriptionPurchase,
  WARNING_TYPES,
  ACCESS_REASONS,
} from './subscriptionStore';
