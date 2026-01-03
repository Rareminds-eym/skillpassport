/**
 * Add-On Payment Service
 * 
 * Handles payment processing for add-on subscriptions including:
 * - Creating Razorpay orders for add-ons
 * - Processing add-on payments and creating entitlements
 * - Calculating proration for upgrades/downgrades
 * - Applying discount codes
 * 
 * @requirement REQ-3.3 - Payment Service for Add-Ons
 */

import { getRazorpayKeyId, getRazorpayKeyMode, isTestPricing } from '../config/payment';
import { supabase } from '../lib/supabaseClient';
import addOnCatalogService from './addOnCatalogService';
import entitlementService from './entitlementService';

const WORKER_URL = import.meta.env.VITE_PAYMENTS_API_URL;

/**
 * Get auth headers for API calls
 * @param {string} token - Auth token
 * @returns {Object} Headers object
 */
const getAuthHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Create a Razorpay order for add-on purchase
 * 
 * @param {Object} request - Order request parameters
 * @param {string} request.featureKey - The feature_key of the add-on
 * @param {string} request.userId - The user's UUID
 * @param {'monthly'|'annual'} request.billingPeriod - Billing period
 * @param {string} [request.discountCode] - Optional discount code
 * @param {string} [request.userEmail] - User's email for Razorpay
 * @param {string} [request.userName] - User's name for Razorpay
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function createAddOnOrder(request) {
  try {
    const { featureKey, userId, billingPeriod, discountCode, userEmail, userName } = request;

    // Validate required fields
    if (!featureKey) {
      return { success: false, error: 'Feature key is required' };
    }
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }
    if (!billingPeriod || !['monthly', 'annual'].includes(billingPeriod)) {
      return { success: false, error: 'Billing period must be "monthly" or "annual"' };
    }

    // Get add-on details
    const addOnResult = await addOnCatalogService.getAddOnByFeatureKey(featureKey);
    if (!addOnResult.success || !addOnResult.data) {
      return { success: false, error: addOnResult.error || 'Add-on not found' };
    }

    const addOn = addOnResult.data;

    // Check if user already has this add-on
    const accessResult = await entitlementService.hasFeatureAccess(userId, featureKey);
    if (accessResult.success && accessResult.data?.hasAccess) {
      return { 
        success: false, 
        error: 'You already have access to this feature',
        accessSource: accessResult.data.accessSource
      };
    }

    // Get price based on billing period (prices are in rupees)
    let originalPrice = billingPeriod === 'monthly' 
      ? addOn.addon_price_monthly 
      : addOn.addon_price_annual;

    // Use test pricing if in dev environment
    if (isTestPricing()) {
      originalPrice = 1; // ₹1 for testing
    }

    if (!originalPrice || originalPrice <= 0) {
      return { success: false, error: 'Invalid price for selected billing cycle' };
    }

    // Apply discount code if provided
    let discountAmount = 0;
    let discountDetails = null;
    
    if (discountCode) {
      const discountResult = await applyDiscountCode(discountCode, [{
        featureKey,
        price: originalPrice,
        billingPeriod
      }]);
      
      if (!discountResult.success) {
        return { success: false, error: discountResult.error };
      }
      
      discountAmount = discountResult.data.totalDiscount;
      discountDetails = discountResult.data.discountDetails;
    }

    const finalPrice = Math.max(originalPrice - discountAmount, 0);
    const amountInPaise = Math.round(finalPrice * 100);

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Create order via Worker
    const orderResponse = await fetch(`${WORKER_URL}/create-order`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        planId: `addon_${featureKey}`,
        planName: `${addOn.feature_name} (${billingPeriod === 'monthly' ? 'Monthly' : 'Annual'})`,
        userEmail: userEmail || session?.user?.email,
        userName: userName || session?.user?.user_metadata?.full_name || 'User',
        notes: {
          type: 'addon',
          feature_key: featureKey,
          billing_period: billingPeriod,
          discount_code: discountCode || null,
          original_price: originalPrice,
          discount_amount: discountAmount
        }
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to create order' };
    }

    const orderData = await orderResponse.json();

    // Store order details in localStorage for payment success handling
    localStorage.setItem('addon_payment_details', JSON.stringify({
      orderId: orderData.id,
      featureKey,
      billingPeriod,
      originalPrice,
      discountCode,
      discountAmount,
      finalPrice,
      addOnName: addOn.feature_name
    }));

    return {
      success: true,
      data: {
        orderId: orderData.id,
        amount: amountInPaise,
        currency: 'INR',
        featureKey,
        addOnName: addOn.feature_name,
        billingPeriod,
        originalPrice,
        discountAmount,
        finalPrice,
        discountApplied: !!discountCode && discountAmount > 0,
        razorpayKeyId: getRazorpayKeyId(),
        razorpayMode: getRazorpayKeyMode()
      }
    };
  } catch (error) {
    console.error('Error creating add-on order:', error);
    return { success: false, error: error.message || 'Failed to create order' };
  }
}

