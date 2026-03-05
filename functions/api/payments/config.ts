/**
 * Configuration constants for Payments API
 */

// Valid plan amounts in paise
export const VALID_AMOUNTS = [100, 49900, 99900, 199900];
export const MAX_AMOUNT = 1000000;

// External service URLs
export const EMAIL_API_URL = 'http://localhost:8788/api/email/send';
export const STORAGE_API_URL = 'http://localhost:8788/api/storage';

// Plan configuration
export const PLAN_DURATIONS: Record<string, number> = {
  monthly: 30,
  yearly: 365,
  lifetime: 36500, // ~100 years
};

// Grace period for expired subscriptions
export const GRACE_PERIOD_DAYS = 3;

// Event order limits
export const MAX_EVENT_AMOUNT_RUPEES = 10000000; // ₹1 crore max
export const EVENT_TEST_MODE_MAX_AMOUNT = 5000000; // ₹50,000 in paise for test mode

// Test mode max amount for subscription orders
export const TEST_MODE_MAX_AMOUNT = 100000;
