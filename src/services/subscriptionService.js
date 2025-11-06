import { supabase } from '../lib/supabaseClient';
import { checkAuthentication } from './authService';

/**
 * Subscription Service
 * Manages subscription creation, updates, and retrieval
 */

/**
 * Create a new subscription for authenticated user
 * @param {Object} subscriptionData - Subscription details
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const createSubscription = async (subscriptionData) => {
  try {
    // Check authentication first
    const authResult = await checkAuthentication();
    
    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to create a subscription'
      };
    }

    const userId = authResult.user.id;
    const userRole = authResult.role;

    // Validate that user has student role
    if (userRole !== 'student') {
      return {
        success: false,
        data: null,
        error: 'Only students can purchase subscriptions'
      };
    }

    // Check if user already has an active subscription of the same plan type
    const { data: existingPlan, error: checkError } = await supabase
      .from('subscriptions')
      .select('id, plan_type, status')
      .eq('user_id', userId)
      .eq('plan_type', subscriptionData.planName)
      .eq('status', 'active')
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing subscription:', checkError);
      return {
        success: false,
        data: null,
        error: 'Failed to verify existing subscription'
      };
    }

    if (existingPlan) {
      return {
        success: false,
        data: null,
        error: `You already have an active ${subscriptionData.planName} subscription. Please cancel your existing subscription before purchasing again.`
      };
    }

    // Prepare subscription data
    const subscription = {
      user_id: userId,
      plan_id: subscriptionData.planId,
      plan_name: subscriptionData.planName,
      plan_price: subscriptionData.planPrice,
      status: subscriptionData.status || 'pending',
      start_date: subscriptionData.startDate || new Date().toISOString(),
      end_date: subscriptionData.endDate,
      payment_id: subscriptionData.paymentId || null,
      payment_status: subscriptionData.paymentStatus || 'pending',
      features: subscriptionData.features || [],
      auto_renew: subscriptionData.autoRenew || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert subscription into database
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscription])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating subscription:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error creating subscription:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get active subscription for authenticated user with payment details
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getActiveSubscription = async () => {
  try {
    // Check authentication first
    const authResult = await checkAuthentication();
    
    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to view subscription'
      };
    }

    const userId = authResult.user.id;

    // Query for active subscription with the most recent one first
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching subscription:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    // If no active subscription, try to get the most recent one
    if (!data) {
      const { data: recentSub, error: recentError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentError) {
        console.error('❌ Error fetching recent subscription:', recentError);
      }

      return {
        success: true,
        data: recentSub || null,
        error: null
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching subscription:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get all subscriptions for authenticated user
 * @param {boolean} includeAll - Whether to include all fields or just billing history fields
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getUserSubscriptions = async (includeAll = false) => {
  try {
    // Check authentication first
    const authResult = await checkAuthentication();
    
    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to view subscriptions'
      };
    }

    const userId = authResult.user.id;

    // Optimize query - select only needed fields for billing history
    const selectFields = includeAll 
      ? '*' 
      : 'id,created_at,subscription_start_date,plan_amount,status,plan_type,billing_cycle,razorpay_subscription_id';

    // Query for all user subscriptions
    const { data, error } = await supabase
      .from('subscriptions')
      .select(selectFields)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20); // Limit to recent 20 transactions for performance

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching subscriptions:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Update subscription status
 * @param {string} subscriptionId 
 * @param {string} status 
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const updateSubscriptionStatus = async (subscriptionId, status) => {
  try {
    // Check authentication first
    const authResult = await checkAuthentication();
    
    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to update subscription'
      };
    }

    const userId = authResult.user.id;

    // Update subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId) // Ensure user owns this subscription
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating subscription:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error updating subscription:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Update subscription payment details
 * @param {string} subscriptionId 
 * @param {Object} paymentData 
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const updateSubscriptionPayment = async (subscriptionId, paymentData) => {
  try {
    // Check authentication first
    const authResult = await checkAuthentication();
    
    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to update payment'
      };
    }

    const userId = authResult.user.id;

    // Update subscription payment details
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        payment_id: paymentData.paymentId,
        payment_status: paymentData.paymentStatus,
        status: paymentData.paymentStatus === 'success' ? 'active' : 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId) // Ensure user owns this subscription
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating payment:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error updating payment:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Cancel subscription with reason tracking
 * @param {string} subscriptionId 
 * @param {string} cancellationReason - Reason for cancellation
 * @param {string} additionalFeedback - Optional additional feedback
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const cancelSubscription = async (subscriptionId, cancellationReason = 'Not specified', additionalFeedback = null) => {
  try {
    // Check authentication first
    const authResult = await checkAuthentication();
    
    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to cancel subscription'
      };
    }

    const userId = authResult.user.id;

    // First, get the subscription to check if it has a Razorpay subscription ID
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      console.error('❌ Error fetching subscription:', fetchError);
      return {
        success: false,
        data: null,
        error: fetchError?.message || 'Subscription not found'
      };
    }

    // Cancel on Razorpay if razorpay_subscription_id exists
    if (subscription.razorpay_subscription_id) {
      const { cancelRazorpaySubscription } = await import('./razorpayService');
      const razorpayResult = await cancelRazorpaySubscription(subscription.razorpay_subscription_id);
      
      if (!razorpayResult.success) {
        console.warn('⚠️ Razorpay cancellation failed, continuing with local cancellation:', razorpayResult.error);
      }
    }

    const now = new Date().toISOString();

    // Update subscription to cancelled (but keep access until end date)
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        auto_renew: false,
        cancelled_at: now,
        cancellation_reason: cancellationReason,
        updated_at: now
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error cancelling subscription:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    // Save cancellation feedback to cancellations table
    const { error: cancellationError } = await supabase
      .from('subscription_cancellations')
      .insert([{
        subscription_id: subscriptionId,
        user_id: userId,
        cancellation_reason: cancellationReason,
        additional_feedback: additionalFeedback,
        cancelled_at: now,
        access_until: subscription.subscription_end_date
      }]);

    if (cancellationError) {
      console.warn('⚠️ Failed to save cancellation feedback:', cancellationError);
      // Don't fail the cancellation if feedback save fails
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error cancelling subscription:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Pause subscription
 * @param {string} subscriptionId 
 * @param {number} pauseMonths - Number of months to pause (1-3)
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const pauseSubscription = async (subscriptionId, pauseMonths = 1) => {
  try {
    // Check authentication first
    const authResult = await checkAuthentication();
    
    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to pause subscription'
      };
    }

    const userId = authResult.user.id;

    // Validate pause duration
    if (pauseMonths < 1 || pauseMonths > 3) {
      return {
        success: false,
        data: null,
        error: 'Pause duration must be between 1 and 3 months'
      };
    }

    // Get the subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      return {
        success: false,
        data: null,
        error: fetchError?.message || 'Subscription not found'
      };
    }

    // Pause on Razorpay if razorpay_subscription_id exists
    if (subscription.razorpay_subscription_id) {
      const { pauseRazorpaySubscription } = await import('./razorpayService');
      const razorpayResult = await pauseRazorpaySubscription(subscription.razorpay_subscription_id, pauseMonths);
      
      if (!razorpayResult.success) {
        console.warn('⚠️ Razorpay pause failed:', razorpayResult.error);
        return {
          success: false,
          data: null,
          error: 'Failed to pause subscription with payment provider'
        };
      }
    }

    const now = new Date();
    const pausedUntil = new Date(now);
    pausedUntil.setMonth(pausedUntil.getMonth() + pauseMonths);

    // Update subscription to paused
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        paused_at: now.toISOString(),
        paused_until: pausedUntil.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error pausing subscription:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error pausing subscription:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Resume a paused subscription
 * @param {string} subscriptionId 
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const resumeSubscription = async (subscriptionId) => {
  try {
    // Check authentication first
    const authResult = await checkAuthentication();
    
    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to resume subscription'
      };
    }

    const userId = authResult.user.id;

    // Get the subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      return {
        success: false,
        data: null,
        error: fetchError?.message || 'Subscription not found'
      };
    }

    // Check if subscription is paused
    if (subscription.status !== 'paused') {
      return {
        success: false,
        data: null,
        error: 'Subscription is not paused'
      };
    }

    // Resume on Razorpay if razorpay_subscription_id exists
    if (subscription.razorpay_subscription_id) {
      // TODO: Add Razorpay resume API call if available
      // Most payment gateways don't have explicit resume - you just reactivate
    }

    const now = new Date().toISOString();

    // Update subscription to active
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        paused_at: null,
        paused_until: null,
        updated_at: now
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error resuming subscription:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error resuming subscription:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Check if user has active subscription
 * @returns {Promise<{ hasSubscription: boolean, subscription: Object | null }>}
 */
export const checkActiveSubscription = async () => {
  try {
    const result = await getActiveSubscription();
    
    if (!result.success) {
      return {
        hasSubscription: false,
        subscription: null
      };
    }

    return {
      hasSubscription: !!result.data,
      subscription: result.data
    };
  } catch (error) {
    console.error('❌ Error checking subscription:', error);
    return {
      hasSubscription: false,
      subscription: null
    };
  }
};

/**
 * Get payment transactions for a subscription
 * @param {string} subscriptionId 
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getSubscriptionPayments = async (subscriptionId) => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching payments:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching payments:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get all payment transactions for authenticated user
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getUserPayments = async () => {
  try {
    const authResult = await checkAuthentication();
    
    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated'
      };
    }

    const userId = authResult.user.id;

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching user payments:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching user payments:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

