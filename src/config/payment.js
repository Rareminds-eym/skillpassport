/**
 * Payment Configuration
 * Handles environment-based pricing and Razorpay settings
 */

// Production domain for live payments
const PRODUCTION_DOMAIN = 'skillpassport.rareminds.in';

// Routes that should use LIVE Razorpay keys on production
const LIVE_KEY_ROUTES = [
  '/subscription/plans/school-student/purchase',
  '/register/plans'
];

// Razorpay Keys
const RAZORPAY_LIVE_KEY = import.meta.env.VITE_RAZORPAY_LIVE_KEY_ID;
const RAZORPAY_TEST_KEY = import.meta.env.VITE_RAZORPAY_TEST_KEY_ID;

/**
 * Check if current environment should use LIVE Razorpay key
 * LIVE key is used ONLY when:
 * 1. Domain is skillpassport.rareminds.in (production)
 * 2. Current route is one of the specified LIVE_KEY_ROUTES
 * 
 * @returns {boolean} True if should use LIVE key
 */
export const shouldUseLiveKey = () => {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  // Must be on production domain
  if (hostname !== PRODUCTION_DOMAIN) {
    console.log('🔧 Razorpay: Using TEST key (not production domain)');
    return false;
  }
  
  // Must be on one of the specified routes
  const isLiveRoute = LIVE_KEY_ROUTES.some(route => pathname.startsWith(route));
  
  if (isLiveRoute) {
    console.log('💳 Razorpay: Using LIVE key (production domain + live route)');
    return true;
  }
  
  console.log('🔧 Razorpay: Using TEST key (production domain but not live route)');
  return false;
};

/**
 * Get the appropriate Razorpay Key ID based on environment and route
 * @returns {string} Razorpay Key ID
 */
export const getRazorpayKeyId = () => {
  if (shouldUseLiveKey()) {
    return RAZORPAY_LIVE_KEY;
  }
  return RAZORPAY_TEST_KEY;
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
  pro: '1',
  enterprise: '1',
};

// Production pricing (actual prices)
const PRODUCTION_PRICES = {
  basic: '499',
  pro: '999',
  enterprise: '1999',
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
  LIVE_KEY_ROUTES,
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
