/**
 * Organization Entity - Public API
 * Central export point for all organization entity functionality
 */

// Model exports
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
} from './model';

export {
  isValidOrganizationType,
  validateOrganization,
  isValidEmail,
  isValidPhone,
  isValidWebsite,
  validateSeatCount,
  canReduceSeats,
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
} from './model';

// API exports
export {
  getOrganizationByAdminId,
  getOrganizationById,
  getOrganizations,
  getSchools,
  getColleges,
  getUniversities,
  getOrganizationByEmail,
  getOrganizationSubscriptions,
  getSubscriptionById,
  getOrganizationMembers,
  getMemberCounts,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  checkOrganizationNameExists,
  updateSeatCount,
  cancelSubscription,
  renewSubscription,
  upgradeSubscription,
  removeMember,
} from './api';

// UI exports
export { OrganizationCard } from './ui';
