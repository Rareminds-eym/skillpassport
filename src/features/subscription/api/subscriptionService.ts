/**
 * Subscription Service (READ-ONLY)
 * 
 * IMPORTANT: getActiveSubscription() now routes through the authenticated
 * Cloudflare Pages Function API (/api/payments/get-active-subscription)
 * instead of direct Supabase calls. This is required because:
 * 1. The frontend supabase client uses anon key with auth disabled
 * 2. RLS policies block anonymous reads → subscription always appears missing
 * 3. The server-side handler uses service_role key, bypassing RLS
 * 
 * READ OPERATIONS (this file):
 * - getActiveSubscription()     - Get user's active subscription via API
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

import { supabase } from '@/shared/api/supabaseClient';
import { checkAuthentication } from '@/features/auth';
import { getLogger } from '@/shared/config/logging';
import { apiGet } from '@/shared/api/apiClient';

const logger = getLogger('subscription-service');

/**
 * Get active subscription for authenticated user
 * Routes through the server-side API to bypass RLS restrictions.
 * Checks BOTH individual subscriptions AND organization license assignments.
 * Includes cancelled subscriptions that haven't expired yet (user retains access until end date).
 * @returns {Promise<{ success: boolean, data: Object | null, error: string | null }>}
 */
export const getActiveSubscription = async () => {
  try {
    logger.info('Fetching active subscription via API');

    const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
      '/payments/get-active-subscription'
    );

    logger.info('Active subscription API response', { success: result.success, hasData: !!result.data });

    return {
      success: result.success ?? true,
      data: result.data ?? null,
      error: result.error ?? null,
    };
  } catch (error: any) {
    // If the API call fails (e.g. 401, network error), return a safe fallback
    logger.error('Failed to fetch active subscription via API', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch subscription',
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
      logger.error('Error fetching subscriptions', error);
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
    logger.error('Unexpected error fetching subscriptions', error as Error);
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
      logger.error('Error fetching payments', error);
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
    logger.error('Unexpected error fetching payments', error as Error);
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
      logger.error('Error fetching user payments', error);
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
    logger.error('Unexpected error fetching user payments', error as Error);
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
    logger.error('Error checking subscription', error as Error);
    return {
      hasSubscription: false,
      subscription: null
    };
  }
};
