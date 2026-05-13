import { getCurrentSession } from '@/shared/api/authUtils';
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

import paymentsApiService from './paymentsApiService';

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
    // Get auth token
    const { data: { session } } = await getCurrentSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    // Call Worker via paymentsApiService
    const result = await paymentsApiService.createOrder({
      amount: orderData.amount,
      currency: orderData.currency,
      planId: orderData.planId,
      planName: orderData.planName,
      userEmail: orderData.userEmail,
      userName: orderData.userName,
      isUpgrade: orderData.isUpgrade,
    }, token);

    return result;
  } catch (error) {
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
    const { data: { session } } = await getCurrentSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    // Call Worker via paymentsApiService
    return await paymentsApiService.verifyPayment({
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: paymentData.razorpay_signature,
      plan: paymentData.plan,
    }, token);
  } catch (error) {
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
/**
 * Payment outcome types for callback-driven SPA navigation.
 * No window.location.href — all outcomes are communicated back
 * to the calling React component via callbacks.
 */
export interface PaymentSuccessResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  plan: Record<string, unknown>;
  verificationResult?: Record<string, unknown>;
}

export interface PaymentFailureResult {
  error_code: string;
  error_description: string;
  error_reason?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
}

export interface InitiatePaymentParams {
  plan: Record<string, unknown> & { id: string; name: string; price: string | number; duration?: string };
  userDetails: { name: string; email: string; phone?: string; learnerType?: string };
  isUpgrade?: boolean;
  onSuccess: (result: PaymentSuccessResult) => void;
  onFailure: (result: PaymentFailureResult) => void;
  onCancel?: () => void;
}

export const initiateRazorpayPayment = async ({
  plan,
  userDetails,
  isUpgrade,
  onSuccess,
  onFailure,
  onCancel,
}: InitiatePaymentParams) => {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }

    const parsedPrice = parseFloat(String(plan.price));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      throw new Error(`Invalid plan price: ${plan.price}`);
    }

    const amountInPaise = Math.round(parsedPrice * 100);

    // Create order via Worker
    const orderData = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      planId: plan.id,
      planName: plan.name,
      userEmail: userDetails.email,
      userName: userDetails.name,
      isUpgrade,
    });

    // Use Razorpay key from backend API response (matches RAZORPAY_MODE on server)
    const razorpayKeyId = orderData.key;

    // Razorpay checkout options — all callbacks stay in-app (no window.location.href)
    const options = {
      key: razorpayKeyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'RareMinds Skill Passport',
      description: `${plan.name} Plan - ₹${plan.price}/${plan.duration || 'month'}`,
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
      // ── Success handler — verify payment inline, then callback ──
      handler: async function (response) {
        try {
          // Verify payment signature via Worker before declaring success
          const verificationResult = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan,
          });

          onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            plan,
            verificationResult,
          });
        } catch (verifyError) {
          // Payment was captured by Razorpay but verification failed
          // Still call onSuccess with the raw response so the UI can handle it
          console.error('[RazorpayService] Payment verification failed:', verifyError);
          onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            plan,
          });
        }
      },
      modal: {
        // ── User dismissed the modal ──
        ondismiss: function () {
          if (onCancel) {
            onCancel();
          } else {
            onFailure({
              error_code: 'PAYMENT_CANCELLED',
              error_description: 'Payment was cancelled by user',
              razorpay_order_id: orderData.id,
            });
          }
        },
      },
    };

    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);

    // ── Payment failure event ──
    razorpay.on('payment.failed', function (response) {
      onFailure({
        error_code: response.error?.code || 'PAYMENT_FAILED',
        error_description: response.error?.description || 'Payment failed',
        error_reason: response.error?.reason || '',
        razorpay_order_id: orderData.id,
        razorpay_payment_id: response.error?.metadata?.payment_id || '',
      });
    });

    razorpay.open();
  } catch (error) {
    // Handle "subscription already exists" error specially
    if (error.code === 'SUBSCRIPTION_EXISTS' || error.isSubscriptionExists) {
      onFailure({
        error_code: 'SUBSCRIPTION_EXISTS',
        error_description: error.message || 'You already have an active subscription',
      });
      return;
    }

    // All other initialization errors — callback instead of redirect
    onFailure({
      error_code: 'INITIALIZATION_ERROR',
      error_description: error.message || 'Failed to initialize payment',
    });
  }
};
