/**
 * Add-on Payment Service
 * Handles all add-on specific payment operations.
 * 
 * Authentication is handled automatically by ssoClient.fetch() from @rareminds-eym/auth-client.
 * No manual token management required.
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { apiGet } from '@/shared/api/apiClient';
import { extractErrorMessage } from './paymentsApiService';

// Use Pages Functions for payments (not direct worker access)
const getBaseUrl = () => {
  const origin = window.location.origin;
  return `${origin}/api/payments`;
};

/**
 * Add-on Payment Service
 * Handles all add-on specific payment operations
 */
export const addOnPaymentService = {
  /**
   * Create an add-on order with retry logic
   * Auth is handled automatically by ssoClient.fetch().
   * @param {Object} params - Order parameters
   * @param {string} params.featureKey - Feature key from subscription_plan_features
   * @param {string} params.userId - User ID
   * @param {string} params.billingPeriod - 'monthly' or 'annual'
   * @param {string} params.userEmail - User email for Razorpay prefill
   * @param {string} params.userName - User name for Razorpay prefill
   * @returns {Promise<Object>} - Order result with Razorpay data
   */
  async createAddOnOrder({ featureKey, userId, billingPeriod, userEmail, userName }) {
    try {
      const response = await ssoClient.fetch(`${getBaseUrl()}/create-addon-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          feature_key: featureKey,
          billing_period: billingPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: extractErrorMessage(data) || 'Failed to create addon order' };
      }

      return {
        success: true,
        data: {
          orderId: data.razorpay_order_id,
          amount: data.amount,
          currency: data.currency || 'INR',
          addonName: data.addon_name,
          razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID,
          userEmail,
          userName,
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create order' };
    }
  },

  /**
   * Create a bundle order
   * Auth is handled automatically by ssoClient.fetch().
   * @param {Object} params - Order parameters
   * @param {string} params.bundleId - Bundle ID
   * @param {string} params.userId - User ID
   * @param {string} params.billingPeriod - 'monthly' or 'annual'
   * @param {string} params.userEmail - User email for Razorpay prefill
   * @param {string} params.userName - User name for Razorpay prefill
   * @returns {Promise<Object>} - Order result with Razorpay data
   */
  async createBundleOrder({ bundleId, userId, billingPeriod, userEmail, userName }) {
    try {
      const response = await ssoClient.fetch(`${getBaseUrl()}/create-bundle-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          bundle_id: bundleId,
          billing_period: billingPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: extractErrorMessage(data) || 'Failed to create bundle order' };
      }

      return {
        success: true,
        data: {
          orderId: data.razorpay_order_id,
          amount: data.amount,
          currency: data.currency || 'INR',
          bundleName: data.bundle_name,
          bundleId: bundleId,
          billingPeriod: billingPeriod,
          razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID,
          userEmail,
          userName,
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create order' };
    }
  },

  /**
   * Initiate an add-on purchase
   * @param {string} userId - User ID
   * @param {string} featureKey - Feature key from subscription_plan_features
   * @param {string} billingPeriod - 'monthly' or 'annual'
   * @returns {Promise<Object>} - Payment initiation result
   */
  async initiateAddonPurchase(userId, featureKey, billingPeriod = 'monthly') {
    const result = await this.createAddOnOrder({
      featureKey,
      userId,
      billingPeriod
    });

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      razorpayOrderId: result.data.orderId,
      amount: result.data.amount,
      currency: result.data.currency,
      addonName: result.data.addonName,
    };
  },

  /**
   * Verify add-on payment after Razorpay callback with retry logic
   * Auth is handled automatically by ssoClient.fetch().
   */
  async verifyAddonPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, featureKey, amount, billingPeriod, retries = 3) {
    const attemptVerification = async (attempt) => {
      try {
        const response = await ssoClient.fetch(`${getBaseUrl()}/verify-addon-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
            feature_key: featureKey,
            amount: amount,
            billing_period: billingPeriod
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(extractErrorMessage(data) || 'Payment verification failed');
        }

        return {
          success: true,
          verified: true,
          data
        };
      } catch (error) {
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptVerification(attempt + 1);
        }
        return {
          success: false,
          verified: false,
          error: error.message
        };
      }
    };

    return attemptVerification(1);
  },

  /**
   * Verify bundle payment after Razorpay callback
   */
  async verifyBundlePayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, bundleId, amount, billingPeriod, retries = 3) {
    const attemptVerification = async (attempt) => {
      try {
        const response = await ssoClient.fetch(`${getBaseUrl()}/verify-bundle-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
            bundle_id: bundleId,
            amount: amount,
            billing_period: billingPeriod
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(extractErrorMessage(data) || 'Bundle payment verification failed');
        }

        return {
          success: true,
          verified: true,
          data
        };
      } catch (error) {
        if (attempt < retries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptVerification(attempt + 1);
        }
        return {
          success: false,
          verified: false,
          error: error.message
        };
      }
    };

    return attemptVerification(1);
  },
};

export default addOnPaymentService;
