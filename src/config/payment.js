/**
 * Payment Configuration
 * Handles environment-based pricing and Razorpay settings
 * 
 * Simple logic:
 * - Production (skillpassport.rareminds.in) → LIVE keys
 * - Everything else (dev, localhost, etc.) → TEST keys
 */

// Production domain for live payments
const PRODUCTION_DOMAIN = 'skillpassport.rareminds.in';

// Razorpay Keys - with fallbacks
const RAZORPAY_LIVE_KEY = import.meta.env.VITE_RAZORPAY_LIVE_KEY_ID;
const RAZORPAY_TEST_KEY = import.meta.env.VITE_RAZORPAY_TEST_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY_ID;

// Debug: Log available keys at startup
console.log('🔑 Razorpay Config:', {
  hasLiveKey: !!RAZORPAY_LIVE_KEY,
  hasTestKey: !!RAZORPAY_TEST_KEY,
  testKeyPrefix: RAZORPAY_TEST_KEY?.substring(0, 15) + '...',
  liveKeyPrefix: RAZORPAY_LIVE_KEY?.substring(0, 15) + '...',
});

/**
 * Check if current environment is production
 * @returns {boolean} True if production domain
 */
export const isProductionEnvironment = () => {
  return window.location.hostname === PRODUCTION_DOMAIN;
};

/**
 * Check if current environment should use LIVE Razorpay key
 * LIVE key is used ONLY on production domain
 * 
 * @returns {boolean} True if should use LIVE key
 */
export const shouldUseLiveKey = () => {
  if (isProductionEnvironment()) {
    console.log('� Razorpay:  Using LIVE key (production domain)');
    return true;
  }
  
  console.log('🔧 Razorpay: Using TEST key (dev/staging environment)');
  return false;
};

/**
 * Get the appropriate Razorpay Key ID based on environment and route
 * @returns {string} Razorpay Key ID
 */
export const getRazorpayKeyId = () => {
  const key = shouldUseLiveKey() ? RAZORPAY_LIVE_KEY : RAZORPAY_TEST_KEY;
  
  if (!key) {
    console.error('❌ Razorpay Key Missing!', {
      mode: shouldUseLiveKey() ? 'LIVE' : 'TEST',
      VITE_RAZORPAY_LIVE_KEY_ID: !!import.meta.env.VITE_RAZORPAY_LIVE_KEY_ID,
      VITE_RAZORPAY_TEST_KEY_ID: !!import.meta.env.VITE_RAZORPAY_TEST_KEY_ID,
      VITE_RAZORPAY_KEY_ID: !!import.meta.env.VITE_RAZORPAY_KEY_ID,
    });
    throw new Error(`Razorpay ${shouldUseLiveKey() ? 'LIVE' : 'TEST'} key is not configured. Check your .env file.`);
  }
  
  return key;
};

/**
 * Get Razorpay key mode for debugging
 * @returns {string} 'LIVE' or 'TEST'
 */
export const getRazorpayKeyMode = () => {
  return shouldUseLiveKey() ? 'LIVE' : 'TEST';
};

// Detect if we're in development/testing environment
const isDevEnvironment = () => {
  const hostname = window.location.hostname;
  
  // Development environments
  const devHosts = [
    'localhost',
    '127.0.0.1',
    'rareminds-skillpassport.netlify.app',
    'dev-skillpassport.rareminds.in' // Netlify demo URL
    // Add any other testing domains here
  ];
  
  return devHosts.some(host => hostname.includes(host));
};

// Test pricing (₹1 for all plans)
const TEST_PRICES = {
  basic: '1',
  professional: '1',
  pro: '1', // Legacy alias
  enterprise: '1',
  ecosystem: '1',
};

// Production pricing (actual prices)
const PRODUCTION_PRICES = {
  basic: '499',
  professional: '999',
  pro: '999', // Legacy alias
  enterprise: '2999',
  ecosystem: null, // Contact sales
};

// Export configuration
export const PAYMENT_CONFIG = {
  // Automatically use ₹1 for localhost/Netlify, actual prices for production
  PRICES: isDevEnvironment() ? TEST_PRICES : PRODUCTION_PRICES,
  
  // For debugging - check which environment
  IS_DEV: isDevEnvironment(),
  
  // Current hostname
  HOSTNAME: window.location.hostname,
  
  // Razorpay key info
  RAZORPAY_MODE: getRazorpayKeyMode(),
  PRODUCTION_DOMAIN,
};

/**
 * Get price for a specific plan
 * @param {string} planId - Plan ID (basic, pro, enterprise)
 * @returns {string} Price as string
 */
export const getPlanPrice = (planId) => {
  return PAYMENT_CONFIG.PRICES[planId] || PAYMENT_CONFIG.PRICES.basic;
};

/**
 * Check if currently in test pricing mode
 * @returns {boolean}
 */
export const isTestPricing = () => {
  return PAYMENT_CONFIG.IS_DEV;
};
