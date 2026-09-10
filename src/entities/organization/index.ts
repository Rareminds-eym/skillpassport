/**
 * Organization Entity - Public API
 * Central export point for all organization entity functionality
 */

// Model exports
export { useOrganizationById, useOrganizations } from './model/useOrganization';
export { useOrganizationCheck } from './model/useOrganizationCheck';
export { useOrganizationSubscription } from './model/useOrganizationSubscription';
export type {
  Organization,
  OrganizationType,
  OrganizationFilters,
  OrganizationSubscription,
  OrgSubscriptionPurchaseRequest,
  PricingBreakdown,
  RenewalOptions,
  FetchMembersResult,
  OrganizationInvitation,
  OrganizationEntitlement,
  OrganizationPurchaseData,
  OrganizationOrderResult,
  PoolAssignmentApiResponse,
  PoolAssignmentRawItem,
  PoolAssignmentRawUser,
  NormalizedPoolMemberAssignment,
} from './model';

export {
  isValidOrganizationType,
  validateOrganization,
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
  normalizePoolMemberAssignment,
} from './model';

// API exports
export * from './api';

// UI exports
export { OrganizationCard } from './ui';
export { licenseManagementService } from './api/licenseManagementService';
export { memberInvitationService } from './api/memberInvitationService';
export { organizationMemberService } from './api/organizationMemberService';
export { organizationSubscriptionService } from './api/organizationSubscriptionService';
export type { LicensePool } from './api/licenseManagementService';
export type { PaymentRecord } from './api/organizationBillingService';
export type { BillingDashboard } from './api/organizationBillingService';
