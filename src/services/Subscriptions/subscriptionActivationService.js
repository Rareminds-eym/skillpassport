/**
 * Subscription Activation Service
 * Handles atomic subscription activation with rollback support
 */

import { supabase } from '../../lib/supabaseClient';
import { checkAuthentication } from '../authService';
import { logPaymentTransaction } from './paymentVerificationService';

/**
 * Calculate subscription end date based on billing cycle
 * @param {string} duration - Billing cycle (e.g., 'month', 'year')
 * @returns {string} ISO string of end date
 */
const calculateEndDate = (duration) => {
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
};



/**
 * Check if subscription already exists for payment ID
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Lookup result with subscription data if found
 */
export const getSubscriptionByPaymentId = async (paymentId) => {
  try {
    if (!paymentId) {
      return {
        success: false,
        exists: false,
        data: null,
        error: 'Payment ID is required'
      };
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('razorpay_payment_id', paymentId)
      .single();

    if (error) {
      // If no subscription found, that's okay
      if (error.code === 'PGRST116') {
        return {
          success: true,
          exists: false,
          data: null,
          error: null
        };
      }

      console.error('❌ Error checking subscription:', error);
      return {
        success: false,
        exists: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      exists: true,
      data,
      error: null
    };
  } catch (error) {
    console.error('❌ Error in getSubscriptionByPaymentId:', error);
    return {
      success: false,
      exists: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Validate and normalize activation data
 * @param {Object} activationData - Raw activation data
 * @param {Object} authUser - Authenticated user object
 * @returns {Object} Validated and normalized data
 */
const validateActivationData = (activationData, authUser) => {
  const {
    plan,
    userDetails,
    paymentData,
    transactionDetails
  } = activationData;

  // Validate and provide fallbacks for plan
  const validatedPlan = {
    name: plan?.name || 'Standard Plan',
    price: plan?.price || 0,
    duration: plan?.duration || 'month',
    studentType: plan?.studentType
  };

  // Validate and provide fallbacks for user details
  const validatedUserDetails = {
    name: userDetails?.name || 
          transactionDetails?.user_name || 
          authUser?.user_metadata?.full_name || 
          authUser?.email || 
          'User',
    email: userDetails?.email || 
           transactionDetails?.user_email || 
           authUser?.email || 
           '',
    phone: userDetails?.phone || 
           authUser?.user_metadata?.phone || 
           null,
    studentType: userDetails?.studentType || 
                 plan?.studentType || 
                 'student'
  };

  return {
    plan: validatedPlan,
    userDetails: validatedUserDetails,
    paymentData,
    transactionDetails
  };
};

/**
 * Activate subscription after successful payment
 * @param {Object} activationData - Subscription activation data
 * @returns {Promise<Object>} Activation result
 */
export const activateSubscription = async (activationData) => {
  const {
    plan,
    userDetails,
    paymentData,
    transactionDetails
  } = activationData;

  try {
    // Check if subscription already exists for this payment
    if (paymentData?.razorpay_payment_id) {
      const existingSubscription = await getSubscriptionByPaymentId(
        paymentData.razorpay_payment_id
      );

      if (existingSubscription.exists) {
        console.log('✅ Subscription already exists, returning existing data');
        return {
          success: true,
          data: {
            subscriptionId: existingSubscription.data.id,
            subscription: existingSubscription.data,
            alreadyExists: true
          }
        };
      }
    }

    // Try to get authenticated user, but allow activation without session
    // (user_id will come from payment verification result)
    const authResult = await checkAuthentication();
    
    let userId = authResult.isAuthenticated ? authResult.user.id : null;
    
    // If no authenticated user, try to get user_id from transaction details
    if (!userId && transactionDetails?.user_id) {
      userId = transactionDetails.user_id;
      console.log('📝 Using user_id from payment verification:', userId);
    }
    
    if (!userId) {
      return {
        success: false,
        error: 'Unable to determine user for subscription activation'
      };
    }

    // Validate and normalize activation data
    const validatedData = validateActivationData(
      activationData,
      authResult.user
    );

    // Start transaction-like operation
    let subscriptionId = null;
    let transactionId = null;

    try {
      // Step 1: Create subscription record with validated data
      const subscriptionResult = await createSubscriptionRecord({
        userId,
        plan: validatedData.plan,
        userDetails: validatedData.userDetails,
        paymentData
      });

      if (!subscriptionResult.success) {
        throw new Error(subscriptionResult.error);
      }

      subscriptionId = subscriptionResult.data.id;

      // Step 2: Log payment transaction
      const transactionResult = await logPaymentTransaction({
        subscription_id: subscriptionId,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id,
        amount: parseFloat(validatedData.plan.price),
        currency: 'INR',
        status: 'success',
        payment_method: transactionDetails?.payment_method || 'card',
        gateway_response: transactionDetails
      });

      if (!transactionResult.success) {
        console.warn('⚠️ Failed to log transaction, but subscription created');
      } else {
        transactionId = transactionResult.data.id;
      }

      // Step 3: Update subscription with transaction reference
      if (transactionId) {
        await supabase
          .from('subscriptions')
          .update({ payment_id: paymentData.razorpay_payment_id })
          .eq('id', subscriptionId);
      }

      console.log('✅ Subscription activated successfully:', subscriptionId);

      return {
        success: true,
        data: {
          subscriptionId,
          transactionId,
          subscription: subscriptionResult.data
        }
      };

    } catch (error) {
      // Rollback: Mark subscription as failed if it was created
      if (subscriptionId) {
        await rollbackSubscription(subscriptionId);
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ Error activating subscription:', error);
    return {
      success: false,
      error: error.message || 'Failed to activate subscription'
    };
  }
};

/**
 * Create subscription record in database
 * @param {Object} data - Subscription data
 * @returns {Promise<Object>} Creation result
 */
const createSubscriptionRecord = async (data) => {
  const { userId, plan, userDetails, paymentData } = data;

  try {
    const subscription = {
      user_id: userId,
      full_name: userDetails.name,
      email: userDetails.email,
      phone: userDetails.phone || null,
      plan_type: plan.name,
      plan_amount: parseFloat(plan.price),
      billing_cycle: plan.duration,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_order_id: paymentData.razorpay_order_id || null,
      status: 'active',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: calculateEndDate(plan.duration),
      auto_renew: false,
      // user_role is now fetched from users.user_role column
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: subscriptionData, error } = await supabase
      .from('subscriptions')
      .insert([subscription])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating subscription record:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: subscriptionData
    };

  } catch (error) {
    console.error('❌ Error in createSubscriptionRecord:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Rollback subscription on activation failure
 * @param {string} subscriptionId - Subscription ID to rollback
 */
const rollbackSubscription = async (subscriptionId) => {
  try {
    console.log('🔄 Rolling back subscription:', subscriptionId);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('❌ Error rolling back subscription:', error);
    } else {
      console.log('✅ Subscription rolled back successfully');
    }
  } catch (error) {
    console.error('❌ Error in rollbackSubscription:', error);
  }
};

/**
 * Queue subscription activation for retry (when database is unavailable)
 * @param {Object} activationData - Subscription activation data
 * @returns {Promise<Object>} Queue result
 */
export const queueSubscriptionActivation = async (activationData) => {
  try {
    // Store in localStorage for retry
    const queueKey = `subscription_queue_${Date.now()}`;
    const queueData = {
      ...activationData,
      queuedAt: new Date().toISOString(),
      retryCount: 0
    };

    localStorage.setItem(queueKey, JSON.stringify(queueData));

    console.log('📥 Subscription activation queued:', queueKey);

    return {
      success: true,
      queueKey,
      message: 'Subscription activation queued for retry'
    };
  } catch (error) {
    console.error('❌ Error queuing subscription activation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Retry queued subscription activations
 * @returns {Promise<Object>} Retry result
 */
export const retryQueuedActivations = async () => {
  try {
    const queueKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('subscription_queue_')
    );

    if (queueKeys.length === 0) {
      return {
        success: true,
        processed: 0,
        message: 'No queued activations to retry'
      };
    }

    let successCount = 0;
    let failCount = 0;

    for (const queueKey of queueKeys) {
      try {
        const queueData = JSON.parse(localStorage.getItem(queueKey));
        
        // Attempt activation
        const result = await activateSubscription(queueData);

        if (result.success) {
          // Remove from queue on success
          localStorage.removeItem(queueKey);
          successCount++;
        } else {
          // Increment retry count
          queueData.retryCount = (queueData.retryCount || 0) + 1;
          
          // Remove if max retries exceeded (3 attempts)
          if (queueData.retryCount >= 3) {
            localStorage.removeItem(queueKey);
            failCount++;
          } else {
            localStorage.setItem(queueKey, JSON.stringify(queueData));
          }
        }
      } catch (error) {
        console.error('❌ Error retrying activation:', error);
        failCount++;
      }
    }

    return {
      success: true,
      processed: successCount + failCount,
      successCount,
      failCount
    };

  } catch (error) {
    console.error('❌ Error in retryQueuedActivations:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
