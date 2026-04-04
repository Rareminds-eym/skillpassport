/**
 * Subscription Entity - Model Exports
 */

// Type exports
export type {
  SubscriptionStatus,
  BillingCycle,
  OrganizationType,
  MemberType,
  Subscription,
  SubscriptionPlan,
  OrganizationSubscription,
  OrgSubscriptionPurchaseRequest,
  PricingBreakdown,
  RenewalOptions,
  LicensePool,
  LicenseAssignment,
  PaymentTransaction,
  AddOn,
  UserEntitlement,
  SubscriptionStats,
  SubscriptionFilters
} from '@/shared/types';

// Validation exports
export {
  isValidSubscriptionStatus,
  isValidBillingCycle,
  isValidOrganizationType,
  isValidMemberType,
  validateSubscription,
  validateOrganizationSubscription,
  validatePurchaseRequest,
  validateSeatCount,
  canAssignMoreSeats
} from './validation';

// Utility exports
export {
  getSubscriptionStatusDisplayName,
  getSubscriptionStatusColor,
  getBillingCycleDisplayName,
  getBillingCycleMonths,
  getOrganizationTypeDisplayName,
  getMemberTypeDisplayName,
  isSubscriptionActive,
  isSubscriptionExpired,
  getDaysUntilExpiry,
  isExpiringSoon,
  formatExpiryDate,
  getAvailableSeats,
  getSeatUtilizationPercentage,
  hasAvailableSeats,
  canAssignSeats,
  calculatePricing,
  formatPrice,
  calculateAnnualSavings,
  calculateSavingsPercentage,
  filterSubscriptionsByStatus,
  filterActiveSubscriptions,
  filterExpiredSubscriptions,
  filterExpiringSubscriptions,
  sortSubscriptionsByEndDate,
  sortSubscriptionsByStartDate,
  calculateSubscriptionStats,
  calculateEndDate,
  formatSubscriptionDate,
  getSubscriptionDuration
} from './utils';
