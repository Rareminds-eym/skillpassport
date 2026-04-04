/**
 * Subscription Feature - Public API
 * 
 * This is the main entry point for the subscription feature.
 * All external imports should go through this file.
 */

// Individual Subscription UI
export {
  SubscriptionDashboard,
  SubscriptionDetails,
  AddOnMarketplace,
  AddOnCard,
  BundleCard,
  ReceiptCard,
  TransactionList,
  TransactionGrid,
  UpgradePrompt,
  SubscriptionPlans,
  MySubscription,
  AddOns
} from './ui/individual';

// Organization Subscription UI
export {
  OrganizationSubscriptionDashboard,
  LicensePoolManager,
  BulkPurchaseWizard,
  InvitationManager,
  MemberAssignments,
  BillingDashboard,
  CreatePoolModal,
  EditPoolModal,
  DeletePoolModal,
  AssignToPoolModal,
  PoolAssignmentsModal,
  MemberTypeSelector,
  SeatSelector,
  PricingBreakdown,
  MemberSubscriptionView,
  OrganizationProvidedFeatures,
  OrganizationPurchasePanel,
  PersonalAddOns,
  SubscriptionOverview
} from './ui/organization';

// Shared Subscription UI
export {
  SubscriptionGate,
  SubscriptionProtectedRoute,
  SubscriptionStatusWidget,
  FeatureGate,
  SubscriptionBanner,
  SubscriptionPrefetch,
  SubscriptionRouteGuard,
  PaymentSuccess,
  PaymentFailure,
  SubscriptionSettingsSection
} from './ui/shared';

// DatePicker (default export)
export { default as DatePicker } from './ui/shared/DatePicker';

// Root UI Components (legacy exports for backward compatibility)
export { default as AddOnCardRoot } from './ui/AddOnCard';
export { default as AddOnCheckout } from './ui/AddOnCheckout';
export { default as AddOnMarketplaceRoot } from './ui/AddOnMarketplace';
export { default as BundleCardRoot } from './ui/BundleCard';
export { default as FeatureGateRoot } from './ui/FeatureGate';
export { default as ReceiptCardRoot } from './ui/ReceiptCard';
export { default as SubscriptionBannerRoot } from './ui/SubscriptionBanner';
export { default as SubscriptionDashboardRoot } from './ui/SubscriptionDashboard';
export { default as SubscriptionDetailsRoot } from './ui/SubscriptionDetails';
export { default as SubscriptionGateRoot } from './ui/SubscriptionGate';
export { default as SubscriptionPurchaseHeader } from './ui/SubscriptionPurchaseHeader';
export { default as SubscriptionRouteGuardRoot } from './ui/SubscriptionRouteGuard';
export { default as SubscriptionSettingsSectionRoot } from './ui/SubscriptionSettingsSection';
export { default as SubscriptionStatusWidgetRoot } from './ui/SubscriptionStatusWidget';
export { default as SuccessHeader } from './ui/SuccessHeader';
export { default as TransactionGridRoot } from './ui/TransactionGrid';
export { default as TransactionListRoot } from './ui/TransactionList';
export { default as UpgradePromptRoot } from './ui/UpgradePrompt';

// State Management (Hooks)
export {
  useSubscription,
  useOrganizationSubscription,
  usePaymentVerification,
  useSubscriptionPlansData,
  useSubscriptionQuery,
  useFeatureGate,
  clearFeatureAccessCache
} from './model';

// API Services
export {
  getActiveSubscription,
  getUserSubscriptions,
  getSubscriptionPayments,
  getUserPayments,
  checkActiveSubscription
} from './api/subscriptionService';

export {
  verifyPayment,
  handlePaymentSuccess
} from './api/paymentVerificationService';

export {
  loadRazorpayScript,
  createRazorpayOrder
} from './api/razorpayService';

export {
  getOrganizationSubscription,
  getOrganizationMembers,
  getUserLicenseAssignment
} from './api/organizationService';

export {
  getLicensePools,
  getLicensePoolById,
  getPoolAssignments
} from './api/licensePoolService';

export { default as entitlementService, EntitlementService } from './api/entitlementService';

// Utilities
export {
  isActiveOrPaused,
  isManageable,
  calculateDaysRemaining,
  calculateProgressPercentage,
  getSubscriptionStatusChecks
} from './lib/subscriptionHelpers';

export {
  hasFeatureAccess,
  getRequiredAddOn,
  isFeatureInBasePlan,
  getFeatureAccessLevel
} from './lib/featureGating';

export { default as generatePDFReceipt } from './lib/pdfReceiptGenerator';

// Types (re-export from model if needed)
export type {
  Subscription,
  SubscriptionPlan,
  LicensePool,
  OrganizationSubscription,
  PaymentTransaction
} from './model/types';

// API & Data Access
export * from './api';
export { capitalizeFirstLetter } from './lib/signupValidation';
export { getInitialFormData } from './lib/signupValidation';
export { formatOtp } from './lib/signupValidation';
export { validateSignupFields } from './lib/signupValidation';
export { formatPhoneNumber } from './lib/signupValidation';
export { default as paymentsApiService } from './api/paymentsApiService';
export { default as SignupFormFields, ALL_COUNTRIES, LANGUAGES } from './ui/shared/SignupFormFields';

export { default as addOnCatalogService } from './api/addOnCatalogService';

export { useSubscriptionAccess } from './model/subscriptionStore';

export { default as addOnAnalyticsService } from './api/addOnAnalyticsService';

export { formatDate } from './lib/subscriptionHelpers';

export { default as addOnPaymentService } from './api/addOnPaymentService';
