/**
 * Payment Configuration
 * Handles environment-based pricing and Razorpay settings
 */

// Detect if we're in development/testing environment
const isDevEnvironment = () => {
  const hostname = window.location.hostname;
  
  // Development environments
  const devHosts = [
    'localhost',
    '127.0.0.1',
    'rareminds-skillpassport.netlify.app', // Netlify demo URL
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
