/**
 * Subscription Service (READ-ONLY)
 * 
 * IMPORTANT: All functions now route through the authenticated
 * Cloudflare Pages Function API (/api/payments/*) instead of direct Supabase calls.
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

    const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
      `/payments/get-user-subscriptions?includeAll=${includeAll}`
    );

    return {
      success: result.success ?? true,
      data: result.data ?? [],
      error: result.error ?? null,
    };
  } catch (error: any) {
    logger.error('Error fetching subscriptions via API', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch subscriptions'
    };
  }
};

/**
 * Get payment history for a specific subscription
 * @param {string} subscriptionId - The ID of the subscription
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getSubscriptionPayments = async (subscriptionId: string) => {
  try {
    if (!subscriptionId) {
      return { success: false, data: null, error: 'Subscription ID is required' };
    }

    const authResult = await checkAuthentication();

    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to view payments'
      };
    }

    const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
      `/payments/get-subscription-payments?subscriptionId=${subscriptionId}`
    );

    return {
      success: result.success ?? true,
      data: result.data ?? [],
      error: result.error ?? null,
    };
  } catch (error: any) {
    logger.error('Error fetching subscription payments via API', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch payments'
    };
  }
};

/**
 * Get all payment history for a user across all subscriptions
 * @returns {Promise<{ success: boolean, data: Array | null, error: string | null }>}
 */
export const getUserPayments = async () => {
  try {
    const authResult = await checkAuthentication();

    if (!authResult.isAuthenticated) {
      return {
        success: false,
        data: null,
        error: 'User must be authenticated to view payments'
      };
    }

    const result = await apiGet<{ success: boolean; data: any; error: string | null }>(
      '/payments/get-user-payments'
    );

    return {
      success: result.success ?? true,
      data: result.data ?? [],
      error: result.error ?? null,
    };
  } catch (error: any) {
    logger.error('Error fetching user payments via API', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to fetch payments'
    };
  }
};

/**
 * Check if the user has an active subscription directly
 * Similar to getActiveSubscription but returns a simple boolean result
 * @returns {Promise<boolean>}
 */
export const checkActiveSubscription = async () => {
  try {
    const response = await getActiveSubscription();
    return response.success && response.data !== null && response.data.status !== 'expired';
  } catch (error) {
    logger.error('Error checking subscription', error);
    return false;
  }
};
