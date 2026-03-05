/**
 * Centralized API Configuration
 * 
 * Single source of truth for all API endpoints.
 * Uses Vite proxy in development (relative URLs) and full URLs in production.
 * 
 * @example
 * import { API_ENDPOINTS } from '@/config/api';
 * fetch(API_ENDPOINTS.email.send, { ... });
 */

// Environment detection
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
const mode = import.meta.env.MODE;

/**
 * Get base URL for API calls
 * - Development: Empty string (uses Vite proxy)
 * - Production: Full domain URL or environment override
 */
const getBaseUrl = (): string => {
  // Allow environment override for all modes
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Development: use relative URLs (Vite proxy handles routing)
  if (isDev) {
    return '';
  }

  // Production: use full domain
  return 'https://skillpassport.rareminds.in';
};

/**
 * Get API URL with optional environment override
 */
const getApiUrl = (path: string, envKey?: string): string => {
  if (envKey && import.meta.env[envKey]) {
    return import.meta.env[envKey] as string;
  }
  return `${getBaseUrl()}${path}`;
};

/**
 * API Endpoints Configuration
 * Organized by service domain
 */
export const API_ENDPOINTS = {
  // Email Service
  email: {
    base: getApiUrl('/api/email', 'VITE_EMAIL_API_URL'),
    send: getApiUrl('/api/email/send'),
    invitation: getApiUrl('/api/email/invitation'),
    countdown: getApiUrl('/api/email/countdown'),
    bulkCountdown: getApiUrl('/api/email/send-bulk-countdown'),
    eventConfirmation: getApiUrl('/api/email/event-confirmation'),
    eventOtp: getApiUrl('/api/email/event-otp'),
    downloadReceipt: (orderId: string) => getApiUrl(`/api/email/download-receipt/${orderId}`),
  },

  // Payments Service
  payments: {
    base: getApiUrl('/api/payments', 'VITE_PAYMENTS_API_URL'),
    // Payment operations
    createOrder: getApiUrl('/api/payments/create-order'),
    verifyPayment: getApiUrl('/api/payments/verify-payment'),
    webhook: getApiUrl('/api/payments/webhook'),
    // Subscription management
    getSubscription: getApiUrl('/api/payments/get-subscription'),
    checkAccess: getApiUrl('/api/payments/check-subscription-access'),
    cancelSubscription: getApiUrl('/api/payments/cancel-subscription'),
    deactivateSubscription: getApiUrl('/api/payments/deactivate-subscription'),
    pauseSubscription: getApiUrl('/api/payments/pause-subscription'),
    resumeSubscription: getApiUrl('/api/payments/resume-subscription'),
    // Plans
    subscriptionPlans: getApiUrl('/api/payments/subscription-plans'),
    subscriptionPlan: getApiUrl('/api/payments/subscription-plan'),
    subscriptionFeatures: getApiUrl('/api/payments/subscription-features'),
    // Add-ons
    addons: {
      catalog: getApiUrl('/api/payments/addon-catalog'),
      userEntitlements: getApiUrl('/api/payments/user-entitlements'),
      createOrder: getApiUrl('/api/payments/create-addon-order'),
      verifyPayment: getApiUrl('/api/payments/verify-addon-payment'),
      createBundleOrder: getApiUrl('/api/payments/create-bundle-order'),
      verifyBundlePayment: getApiUrl('/api/payments/verify-bundle-payment'),
      cancel: getApiUrl('/api/payments/cancel-addon'),
      checkAccess: getApiUrl('/api/payments/check-addon-access'),
    },
    // Organization
    org: {
      createOrder: getApiUrl('/api/payments/create-org-order'),
      verifyPayment: getApiUrl('/api/payments/verify-org-payment'),
      calculatePricing: getApiUrl('/api/payments/org-subscriptions/calculate-pricing'),
      purchase: getApiUrl('/api/payments/org-subscriptions/purchase'),
      subscriptions: getApiUrl('/api/payments/org-subscriptions'),
      updateSeatCount: (subscriptionId: string) => getApiUrl(`/api/payments/org-subscriptions/${subscriptionId}/seats`),
      licensePools: getApiUrl('/api/payments/license-pools'),
      createLicensePool: getApiUrl('/api/payments/license-pools'),
      updatePoolAllocation: (poolId: string) => getApiUrl(`/api/payments/license-pools/${poolId}/allocation`),
      configureAutoAssignment: (poolId: string) => getApiUrl(`/api/payments/license-pools/${poolId}/auto-assignment`),
      assignLicense: getApiUrl('/api/payments/license-assignments'),
      bulkAssignLicenses: getApiUrl('/api/payments/license-assignments/bulk'),
      transferLicense: getApiUrl('/api/payments/license-assignments/transfer'),
      unassignLicense: (assignmentId: string) => getApiUrl(`/api/payments/license-assignments/${assignmentId}`),
      userAssignments: (userId: string) => getApiUrl(`/api/payments/license-assignments/user/${userId}`),
      billing: {
        dashboard: getApiUrl('/api/payments/org-billing/dashboard'),
        invoices: getApiUrl('/api/payments/org-billing/invoices'),
        costProjection: getApiUrl('/api/payments/org-billing/cost-projection'),
        calculateSeatAddition: getApiUrl('/api/payments/org-billing/calculate-seat-addition'),
        downloadInvoice: (invoiceId: string) => getApiUrl(`/api/payments/org-billing/invoice/${invoiceId}/download`),
      },
      invitations: {
        invite: getApiUrl('/api/payments/org-invitations'),
        bulkInvite: getApiUrl('/api/payments/org-invitations/bulk'),
        list: getApiUrl('/api/payments/org-invitations'),
        resend: (invitationId: string) => getApiUrl(`/api/payments/org-invitations/${invitationId}/resend`),
        cancel: (invitationId: string) => getApiUrl(`/api/payments/org-invitations/${invitationId}`),
        accept: getApiUrl('/api/payments/org-invitations/accept'),
        stats: getApiUrl('/api/payments/org-invitations/stats'),
      },
    },
    // Events
    events: {
      createOrder: getApiUrl('/api/payments/create-event-order'),
      updateStatus: getApiUrl('/api/payments/update-event-payment-status'),
      expireSubscriptions: getApiUrl('/api/payments/expire-subscriptions'),
    },
    // Entitlement lifecycle (CRON)
    lifecycle: {
      process: getApiUrl('/api/payments/process-entitlement-lifecycle'),
      expire: getApiUrl('/api/payments/expire-entitlements'),
      reminders: getApiUrl('/api/payments/send-renewal-reminders'),
      autoRenew: getApiUrl('/api/payments/process-auto-renewals'),
    },
  },

  // Storage Service
  storage: {
    base: getApiUrl('/api/storage', 'VITE_STORAGE_API_URL'),
    upload: getApiUrl('/api/storage/upload'),
    delete: getApiUrl('/api/storage/delete'),
    presigned: getApiUrl('/api/storage/presigned'),
    documentAccess: getApiUrl('/api/storage/document-access'),
    signedUrl: getApiUrl('/api/storage/signed-url'),
    uploadPaymentReceipt: getApiUrl('/api/storage/upload-payment-receipt'),
    paymentReceipt: getApiUrl('/api/storage/payment-receipt'),
    paymentReceiptPresigned: getApiUrl('/api/storage/payment-receipt/presigned'),
    extractContent: getApiUrl('/api/storage/extract-content'),
    courseCertificate: getApiUrl('/api/storage/course-certificate'),
    files: (courseId: string, lessonId: string) => getApiUrl(`/api/storage/files/${courseId}/${lessonId}`),
  },

  // User Service
  user: {
    base: getApiUrl('/api/user'),
    signup: getApiUrl('/api/user/signup'),
    profile: getApiUrl('/api/user/profile'),
    schools: getApiUrl('/api/user/schools'),
    colleges: getApiUrl('/api/user/colleges'),
    universities: getApiUrl('/api/user/universities'),
  },

  // Career Service
  career: {
    base: getApiUrl('/api/career'),
    recommend: getApiUrl('/api/career/recommend'),
    chat: getApiUrl('/api/career/chat'),
  },

  // Course Service
  course: {
    base: getApiUrl('/api/course'),
    aiTutor: getApiUrl('/api/course/ai-tutor-chat'),
  },

  // Assessment Service
  assessment: {
    base: getApiUrl('/api/assessment'),
    generate: getApiUrl('/api/assessment/generate'),
  },

  // OTP Service
  otp: {
    base: getApiUrl('/api/otp'),
    send: getApiUrl('/api/otp/send'),
    verify: getApiUrl('/api/otp/verify'),
  },

  // Streak Service
  streak: {
    base: getApiUrl('/api/streak'),
    user: (userId: string) => getApiUrl(`/api/streak/user/${userId}`),
    update: getApiUrl('/api/streak/update'),
  },

  // Role Overview Service
  roleOverview: {
    base: getApiUrl('/api/role-overview'),
    matchCourses: getApiUrl('/api/role-overview/match-courses'),
  },

  // Adaptive Session Service
  adaptiveSession: {
    base: getApiUrl('/api/adaptive-session'),
    initialize: getApiUrl('/api/adaptive-session/initialize'),
  },
} as const;

/**
 * Legacy exports for backward compatibility
 * @deprecated Use API_ENDPOINTS instead
 */
export const EMAIL_API_URL = API_ENDPOINTS.email.base;
export const PAYMENTS_API_URL = API_ENDPOINTS.payments.base;
export const STORAGE_API_URL = API_ENDPOINTS.storage.base;

/**
 * Utility function to get any API URL
 * @param service - Service name
 * @param path - Optional path within service
 */
export const getApiEndpoint = (service: keyof typeof API_ENDPOINTS, path?: string): string => {
  const serviceConfig = API_ENDPOINTS[service];
  if (typeof serviceConfig === 'string') {
    return path ? `${serviceConfig}${path}` : serviceConfig;
  }
  return (serviceConfig as any).base;
};

/**
 * Get current environment info (useful for debugging)
 */
export const ENV_INFO = {
  mode,
  isDev,
  isProd,
  baseUrl: getBaseUrl(),
} as const;

// Log configuration in development
if (isDev) {
  console.log('[API Config] Environment:', ENV_INFO);
  console.log('[API Config] Base URL:', getBaseUrl());
}
