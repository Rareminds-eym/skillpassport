/**
 * Organization Subscription Components
 * 
 * Components for organization-level subscription management including:
 * - Seat selection with volume discounts
 * - Member type selection (educator/student/both)
 * - Pricing breakdown display
 * - Organization purchase panel
 * - Subscription dashboard and management
 */

// Core purchase components
export { default as SeatSelector } from './SeatSelector';
export type { PricingBreakdown as SeatSelectorPricing } from './SeatSelector';

export { default as MemberTypeSelector } from './MemberTypeSelector';
export type { MemberType } from './MemberTypeSelector';

export { default as PricingBreakdown } from './PricingBreakdown';
export type { PricingBreakdownData } from './PricingBreakdown';

export { default as OrganizationPurchasePanel } from './OrganizationPurchasePanel';
export type { OrganizationPurchaseConfig } from './OrganizationPurchasePanel';

// Dashboard components
export { default as LicensePoolManager } from './LicensePoolManager';
export { default as MemberAssignments } from './MemberAssignments';
export { default as OrganizationSubscriptionDashboard } from './OrganizationSubscriptionDashboard';
export { default as SubscriptionOverview } from './SubscriptionOverview';

export { default as BillingDashboard } from './BillingDashboard';
export { default as InvitationManager } from './InvitationManager';

// Bulk purchase wizard
export { default as BulkPurchaseWizard } from './BulkPurchaseWizard';
export type { PurchaseData } from './BulkPurchaseWizard';

// Member subscription view components
export { default as MemberSubscriptionView } from './MemberSubscriptionView';
export { default as OrganizationProvidedFeatures } from './OrganizationProvidedFeatures';
export { default as PersonalAddOns } from './PersonalAddOns';

// Shared utilities (skeleton loaders, error handling)
export * from './shared';
