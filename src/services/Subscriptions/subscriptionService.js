/**
 * Subscription Service (READ-ONLY)
 * 
 * This service handles READ operations for subscriptions using direct Supabase queries.
 * All WRITE operations (create, update, cancel, pause, resume) should go through
 * paymentsApiService → Cloudflare Worker for security and consistency.
 * 
 * READ OPERATIONS (this file):
 * - getActiveSubscription()     - Get user's active subscription
 * - getUserSubscriptions()      - Get all user subscriptions (billing history)
 * - getSubscriptionPayments()   - Get payments for a subscription
 * - getUserPayments()           - Get all user payments
 * - checkActiveSubscription()   - Check if user has active subscription
 * 
 * WRITE OPERATIONS (use paymentsApiService):
 * - paymentsApiService.verifyPayment()         - Create subscription after payment
 * - paymentsApiService.deactivateSubscription() - Cancel subscription
 * - paymentsApiService.pauseSubscription()     - Pause subscription
 * - paymentsApiService.resumeSubscription()    - Resume subscription
 */

import { supabase } from '../../lib/supabaseClient';
import { checkAuthentication } from '../authService';

/**
 * Get active subscription for authenticated user
 * Includes cancelled subscriptions that haven't expired yet (user retains access until end date)
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getActiveSubscription = async () => {
  try {
    const authResult = await checkAuthentication();

    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to view subscription'
      };
    }

    const userId = authResult.user.id;

    // Query for active, paused, or cancelled (but not expired) subscription
    // For cancelled subscriptions, we still show them if end_date hasn't passed
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'paused', 'cancelled'])
      .gte('subscription_end_date', new Date().toISOString())
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

    // If no active/valid subscription, try to get the most recent one for display purposes
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
 * Get all subscriptions for authenticated user (billing history)
 * @param {boolean} includeAll - Whether to include all fields or just billing history fields
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getUserSubscriptions = async (includeAll = false) => {
  try {
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
      : 'id,created_at,subscription_start_date,subscription_end_date,plan_amount,status,plan_type,billing_cycle,razorpay_payment_id';

    const { data, error } = await supabase
      .from('subscriptions')
      .select(selectFields)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20); // Limit to recent 20 for performance

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
 * Get payment transactions for a specific subscription
 * @param {string} subscriptionId - Subscription ID
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

/**
 * Check if user has active subscription
 * Includes cancelled subscriptions that haven't expired (user retains access until end date)
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

    // Check if subscription is active, paused, or cancelled but not expired
    const isValid = result.data && (
      ['active', 'paused'].includes(result.data.status) ||
      (result.data.status === 'cancelled' && new Date(result.data.subscription_end_date) >= new Date())
    );

    return {
      hasSubscription: isValid,
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
