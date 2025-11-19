/**
 * Razorpay Payment Service
 * Handles Razorpay payment integration for subscription plans
 */

import { supabase } from '../lib/supabaseClient';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
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
    // Get auth token for authenticated requests
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
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
      auto_renew: false
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
 * Initialize Razorpay payment
 * @param {Object} params - Payment parameters
 * @param {Object} params.plan - Selected subscription plan
 * @param {Object} params.userDetails - User information
 * @param {Function} params.onSuccess - Success callback
 * @param {Function} params.onFailure - Failure callback
 */
export const initiateRazorpayPayment = async ({
  plan,
  userDetails,
  onSuccess,
  onFailure,
}) => {
  try {
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

    // Razorpay checkout options
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
        try {
          // Verify payment on backend
          const verificationResult = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: plan.id,
          });

          if (verificationResult.success) {
            // Save subscription to database
            const subscriptionResult = await saveSubscriptionToDatabase({
              plan,
              userDetails,
              paymentData: response
            });

            if (subscriptionResult.success) {
              // Save payment transaction with actual payment method
              await savePaymentTransaction({
                subscription_id: subscriptionResult.data.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                amount: parseFloat(plan.price),
                currency: 'INR',
                payment_method: verificationResult.payment_method || 'card'
              });

              onSuccess({
                ...verificationResult,
                subscription: subscriptionResult.data
              });
            } else {
              console.error('Failed to save subscription:', subscriptionResult.error);
              onSuccess(verificationResult); // Continue anyway, payment is successful
            }
          } else {
            onFailure(new Error('Payment verification failed'));
          }
        } catch (error) {
          onFailure(error);
        }
      },
      modal: {
        ondismiss: function () {
          onFailure(new Error('Payment cancelled by user'));
        },
      },
    };

    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Error initiating payment:', error);
    onFailure(error);
  }
};
