/**
 * API Configuration
 * Centralized API endpoint configuration for all environments
 */

const getEmailApiUrl = (): string => {
  // Always prefer explicit environment variable
  if (import.meta.env.VITE_EMAIL_API_URL) {
    return import.meta.env.VITE_EMAIL_API_URL;
  }
  
  throw new Error('VITE_EMAIL_API_URL is not configured. Please set it in your .env file.');
};

const getPaymentsApiUrl = (): string => {
  if (import.meta.env.VITE_PAYMENTS_API_URL) {
    return import.meta.env.VITE_PAYMENTS_API_URL;
  }
  
  throw new Error('VITE_PAYMENTS_API_URL is not configured. Please set it in your .env file.');
};

export const API_CONFIG = {
  EMAIL_API_URL: getEmailApiUrl(),
  PAYMENTS_API_URL: getPaymentsApiUrl(),
} as const;
