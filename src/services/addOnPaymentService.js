import { supabase } from '../lib/supabaseClient';

const PAYMENTS_API_URL = import.meta.env.VITE_PAYMENTS_API_URL || 'https://payments-api.dark-mode-d021.workers.dev';

/**
 * Helper function to make fetch requests with retry logic
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries
 * @returns {Promise<Response>} - Fetch response
 */
async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AddOnPayment] Fetch attempt ${attempt} to ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.error(`[AddOnPayment] Fetch attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = attempt * 1000;
      console.log(`[AddOnPayment] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Add-on Payment Service
 * Handles all add-on specific payment operations
 */
export const addOnPaymentService = {
  /**
   * Create an add-on order (used by SubscriptionContext) with retry logic
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
      console.log('[AddOnPayment] Creating order:', { featureKey, userId, billingPeriod });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('[AddOnPayment] No session found');
        return { success: false, error: 'User not authenticated' };
      }

      console.log('[AddOnPayment] Calling API:', `${PAYMENTS_API_URL}/create-addon-order`);
      
      const response = await fetchWithRetry(`${PAYMENTS_API_URL}/create-addon-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          feature_key: featureKey,
          billing_period: billingPeriod,
        }),
      });

      const data = await response.json();
      console.log('[AddOnPayment] API response:', { status: response.status, data });

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create addon order' };
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
      console.error('[AddOnPayment] Error creating addon order:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create a bundle order
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      const response = await fetch(`${PAYMENTS_API_URL}/create-bundle-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          bundle_id: bundleId,
          billing_period: billingPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create bundle order' };
      }

      return {
        success: true,
        data: {
          orderId: data.razorpay_order_id,
          amount: data.amount,
          currency: data.currency || 'INR',
          bundleName: data.bundle_name,
          bundleId: bundleId, // Include for verification
          billingPeriod: billingPeriod, // Include for verification
          razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID,
          userEmail,
          userName,
        }
      };
    } catch (error) {
      console.error('Error creating bundle order:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Initiate an add-on purchase (legacy method)
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
   * @param {string} razorpayOrderId - Razorpay order ID
   * @param {string} razorpayPaymentId - Razorpay payment ID
   * @param {string} razorpaySignature - Razorpay signature
   * @param {number} retries - Number of retries (default: 3)
   * @returns {Promise<Object>} - Verification result
   */
  async verifyAddonPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, retries = 3) {
    const attemptVerification = async (attempt) => {
      try {
        console.log(`[AddOnPayment] Verification attempt ${attempt} for order: ${razorpayOrderId}`);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('User not authenticated');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`${PAYMENTS_API_URL}/verify-addon-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Payment verification failed');
        }

        console.log(`[AddOnPayment] Verification successful for order: ${razorpayOrderId}`);
        return {
          success: true,
          entitlementId: data.entitlement_id,
          featureKey: data.feature_key,
          endDate: data.end_date,
          message: data.message,
        };
      } catch (error) {
        console.error(`[AddOnPayment] Verification attempt ${attempt} failed:`, error);
        
        // If we have retries left and it's a network error, retry
        if (attempt < retries && (error.name === 'AbortError' || error.message === 'Failed to fetch')) {
          console.log(`[AddOnPayment] Retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          return attemptVerification(attempt + 1);
        }
        
        throw error;
      }
    };

    try {
      return await attemptVerification(1);
    } catch (error) {
      console.error('Error verifying addon payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Verify bundle payment after Razorpay callback with retry logic
   * @param {string} razorpayOrderId - Razorpay order ID
   * @param {string} razorpayPaymentId - Razorpay payment ID
   * @param {string} razorpaySignature - Razorpay signature
   * @param {string} bundleId - Bundle ID
   * @param {string} billingPeriod - 'monthly' or 'annual'
   * @param {number} retries - Number of retries (default: 3)
   * @returns {Promise<Object>} - Verification result
   */
  async verifyBundlePayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, bundleId, billingPeriod, retries = 3) {
    const attemptVerification = async (attempt) => {
      try {
        console.log(`[AddOnPayment] Bundle verification attempt ${attempt} for order: ${razorpayOrderId}`);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('User not authenticated');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`${PAYMENTS_API_URL}/verify-bundle-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
            bundle_id: bundleId,
            billing_period: billingPeriod,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Bundle payment verification failed');
        }

        console.log(`[AddOnPayment] Bundle verification successful for order: ${razorpayOrderId}`);
        return {
          success: true,
          entitlements: data.entitlements,
          bundleName: data.bundle_name,
          endDate: data.end_date,
          message: data.message,
        };
      } catch (error) {
        console.error(`[AddOnPayment] Bundle verification attempt ${attempt} failed:`, error);
        
        // If we have retries left and it's a network error, retry
        if (attempt < retries && (error.name === 'AbortError' || error.message === 'Failed to fetch')) {
          console.log(`[AddOnPayment] Retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          return attemptVerification(attempt + 1);
        }
        
        throw error;
      }
    };

    try {
      return await attemptVerification(1);
    } catch (error) {
      console.error('Error verifying bundle payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get user's add-on purchase history
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - List of add-on purchases
   */
  async getAddonPurchaseHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('addon_pending_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching addon purchase history:', error);
      return [];
    }
  },

  /**
   * Check if user has a pending addon order
   * @param {string} userId - User ID
   * @param {string} featureKey - Feature key
   * @returns {Promise<Object|null>} - Pending order if exists
   */
  async getPendingAddonOrder(userId, featureKey) {
    try {
      const { data, error } = await supabase
        .from('addon_pending_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('addon_feature_key', featureKey)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error checking pending addon order:', error);
      return null;
    }
  },
};

// Default export for compatibility
export default addOnPaymentService;
