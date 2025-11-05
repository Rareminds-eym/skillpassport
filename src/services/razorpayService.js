/**
 * Razorpay Payment Service
 * Handles Razorpay payment integration for subscription plans
 */

import { supabase } from '../lib/supabaseClient';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const DEMO_MODE = true; // Set to false when backend is ready

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
    // DEMO MODE: Create mock order for testing without backend
    if (DEMO_MODE) {
      console.log('🔧 DEMO MODE: Creating mock Razorpay order', orderData);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock order (Razorpay will handle the actual payment in their system)
      return {
        id: `order_${Date.now()}`, // Mock order ID
        amount: orderData.amount,
        currency: orderData.currency,
      };
    }

    // PRODUCTION MODE: Use real backend API
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
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
    // DEMO MODE: Mock verification for testing
    if (DEMO_MODE) {
      console.log('🔧 DEMO MODE: Mock payment verification', paymentData);
      console.warn('⚠️ WARNING: In production, ALWAYS verify payments on your backend!');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Return mock success (In production, backend must verify signature!)
      return {
        success: true,
        message: 'Payment verified successfully (DEMO MODE)',
        payment_id: paymentData.razorpay_payment_id,
        order_id: paymentData.razorpay_order_id,
      };
    }

    // PRODUCTION MODE: Use real backend API for signature verification
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
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

    console.log('✅ Subscription saved to database:', data);
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

    console.log('✅ Payment transaction saved:', data);
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
      // Only include order_id if not in demo mode (demo mode doesn't have real order IDs)
      ...(DEMO_MODE ? {} : { order_id: orderData.id }),
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
            razorpay_order_id: response.razorpay_order_id || 'demo_order',
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
              // Save payment transaction
              await savePaymentTransaction({
                subscription_id: subscriptionResult.data.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                amount: parseFloat(plan.price),
                currency: 'INR'
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
