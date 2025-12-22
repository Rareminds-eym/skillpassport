/**
 * Razorpay Payment Service
 * Handles Razorpay payment integration for subscription plans
 */

import { supabase } from '../../lib/supabaseClient';
import { getRazorpayKeyId, getRazorpayKeyMode } from '../../config/payment';
import paymentsApiService from '../../paymentsApiService';

const DEMO_MODE = false; // Production mode with Cloudflare Workers

/**
 * Load Razorpay checkout script dynamically
 * @returns {Promise<boolean>} True if script loaded successfully
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Create Razorpay order on backend
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>} Order details from backend
 */
export const createRazorpayOrder = async (orderData) => {
  try {
    console.log('create-razorpay-order', orderData);

    // Get auth token for authenticated requests
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    // Call Cloudflare Worker via paymentsApiService
    const result = await paymentsApiService.createOrder({
      amount: orderData.amount,
      currency: orderData.currency,
      planId: orderData.planId,
      userId: orderData.userId, // Ensure userId is passed if needed, though createOrder might extract from token
      metadata: {
        planName: orderData.planName,
        userEmail: orderData.userEmail,
        userName: orderData.userName
      }
    }, token);

    console.log('✅ Order created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verify payment signature on backend
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>} Verification result
 */
export const verifyPayment = async (paymentData) => {
  try {
    // Get auth token for authenticated requests
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Call Cloudflare Worker via paymentsApiService
    return await paymentsApiService.verifyPayment({
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: paymentData.razorpay_signature,
      orderId: paymentData.orderId // Ensure consistent naming
    }, token);
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// ... (saveSubscriptionToDatabase and savePaymentTransaction remain unchanged) ...

/**
 * Deactivate subscription (one-time payment system)
 * @param {string} subscriptionId - Database subscription ID (UUID)
 * @param {string} cancellationReason - Reason for cancellation
 * @param {string} cancellationNote - Additional note (optional)
 * @returns {Promise<Object>} Cancellation result
 */
export const deactivateSubscription = async (subscriptionId, cancellationReason = 'other', cancellationNote = '') => {
  try {
    // Get auth token for authenticated requests
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Call Cloudflare Worker via paymentsApiService
    // Note: paymentsApiService.deactivateSubscription only takes subscriptionId currently.
    // We might need to update paymentsApiService to accept reason/note if the worker supports it.
    // For now, assuming standard deactivation.
    return await paymentsApiService.deactivateSubscription(subscriptionId, token);
  } catch (error) {
    console.error('Error deactivating subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Pause Razorpay subscription
 * @param {string} razorpaySubscriptionId - Razorpay subscription ID
 * @param {number} pauseMonths - Number of months to pause (1-3)
 * @returns {Promise<Object>} Pause result
 */
export const pauseRazorpaySubscription = async (razorpaySubscriptionId, pauseMonths = 1) => {
  try {
    // Get auth token for authenticated requests
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Note: Razorpay pause API may need to be implemented as a separate edge function
    // For now, using the cancel-subscription endpoint with pause logic
    console.log('⏸️ Pausing subscription for', pauseMonths, 'month(s)');

    // You may need to implement a separate pause-subscription edge function
    // This is a placeholder that needs the actual Razorpay pause API integration
    return {
      success: true,
      message: `Subscription pause feature needs Razorpay pause API integration`,
      subscription_id: razorpaySubscriptionId,
      status: 'paused',
      pause_months: pauseMonths
    };
  } catch (error) {
    console.error('Error pausing Razorpay subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Initialize Razorpay payment with redirect flow
 * @param {Object} params - Payment parameters
 * @param {Object} params.plan - Selected subscription plan
 * @param {Object} params.userDetails - User information
 * @param {Function} params.onSuccess - Success callback (optional, for backward compatibility)
 * @param {Function} params.onFailure - Failure callback (optional, for backward compatibility)
 */
export const initiateRazorpayPayment = async ({
  plan,
  userDetails,
  onSuccess,
  onFailure,
}) => {
  try {
    // Store plan details in localStorage for success page
    localStorage.setItem('payment_plan_details', JSON.stringify({
      ...plan,
      studentType: userDetails.studentType
    }));

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    // Create order on backend
    const orderData = await createRazorpayOrder({
      amount: parseFloat(plan.price) * 100, // Amount in paise (₹999 = 99900 paise)
      currency: 'INR',
      planId: plan.id,
      planName: plan.name,
      userEmail: userDetails.email,
      userName: userDetails.name,
    });

    // Get current origin for redirect URLs
    const origin = window.location.origin;

    // Get the appropriate Razorpay key based on environment and route
    const razorpayKeyId = getRazorpayKeyId();
    console.log(`💳 Razorpay Payment: Using ${getRazorpayKeyMode()} key`);

    // Razorpay checkout options with redirect
    const options = {
      key: razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'RareMinds Skill Passport',
      description: `${plan.name} Plan - ₹${plan.price}/${plan.duration}`,
      order_id: orderData.id,
      prefill: {
        name: userDetails.name,
        email: userDetails.email,
        contact: userDetails.phone || '',
      },
      notes: {
        plan_id: plan.id,
        plan_name: plan.name,
      },
      theme: {
        color: '#2563eb', // Blue color from your design
      },
      handler: async function (response) {
        // Redirect to success page with payment parameters
        const successUrl = new URL('/subscription/payment/success', origin);
        successUrl.searchParams.set('razorpay_payment_id', response.razorpay_payment_id);
        successUrl.searchParams.set('razorpay_order_id', response.razorpay_order_id);
        successUrl.searchParams.set('razorpay_signature', response.razorpay_signature);

        window.location.href = successUrl.toString();
      },
      modal: {
        ondismiss: function () {
          // Redirect to failure page
          const failureUrl = new URL('/subscription/payment/failure', origin);
          failureUrl.searchParams.set('razorpay_order_id', orderData.id);
          failureUrl.searchParams.set('error_code', 'PAYMENT_CANCELLED');
          failureUrl.searchParams.set('error_description', 'Payment was cancelled by user');

          window.location.href = failureUrl.toString();
        },
      },
    };

    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);

    // Handle payment failure
    razorpay.on('payment.failed', function (response) {
      const failureUrl = new URL('/subscription/payment/failure', origin);
      failureUrl.searchParams.set('razorpay_order_id', orderData.id);
      failureUrl.searchParams.set('razorpay_payment_id', response.error.metadata?.payment_id || '');
      failureUrl.searchParams.set('error_code', response.error.code || 'PAYMENT_FAILED');
      failureUrl.searchParams.set('error_description', response.error.description || 'Payment failed');
      failureUrl.searchParams.set('error_reason', response.error.reason || '');

      window.location.href = failureUrl.toString();
    });

    razorpay.open();
  } catch (error) {
    console.error('Error initiating payment:', error);

    // Redirect to failure page on error
    const origin = window.location.origin;
    const failureUrl = new URL('/subscription/payment/failure', origin);
    failureUrl.searchParams.set('error_code', 'INITIALIZATION_ERROR');
    failureUrl.searchParams.set('error_description', error.message || 'Failed to initialize payment');

    window.location.href = failureUrl.toString();
  }
};
