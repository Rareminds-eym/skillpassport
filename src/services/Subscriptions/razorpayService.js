/**
 * Razorpay Service
 *
 * Handles Razorpay browser SDK integration for payment checkout.
 * This service MUST run in the browser (loads Razorpay script, opens checkout modal).
 *
 * BROWSER-ONLY FUNCTIONS:
 * - loadRazorpayScript()      - Load Razorpay checkout.js
 * - initiateRazorpayPayment() - Open Razorpay checkout modal
 *
 * API CALLS (via paymentsApiService → Worker):
 * - createRazorpayOrder()     - Create order via Worker
 * - verifyPayment()           - Verify payment via Worker
 */

import { supabase } from '../../lib/supabaseClient';
import { getRazorpayKeyId, getRazorpayKeyMode } from '../../config/payment';
import paymentsApiService from '../paymentsApiService';

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
 * Create Razorpay order via Cloudflare Worker
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>} Order details from Razorpay
 */
export const createRazorpayOrder = async (orderData) => {
  try {
    console.log('📦 Creating Razorpay order:', orderData);

    // Get auth token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    // Call Worker via paymentsApiService
    const result = await paymentsApiService.createOrder(
      {
        amount: orderData.amount,
        currency: orderData.currency,
        planId: orderData.planId,
        planName: orderData.planName,
        userEmail: orderData.userEmail,
        userName: orderData.userName,
      },
      token
    );

    console.log('✅ Order created:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Error creating order:', error);

    // Check if this is a "subscription exists" error (409 Conflict)
    if (error.message?.includes('already have an active subscription')) {
      // Create a custom error with additional info
      const subscriptionExistsError = new Error(error.message);
      subscriptionExistsError.code = 'SUBSCRIPTION_EXISTS';
      subscriptionExistsError.isSubscriptionExists = true;
      throw subscriptionExistsError;
    }

    throw error;
  }
};

/**
 * Verify payment via Cloudflare Worker
 * Worker handles: signature verification + subscription creation + transaction logging
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>} Verification result with subscription
 */
export const verifyPayment = async (paymentData) => {
  try {
    // Get auth token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Call Worker via paymentsApiService
    return await paymentsApiService.verifyPayment(
      {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        plan: paymentData.plan,
      },
      token
    );
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    throw error;
  }
};

/**
 * Initialize Razorpay payment checkout
 * Opens Razorpay modal and handles payment flow with redirect
 *
 * @param {Object} params - Payment parameters
 * @param {Object} params.plan - Selected subscription plan
 * @param {Object} params.userDetails - User information
 */
export const initiateRazorpayPayment = async ({ plan, userDetails }) => {
  try {
    // Store plan details in localStorage for success page
    localStorage.setItem(
      'payment_plan_details',
      JSON.stringify({
        ...plan,
        studentType: userDetails.studentType,
      })
    );

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    // Create order via Worker
    const orderData = await createRazorpayOrder({
      amount: parseFloat(plan.price) * 100, // Convert to paise
      currency: 'INR',
      planId: plan.id,
      planName: plan.name,
      userEmail: userDetails.email,
      userName: userDetails.name,
    });

    // Get current origin for redirect URLs
    const origin = window.location.origin;

    // Get Razorpay key
    const razorpayKeyId = getRazorpayKeyId();
    console.log(`💳 Using ${getRazorpayKeyMode()} Razorpay key`);

    // Razorpay checkout options
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
        color: '#2563eb',
      },
      handler: function (response) {
        // Redirect to success page with payment params
        const successUrl = new URL('/subscription/payment/success', origin);
        successUrl.searchParams.set('razorpay_payment_id', response.razorpay_payment_id);
        successUrl.searchParams.set('razorpay_order_id', response.razorpay_order_id);
        successUrl.searchParams.set('razorpay_signature', response.razorpay_signature);
        window.location.href = successUrl.toString();
      },
      modal: {
        ondismiss: function () {
          // Redirect to failure page on cancel
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
      failureUrl.searchParams.set(
        'error_description',
        response.error.description || 'Payment failed'
      );
      failureUrl.searchParams.set('error_reason', response.error.reason || '');
      window.location.href = failureUrl.toString();
    });

    razorpay.open();
  } catch (error) {
    console.error('❌ Error initiating payment:', error);

    // Handle "subscription already exists" error specially
    if (error.code === 'SUBSCRIPTION_EXISTS' || error.isSubscriptionExists) {
      const origin = window.location.origin;
      // Get the base path from current location for role-based routing
      const pathname = window.location.pathname;
      let basePath = '';
      if (pathname.startsWith('/student')) basePath = '/student';
      else if (pathname.startsWith('/recruitment')) basePath = '/recruitment';
      else if (pathname.startsWith('/educator')) basePath = '/educator';
      else if (pathname.startsWith('/college-admin')) basePath = '/college-admin';
      else if (pathname.startsWith('/school-admin')) basePath = '/school-admin';
      else if (pathname.startsWith('/university-admin')) basePath = '/university-admin';

      // Redirect to manage subscription page instead of failure page
      const manageUrl = new URL(`${basePath}/subscription/manage`, origin);
      manageUrl.searchParams.set('message', 'You already have an active subscription');
      window.location.href = manageUrl.toString();
      return;
    }

    // Redirect to failure page on other errors
    const origin = window.location.origin;
    const failureUrl = new URL('/subscription/payment/failure', origin);
    failureUrl.searchParams.set('error_code', 'INITIALIZATION_ERROR');
    failureUrl.searchParams.set(
      'error_description',
      error.message || 'Failed to initialize payment'
    );
    window.location.href = failureUrl.toString();
  }
};
