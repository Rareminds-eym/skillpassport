/**
 * Configuration constants for Payments API Worker
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Valid plan amounts in paise
export const VALID_AMOUNTS = [100, 49900, 99900, 199900];
export const MAX_AMOUNT = 1000000;

// Production domain for live payments
export const PRODUCTION_DOMAIN = 'skillpassport.rareminds.in';

// External service URLs
export const EMAIL_API_URL = 'https://email-api.dark-mode-d021.workers.dev';
export const STORAGE_API_URL = 'https://storage-api.dark-mode-d021.workers.dev';

// Plan configuration
export const PLAN_DURATIONS: Record<string, number> = {
  monthly: 30,
  yearly: 365,
  lifetime: 36500, // ~100 years
};
