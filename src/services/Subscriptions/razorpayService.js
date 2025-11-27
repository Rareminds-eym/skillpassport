/**
 * Razorpay Payment Service
 * Handles Razorpay payment integration for subscription plans
 */

import { supabase } from '../../lib/supabaseClient';

// Use TEST_ prefixed key for easy identification, fallback to regular key for backward compatibility
const RAZORPAY_KEY_ID = import.meta.env.TEST_VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY_ID;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const DEMO_MODE = false; // Production mode with Supabase Edge Functions

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

    // Call Supabase Edge Function to create Razorpay order
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Order creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || 'Failed to create order' };
      }

      throw new Error(errorData.error || `Failed to create order (${response.status})`);
    }

    const result = await response.json();
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Payment verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

/**
 * Save subscription to database after successful payment
 * @param {Object} subscriptionData - Subscription details
 * @returns {Promise<Object>} Result of database insertion
 */
export const saveSubscriptionToDatabase = async (subscriptionData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Map studentType to valid user_role
    let userRole = 'School Student'; // Default
    if (subscriptionData.studentType === 'educator') {
      userRole = 'Educator';
    } else if (subscriptionData.studentType === 'admin') {
      userRole = 'Admin';
    } else {
      // For 'school' and 'university' types, map to 'School Student'
      userRole = 'School Student';
    }

    // Prepare subscription data matching schema
    const subscription = {
      user_id: user.id,
      full_name: subscriptionData.userDetails.name,
      email: subscriptionData.userDetails.email,
      phone: subscriptionData.userDetails.phone || null,
      plan_type: subscriptionData.plan.name,
      plan_amount: parseFloat(subscriptionData.plan.price),
      billing_cycle: subscriptionData.plan.duration,
      razorpay_payment_id: subscriptionData.paymentData.razorpay_payment_id,
      razorpay_order_id: subscriptionData.paymentData.razorpay_order_id || null,
      status: 'active',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: calculateEndDate(subscriptionData.plan.duration),
      auto_renew: false,
      user_role: userRole // Add user_role
    };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscription])
      .select()
      .single();

    if (error) {
      console.error('Error saving subscription to database:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to save subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save payment transaction to database
 * @param {Object} transactionData - Transaction details
 * @returns {Promise<Object>} Result of database insertion
 */
export const savePaymentTransaction = async (transactionData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const transaction = {
      subscription_id: transactionData.subscription_id || null,
      user_id: user.id,
      razorpay_payment_id: transactionData.razorpay_payment_id,
      razorpay_order_id: transactionData.razorpay_order_id || null,
      amount: transactionData.amount,
      currency: transactionData.currency || 'INR',
      status: 'success',
      payment_method: transactionData.payment_method || 'card'
    };

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      console.error('Error saving payment transaction:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to save payment transaction:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate subscription end date based on billing cycle
 * @param {string} duration - Billing cycle (e.g., 'month', 'year')
 * @returns {string} ISO string of end date
 */
function calculateEndDate(duration) {
  const now = new Date();

  if (duration.toLowerCase().includes('month')) {
    now.setMonth(now.getMonth() + 1);
  } else if (duration.toLowerCase().includes('year')) {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    // Default to 1 month
    now.setMonth(now.getMonth() + 1);
  }

  return now.toISOString();
}

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

    // Call Supabase Edge Function to deactivate subscription
    const response = await fetch(`${SUPABASE_URL}/functions/v1/deactivate-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription_id: subscriptionId,
        cancellation_reason: cancellationReason,
        cancellation_note: cancellationNote
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cancel subscription');
    }

    return await response.json();
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

    // Razorpay checkout options with redirect
    const options = {
      key: RAZORPAY_KEY_ID,
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
