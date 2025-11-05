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

    console.log('✅ Subscription created successfully:', data);
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

    console.log('✅ Subscription updated successfully:', data);
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

    console.log('✅ Payment updated successfully:', data);
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
 * Cancel subscription
 * @param {string} subscriptionId 
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const cancelSubscription = async (subscriptionId) => {
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

    // Update subscription to cancelled
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        auto_renew: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId) // Ensure user owns this subscription
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

    console.log('✅ Subscription cancelled successfully:', data);
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

