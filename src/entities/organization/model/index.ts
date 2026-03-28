/**
 * Organization Entity - Model Layer Public API
 */

// Types
export type {
  Organization,
  OrganizationType,
  OrganizationFilters,
  OrganizationSubscription,
  OrgSubscriptionPurchaseRequest,
  PricingBreakdown,
  RenewalOptions,
  OrganizationMember,
  FetchMembersOptions,
  FetchMembersResult,
  OrganizationInvitation,
  OrganizationEntitlement,
  OrganizationPurchaseData,
  OrganizationOrderResult,
} from './types';

// Validation
export {
  isValidOrganizationType,
  validateOrganization,
  isValidPhone,
  isValidWebsite,
  validateSeatCount,
  canReduceSeats,
} from './validation';

// Utils
export {
  getOrganizationDisplayName,
  getOrganizationTypeLabel,
  calculateVolumeDiscount,
  calculateBulkPricing,
  filterOrganizationsByType,
  filterActiveOrganizations,
  searchOrganizations,
  sortOrganizationsByName,
  isSameOrganization,
  getAvailableSeats,
  calculateSeatUtilization,
  isSubscriptionActive,
  getMemberTypeLabel,
  formatMemberCount,
} from './utils';
