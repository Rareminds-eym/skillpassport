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
    send: getApiUrl('/api/email/send', 'VITE_EMAIL_API_URL') + (getApiUrl('/api/email', 'VITE_EMAIL_API_URL').includes('/send') ? '' : '/send'),
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
    createOrder: getApiUrl('/api/payments/create-order'),
    verifyPayment: getApiUrl('/api/payments/verify-payment'),
    webhook: getApiUrl('/api/payments/webhook'),
    subscriptionPlans: getApiUrl('/api/payments/subscription-plans'),
    checkAccess: getApiUrl('/api/payments/check-subscription-access'),
    mySubscriptions: getApiUrl('/api/payments/my-subscriptions'),
    cancelSubscription: getApiUrl('/api/payments/cancel-subscription'),
    // Add-ons
    addons: {
      createOrder: getApiUrl('/api/payments/addons/create-order'),
      verifyPayment: getApiUrl('/api/payments/addons/verify-payment'),
      myAddons: getApiUrl('/api/payments/addons/my-addons'),
    },
    // Organization orders
    org: {
      createOrder: getApiUrl('/api/payments/org/create-order'),
      verifyPayment: getApiUrl('/api/payments/org/verify-payment'),
      myOrders: getApiUrl('/api/payments/org/my-orders'),
    },
    // Events
    events: {
      createOrder: getApiUrl('/api/payments/events/create-order'),
      verifyPayment: getApiUrl('/api/payments/events/verify-payment'),
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
    // Add more user endpoints as needed
  },

  // Other Services (add as needed)
  career: {
    base: getApiUrl('/api/career'),
    recommend: getApiUrl('/api/career/recommend'),
    chat: getApiUrl('/api/career/chat'),
  },

  course: {
    base: getApiUrl('/api/course'),
    aiTutor: getApiUrl('/api/course/ai-tutor-chat'),
  },

  assessment: {
    base: getApiUrl('/api/assessment'),
    generate: getApiUrl('/api/assessment/generate'),
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