/**
 * Process add-on payment after Razorpay callback
 * Verifies payment and creates entitlement
 * 
 * @param {Object} paymentData - Payment verification data
 * @param {string} paymentData.razorpay_order_id - Razorpay order ID
 * @param {string} paymentData.razorpay_payment_id - Razorpay payment ID
 * @param {string} paymentData.razorpay_signature - Razorpay signature
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function processAddOnPayment(paymentData) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { success: false, error: 'Missing payment verification parameters' };
    }

    // Get stored payment details
    const storedDetails = localStorage.getItem('addon_payment_details');
    if (!storedDetails) {
      return { success: false, error: 'Payment details not found' };
    }

    const paymentDetails = JSON.parse(storedDetails);
    
    // Verify the order ID matches
    if (paymentDetails.orderId !== razorpay_order_id) {
      return { success: false, error: 'Order ID mismatch' };
    }

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const userId = session?.user?.id;

    if (!token || !userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify payment via Worker
    const verifyResponse = await fetch(`${WORKER_URL}/verify-payment`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        plan: {
          type: 'addon',
          feature_key: paymentDetails.featureKey,
          billing_period: paymentDetails.billingPeriod
        }
      }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json().catch(() => ({}));
      return { success: false, error: error.error || 'Payment verification failed' };
    }

    // Create entitlement
    const entitlementResult = await entitlementService.activateAddOn(
      userId,
      paymentDetails.featureKey,
      paymentDetails.billingPeriod
    );

    if (!entitlementResult.success) {
      console.error('Failed to create entitlement:', entitlementResult.error);
      // Payment succeeded but entitlement failed - log for manual resolution
      await logPaymentIssue({
        type: 'entitlement_creation_failed',
        userId,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        featureKey: paymentDetails.featureKey,
        error: entitlementResult.error
      });
      return { 
        success: false, 
        error: 'Payment successful but activation failed. Please contact support.',
        paymentSucceeded: true
      };
    }

    // Update discount code usage if applicable
    if (paymentDetails.discountCode) {
      await incrementDiscountCodeUsage(paymentDetails.discountCode);
    }

    // Clear stored payment details
    localStorage.removeItem('addon_payment_details');

    // Track analytics event
    await trackAddOnPurchase({
      userId,
      featureKey: paymentDetails.featureKey,
      billingPeriod: paymentDetails.billingPeriod,
      amount: paymentDetails.finalPrice,
      discountCode: paymentDetails.discountCode
    });

    return {
      success: true,
      data: {
        entitlement: entitlementResult.data,
        featureKey: paymentDetails.featureKey,
        addOnName: paymentDetails.addOnName,
        billingPeriod: paymentDetails.billingPeriod
      }
    };
  } catch (error) {
    console.error('Error processing add-on payment:', error);
    return { success: false, error: error.message || 'Payment processing failed' };
  }
}


/**
 * Calculate proration for upgrading/downgrading add-ons
 * Used when user changes billing period or switches add-ons
 * 
 * @param {string} userId - The user's UUID
 * @param {string} featureKey - The feature_key to calculate proration for
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function calculateProration(userId, featureKey) {
  try {
    if (!userId || !featureKey) {
      return { success: false, error: 'User ID and feature key are required' };
    }

    // Get current entitlement for this feature
    const { data: entitlements, error: entError } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_key', featureKey)
      .in('status', ['active', 'grace_period'])
      .single();

    if (entError || !entitlements) {
      // No existing entitlement - no proration needed
      return {
        success: true,
        data: {
          hasExistingEntitlement: false,
          proratedCredit: 0,
          daysRemaining: 0,
          message: 'No existing entitlement found'
        }
      };
    }

    const entitlement = entitlements;
    const now = new Date();
    const endDate = new Date(entitlement.end_date);
    const startDate = new Date(entitlement.start_date);

    // Calculate days remaining
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    
    // Calculate prorated credit
    const priceAtPurchase = parseFloat(entitlement.price_at_purchase) || 0;
    const dailyRate = priceAtPurchase / totalDays;
    const proratedCredit = Math.round(dailyRate * daysRemaining * 100) / 100;

    return {
      success: true,
      data: {
        hasExistingEntitlement: true,
        entitlementId: entitlement.id,
        billingPeriod: entitlement.billing_period,
        startDate: entitlement.start_date,
        endDate: entitlement.end_date,
        priceAtPurchase,
        totalDays,
        daysRemaining,
        dailyRate: Math.round(dailyRate * 100) / 100,
        proratedCredit,
        message: `${daysRemaining} days remaining, ₹${proratedCredit} credit available`
      }
    };
  } catch (error) {
    console.error('Error calculating proration:', error);
    return { success: false, error: error.message || 'Failed to calculate proration' };
  }
}

/**
 * Apply discount code to add-on items
 * Validates the code and calculates discount amount
 * 
 * @param {string} code - The discount code
 * @param {Array<{featureKey: string, price: number, billingPeriod: string}>} items - Items to apply discount to
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function applyDiscountCode(code, items) {
  try {
    if (!code) {
      return { success: false, error: 'Discount code is required' };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'At least one item is required' };
    }

    // Fetch discount code from database
    const { data: discount, error: discountError } = await supabase
      .from('addon_discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (discountError || !discount) {
      return { success: false, error: 'Invalid discount code' };
    }

    // Check if discount has expired
    const now = new Date();
    if (discount.valid_from && new Date(discount.valid_from) > now) {
      return { success: false, error: 'Discount code is not yet active' };
    }

    if (discount.valid_until && new Date(discount.valid_until) < now) {
      return { success: false, error: 'Discount code has expired' };
    }

    // Check usage limit
    if (discount.max_uses !== null && discount.current_uses >= discount.max_uses) {
      return { success: false, error: 'Discount code usage limit reached' };
    }

    // Check minimum purchase amount
    const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);
    if (discount.min_purchase_amount && totalPrice < discount.min_purchase_amount) {
      return { 
        success: false, 
        error: `Minimum purchase of ₹${discount.min_purchase_amount} required for this code` 
      };
    }

    // Check if discount applies to specific add-ons
    const applicableFeatureKeys = discount.applicable_feature_keys || [];
    let applicableItems = items;
    
    if (applicableFeatureKeys.length > 0) {
      applicableItems = items.filter(item => 
        applicableFeatureKeys.includes(item.featureKey)
      );
      
      if (applicableItems.length === 0) {
        return { 
          success: false, 
          error: 'Discount code is not applicable to selected add-ons' 
        };
      }
    }

    // Calculate discount amount
    let totalDiscount = 0;
    const itemDiscounts = [];

    for (const item of applicableItems) {
      let itemDiscount = 0;
      
      if (discount.discount_type === 'percentage') {
        itemDiscount = Math.floor((item.price * discount.discount_value) / 100);
      } else if (discount.discount_type === 'fixed') {
        // Fixed discount is distributed across applicable items
        itemDiscount = discount.discount_value / applicableItems.length;
      }

      // Apply max discount cap if set
      if (discount.max_discount_amount) {
        itemDiscount = Math.min(itemDiscount, discount.max_discount_amount / applicableItems.length);
      }

      // Ensure discount doesn't exceed item price
      itemDiscount = Math.min(itemDiscount, item.price);
      
      totalDiscount += itemDiscount;
      itemDiscounts.push({
        featureKey: item.featureKey,
        originalPrice: item.price,
        discount: Math.round(itemDiscount * 100) / 100,
        finalPrice: Math.round((item.price - itemDiscount) * 100) / 100
      });
    }

    return {
      success: true,
      data: {
        code: discount.code,
        discountType: discount.discount_type,
        discountValue: discount.discount_value,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        itemDiscounts,
        discountDetails: {
          id: discount.id,
          code: discount.code,
          description: discount.description
        }
      }
    };
  } catch (error) {
    console.error('Error applying discount code:', error);
    return { success: false, error: error.message || 'Failed to apply discount code' };
  }
}

/**
 * Increment discount code usage count
 * @param {string} code - The discount code
 */
