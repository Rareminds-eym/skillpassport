/**
 * Subscription Entity - Public API
 * Central export point for all subscription entity functionality
 */

// Model exports
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
} from './model';

export {
  isValidSubscriptionStatus,
  isValidBillingCycle,
  isValidOrganizationType,
  isValidMemberType,
  validateSubscription,
  validateOrganizationSubscription,
  validatePurchaseRequest,
  validateSeatCount,
  canAssignMoreSeats,
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
} from './model';
