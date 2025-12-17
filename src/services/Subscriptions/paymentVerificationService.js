/**
 * Payment Verification Service
 * Handles payment verification, transaction logging, and duplicate detection
 */

import { supabase } from '../../lib/supabaseClient';
import { checkAuthentication } from '../authService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Cache for verification results (5 minutes TTL)
const verificationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Verify payment signature with Razorpay
 * @param {Object} paymentData - Payment verification data
 * @param {string} paymentData.razorpay_payment_id - Payment ID from Razorpay
 * @param {string} paymentData.razorpay_order_id - Order ID from Razorpay
 * @param {string} paymentData.razorpay_signature - Signature from Razorpay
 * @returns {Promise<Object>} Verification result
 */
export const verifyPaymentSignature = async (paymentData) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentData;

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

    // Check for duplicate transaction
    const isDuplicate = await checkDuplicateTransaction(razorpay_payment_id);
    if (isDuplicate) {
      console.warn('⚠️ Duplicate transaction detected:', razorpay_payment_id);
      return {
        success: false,
        verified: false,
        error: 'This payment has already been processed',
        errorCode: 'DUPLICATE_TRANSACTION'
      };
    }

    // Get auth token for authenticated requests (optional - Edge Function will verify via order)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Call Supabase Edge Function to verify payment signature
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Verification failed' }));
      return {
        success: false,
        verified: false,
        error: errorData.error || 'Payment verification failed',
        errorCode: 'VERIFICATION_FAILED'
      };
    }

    const result = await response.json();

    // Cache the result
    verificationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('❌ Error verifying payment signature:', error);
    return {
      success: false,
      verified: false,
      error: error.message || 'Payment verification failed',
      errorCode: 'VERIFICATION_ERROR'
    };
  }
};

/**
 * Check if a transaction has already been processed
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @returns {Promise<boolean>} True if duplicate exists
 */
export const checkDuplicateTransaction = async (razorpayPaymentId) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('razorpay_payment_id', razorpayPaymentId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error checking duplicate transaction:', error);
      return false; // Fail open - allow transaction to proceed
    }

    return !!data;
  } catch (error) {
    console.error('❌ Error in duplicate check:', error);
    return false;
  }
};

/**
 * Log payment transaction to database
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>} Result of logging operation
 */
export const logPaymentTransaction = async (transactionData) => {
  try {
    const authResult = await checkAuthentication();

    if (!authResult.isAuthenticated) {
      return {
        success: false,
        error: 'User must be authenticated to log transaction'
      };
    }

    const userId = authResult.user.id;

    const transaction = {
      subscription_id: transactionData.subscription_id || null,
      user_id: userId,
      razorpay_payment_id: transactionData.razorpay_payment_id,
      razorpay_order_id: transactionData.razorpay_order_id || null,
      amount: transactionData.amount,
      currency: transactionData.currency || 'INR',
      status: transactionData.status || 'success',
      payment_method: transactionData.payment_method || 'card',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      console.error('❌ Error logging payment transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Payment transaction logged successfully:', data.id);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('❌ Error in logPaymentTransaction:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Log failed payment transaction
 * @param {Object} failureData - Failure details
 * @returns {Promise<Object>} Result of logging operation
 */
export const logFailedTransaction = async (failureData) => {
  try {
    const authResult = await checkAuthentication();

    if (!authResult.isAuthenticated) {
      return {
        success: false,
        error: 'User must be authenticated to log transaction'
      };
    }

    const userId = authResult.user.id;

    const transaction = {
      user_id: userId,
      razorpay_payment_id: failureData.razorpay_payment_id || null,
      razorpay_order_id: failureData.razorpay_order_id || null,
      amount: failureData.amount,
      currency: failureData.currency || 'INR',
      status: 'failed',
      payment_method: failureData.payment_method || 'unknown',
      failure_reason: failureData.error_description || failureData.error || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      console.error('❌ Error logging failed transaction:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Failed transaction logged:', data.id);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('❌ Error in logFailedTransaction:', error);
    return {
      success: false,
      error: error.message
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

  if (!razorpay_payment_id) {
    errors.push('Payment ID is missing');
  }

  if (!razorpay_order_id) {
    errors.push('Order ID is missing');
  }

  if (!razorpay_signature) {
    errors.push('Payment signature is missing');
  }

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