async function incrementDiscountCodeUsage(code) {
  try {
    const { error } = await supabase.rpc('increment_addon_discount_usage', {
      code_param: code.toUpperCase()
    });

    if (error) {
      // Fallback to direct update if RPC doesn't exist
      await supabase
        .from('addon_discount_codes')
        .update({ 
          current_uses: supabase.sql`current_uses + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('code', code.toUpperCase());
    }
  } catch (error) {
    console.error('Error incrementing discount code usage:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Log payment issues for manual resolution
 * @param {Object} issue - Issue details
 */
async function logPaymentIssue(issue) {
  try {
    await supabase
      .from('addon_events')
      .insert({
        user_id: issue.userId,
        event_type: 'payment_issue',
        feature_key: issue.featureKey,
        metadata: {
          type: issue.type,
          payment_id: issue.paymentId,
          order_id: issue.orderId,
          error: issue.error
        }
      });
  } catch (error) {
    console.error('Error logging payment issue:', error);
  }
}

/**
 * Track add-on purchase analytics
 * @param {Object} data - Purchase data
 */
async function trackAddOnPurchase(data) {
  try {
    await supabase
      .from('addon_events')
      .insert({
        user_id: data.userId,
        event_type: 'addon_purchased',
        feature_key: data.featureKey,
        metadata: {
          billing_period: data.billingPeriod,
          amount: data.amount,
          discount_code: data.discountCode
        }
      });
  } catch (error) {
    console.error('Error tracking add-on purchase:', error);
  }
}

/**
 * Create order for bundle purchase
 * 
 * @param {Object} request - Order request parameters
 * @param {string} request.bundleId - The bundle UUID
 * @param {string} request.userId - The user's UUID
 * @param {'monthly'|'annual'} request.billingPeriod - Billing period
 * @param {string} [request.discountCode] - Optional discount code
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function createBundleOrder(request) {
  try {
    const { bundleId, userId, billingPeriod, discountCode, userEmail, userName } = request;

    // Validate required fields
    if (!bundleId) {
      return { success: false, error: 'Bundle ID is required' };
    }
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }
    if (!billingPeriod || !['monthly', 'annual'].includes(billingPeriod)) {
      return { success: false, error: 'Billing period must be "monthly" or "annual"' };
    }

    // Get bundle details
    const bundleResult = await addOnCatalogService.getBundles();
    if (!bundleResult.success) {
      return { success: false, error: bundleResult.error || 'Failed to fetch bundles' };
    }

    const bundle = bundleResult.data?.find(b => b.id === bundleId);
    if (!bundle) {
      return { success: false, error: 'Bundle not found' };
    }

    // Get price based on billing period
    let originalPrice = billingPeriod === 'monthly' 
      ? bundle.monthly_price 
      : bundle.annual_price;

    // Use test pricing if in dev environment
    if (isTestPricing()) {
      originalPrice = 1; // ₹1 for testing
    }

    if (!originalPrice || originalPrice <= 0) {
      return { success: false, error: 'Invalid price for selected billing cycle' };
    }

    // Get feature keys from bundle for discount validation
    const featureKeys = bundle.bundle_features?.map(bf => bf.feature_key) || [];

    // Apply discount code if provided
    let discountAmount = 0;
    
    if (discountCode) {
      const discountResult = await applyDiscountCode(discountCode, [{
        featureKey: `bundle_${bundleId}`,
        price: originalPrice,
        billingPeriod
      }]);
      
      if (!discountResult.success) {
        return { success: false, error: discountResult.error };
      }
      
      discountAmount = discountResult.data.totalDiscount;
    }

    const finalPrice = Math.max(originalPrice - discountAmount, 0);
    const amountInPaise = Math.round(finalPrice * 100);

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Create order via Worker
    const orderResponse = await fetch(`${WORKER_URL}/create-order`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        planId: `bundle_${bundleId}`,
        planName: `${bundle.name} Bundle (${billingPeriod === 'monthly' ? 'Monthly' : 'Annual'})`,
        userEmail: userEmail || session?.user?.email,
        userName: userName || session?.user?.user_metadata?.full_name || 'User',
        notes: {
          type: 'bundle',
          bundle_id: bundleId,
          feature_keys: featureKeys,
          billing_period: billingPeriod,
          discount_code: discountCode || null
        }
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to create order' };
    }

    const orderData = await orderResponse.json();

    // Store order details
    localStorage.setItem('bundle_payment_details', JSON.stringify({
      orderId: orderData.id,
      bundleId,
      bundleName: bundle.name,
      featureKeys,
      billingPeriod,
      originalPrice,
      discountCode,
      discountAmount,
      finalPrice
    }));

    return {
      success: true,
      data: {
        orderId: orderData.id,
        amount: amountInPaise,
        currency: 'INR',
        bundleId,
        bundleName: bundle.name,
        featureKeys,
        billingPeriod,
        originalPrice,
        discountAmount,
        finalPrice,
        razorpayKeyId: getRazorpayKeyId(),
        razorpayMode: getRazorpayKeyMode()
      }
    };
  } catch (error) {
    console.error('Error creating bundle order:', error);
    return { success: false, error: error.message || 'Failed to create order' };
  }
}

/**
 * Process bundle payment after Razorpay callback
 * 
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function processBundlePayment(paymentData) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { success: false, error: 'Missing payment verification parameters' };
    }

    // Get stored payment details
    const storedDetails = localStorage.getItem('bundle_payment_details');
    if (!storedDetails) {
      return { success: false, error: 'Payment details not found' };
    }

    const paymentDetails = JSON.parse(storedDetails);
    
    if (paymentDetails.orderId !== razorpay_order_id) {
      return { success: false, error: 'Order ID mismatch' };
    }

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const userId = session?.user?.id;

    if (!token || !userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify payment via Worker
    const verifyResponse = await fetch(`${WORKER_URL}/verify-payment`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        plan: {
          type: 'bundle',
          bundle_id: paymentDetails.bundleId,
          billing_period: paymentDetails.billingPeriod
        }
      }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json().catch(() => ({}));
      return { success: false, error: error.error || 'Payment verification failed' };
    }

    // Activate bundle (creates entitlements for all features)
    const entitlementResult = await entitlementService.activateBundle(
      userId,
      paymentDetails.bundleId,
      paymentDetails.billingPeriod
    );

    if (!entitlementResult.success) {
      console.error('Failed to create bundle entitlements:', entitlementResult.error);
      await logPaymentIssue({
        type: 'bundle_entitlement_creation_failed',
        userId,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        featureKey: `bundle_${paymentDetails.bundleId}`,
        error: entitlementResult.error
      });
      return { 
        success: false, 
        error: 'Payment successful but activation failed. Please contact support.',
        paymentSucceeded: true
      };
    }

    // Update discount code usage
    if (paymentDetails.discountCode) {
      await incrementDiscountCodeUsage(paymentDetails.discountCode);
    }

    // Clear stored payment details
    localStorage.removeItem('bundle_payment_details');

    // Track analytics
    await trackAddOnPurchase({
      userId,
      featureKey: `bundle_${paymentDetails.bundleId}`,
      billingPeriod: paymentDetails.billingPeriod,
      amount: paymentDetails.finalPrice,
      discountCode: paymentDetails.discountCode
    });

    return {
      success: true,
      data: {
        entitlements: entitlementResult.data,
        bundleId: paymentDetails.bundleId,
        bundleName: paymentDetails.bundleName,
        billingPeriod: paymentDetails.billingPeriod
      }
    };
  } catch (error) {
    console.error('Error processing bundle payment:', error);
    return { success: false, error: error.message || 'Payment processing failed' };
  }
}

/**
 * Validate a discount code without applying it
 * 
 * @param {string} code - The discount code to validate
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function validateDiscountCode(code) {
  try {
    if (!code) {
      return { success: false, error: 'Discount code is required' };
    }

    const { data: discount, error } = await supabase
      .from('addon_discount_codes')
      .select('code, description, discount_type, discount_value, valid_from, valid_until, max_uses, current_uses, min_purchase_amount, applicable_feature_keys')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !discount) {
      return { success: false, error: 'Invalid discount code' };
    }

    const now = new Date();
    if (discount.valid_from && new Date(discount.valid_from) > now) {
      return { success: false, error: 'Discount code is not yet active' };
    }

    if (discount.valid_until && new Date(discount.valid_until) < now) {
      return { success: false, error: 'Discount code has expired' };
    }

    if (discount.max_uses !== null && discount.current_uses >= discount.max_uses) {
      return { success: false, error: 'Discount code usage limit reached' };
    }

    return {
      success: true,
      data: {
        code: discount.code,
        description: discount.description,
        discountType: discount.discount_type,
        discountValue: discount.discount_value,
        minPurchaseAmount: discount.min_purchase_amount,
        applicableFeatureKeys: discount.applicable_feature_keys
      }
    };
  } catch (error) {
    console.error('Error validating discount code:', error);
    return { success: false, error: error.message || 'Failed to validate discount code' };
  }
}

// Default export with all methods
export default {
  createAddOnOrder,
  processAddOnPayment,
  calculateProration,
  applyDiscountCode,
  validateDiscountCode,
  createBundleOrder,
  processBundlePayment
};
