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
  PaymentFailure
} from './ui/shared';

// State Management (Hooks)
export {
  useSubscription,
  useOrganizationSubscription,
  usePaymentVerification,
  useSubscriptionPlansData,
  useSubscriptionQuery
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

export { generatePDFReceipt } from './lib/pdfReceiptGenerator';

// Types (re-export from model if needed)
export type {
  Subscription,
  SubscriptionPlan,
  LicensePool,
  OrganizationSubscription,
  PaymentTransaction
} from './model/types';
