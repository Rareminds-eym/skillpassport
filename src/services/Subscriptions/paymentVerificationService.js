/**
 * Payment Verification Service
 * 
 * Handles payment verification via Cloudflare Worker.
 * Worker handles: signature verification + subscription creation + transaction logging
 * 
 * This service provides:
 * - verifyPaymentSignature() - Verify payment via Worker
 * - extractPaymentParams()   - Extract params from URL
 * - validatePaymentParams()  - Validate required params
 * - clearVerificationCache() - Clear cache (for testing)
 */

import { supabase } from '../../lib/supabaseClient';
import paymentsApiService from '../paymentsApiService';

// Cache for verification results (5 minutes TTL)
const verificationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Verify payment signature via Cloudflare Worker
 * Worker handles: verification + subscription creation + transaction logging
 * 
 * @param {Object} paymentData - Payment verification data
 * @param {string} paymentData.razorpay_payment_id - Payment ID from Razorpay
 * @param {string} paymentData.razorpay_order_id - Order ID from Razorpay
 * @param {string} paymentData.razorpay_signature - Signature from Razorpay
 * @param {Object} paymentData.plan - Plan details for subscription creation
 * @returns {Promise<Object>} Verification result with subscription data
 */
export const verifyPaymentSignature = async (paymentData) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan } = paymentData;

    // Validate required parameters
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return {
        success: false,
        verified: false,
        error: 'Missing required payment parameters',
        errorCode: 'MISSING_PARAMETERS'
      };
    }

    // Check cache first
    const cacheKey = `${razorpay_payment_id}_${razorpay_order_id}`;
    const cached = verificationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Using cached verification result');
      return cached.result;
    }

    // Get auth token (optional - Worker can verify via order)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Call Worker - handles verification + subscription creation
    const result = await paymentsApiService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
    }, token);

    // Cache the result
    verificationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    return {
      success: false,
      verified: false,
      error: error.message || 'Payment verification failed',
      errorCode: 'VERIFICATION_ERROR'
    };
  }
};

/**
 * Extract payment parameters from URL
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Extracted payment parameters
 */
export const extractPaymentParams = (searchParams) => {
  return {
    razorpay_payment_id: searchParams.get('razorpay_payment_id') || searchParams.get('payment_id'),
    razorpay_order_id: searchParams.get('razorpay_order_id') || searchParams.get('order_id'),
    razorpay_signature: searchParams.get('razorpay_signature') || searchParams.get('signature'),
    error_code: searchParams.get('error[code]') || searchParams.get('error_code'),
    error_description: searchParams.get('error[description]') || searchParams.get('error_description'),
    error_reason: searchParams.get('error[reason]') || searchParams.get('error_reason')
  };
};

/**
 * Validate payment parameters
 * @param {Object} params - Payment parameters
 * @returns {Object} Validation result
 */
export const validatePaymentParams = (params) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = params;
  const errors = [];

  if (!razorpay_payment_id) errors.push('Payment ID is missing');
  if (!razorpay_order_id) errors.push('Order ID is missing');
  if (!razorpay_signature) errors.push('Payment signature is missing');

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Clear verification cache (useful for testing)
 */
export const clearVerificationCache = () => {
  verificationCache.clear();
  console.log('✅ Verification cache cleared');
};
