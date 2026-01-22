/**
 * Payments API Service
 * Frontend API client for Cloudflare Worker (payments-api)
 * 
 * ALL subscription write operations go through this service → Worker → Supabase
 * This ensures security, consistency, and proper audit trails.
 * 
 * AVAILABLE METHODS:
 * - createOrder()              - Create Razorpay order for subscription
 * - createEventOrder()         - Create Razorpay order for events
 * - verifyPayment()            - Verify payment + create subscription
 * - getSubscription()          - Get user's active subscription
 * - checkSubscriptionAccess()  - Check if user has access (for route protection)
 * - cancelSubscription()       - Cancel Razorpay recurring subscription
 * - deactivateSubscription()   - Deactivate/cancel subscription
 * - pauseSubscription()        - Pause subscription (1-3 months)
 * - resumeSubscription()       - Resume paused subscription
 */

const WORKER_URL = 'https://payments-api.dark-mode-d021.workers.dev';

if (!WORKER_URL) {
  console.warn('⚠️ VITE_PAYMENTS_API_URL not configured. Payments API calls will fail.');
}

const getBaseUrl = () => {
  if (!WORKER_URL) {
    throw new Error('VITE_PAYMENTS_API_URL environment variable is required');
  }
  return WORKER_URL;
};

const getAuthHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// ==================== PAYMENT ENDPOINTS ====================

/**
 * Create a Razorpay order for subscription payment
 * @param {Object} params - Order parameters
 * @param {number} params.amount - Amount in paise (e.g., 99900 for ₹999)
 * @param {string} params.currency - Currency code (default: INR)
 * @param {string} params.planId - Plan identifier
 * @param {string} params.planName - Plan display name
 * @param {string} params.userEmail - User's email
 * @param {string} params.userName - User's name
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Order details from Razorpay
 */
export async function createOrder({ amount, currency = 'INR', planId, planName, userEmail, userName }, token) {
  const response = await fetch(`${getBaseUrl()}/create-order`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ amount, currency, planId, planName, userEmail, userName }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[createOrder] API Error:', error);
    // Include razorpay error details if available
    const errorMessage = error.razorpay_error
      ? `${error.error}: ${error.razorpay_error}`
      : (error.error || 'Failed to create order');
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Create a Razorpay order for event registration
 * @param {Object} params - Order parameters
 * @param {number} params.amount - Amount in paise
 * @param {string} params.currency - Currency code
 * @param {string} params.registrationId - Event registration ID
 * @param {string} params.planName - Event name
 * @param {string} params.userEmail - User's email
 * @param {string} params.userName - User's name
 * @param {string} params.origin - Request origin for test/prod detection
 * @param {string} token - Auth token (optional for events)
 * @returns {Promise<Object>} Order details from Razorpay
 */
export async function createEventOrder({ amount, currency = 'INR', registrationId, planName, userEmail, userName, origin }, token) {
  const response = await fetch(`${getBaseUrl()}/create-event-order`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ amount, currency, registrationId, planName, userEmail, userName, origin }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create event order');
  }

  return response.json();
}

/**
 * Verify payment after Razorpay callback
 * Worker handles: signature verification + subscription creation + transaction logging
 * @param {Object} params - Payment verification parameters
 * @param {string} params.razorpay_order_id - Razorpay order ID
 * @param {string} params.razorpay_payment_id - Razorpay payment ID
 * @param {string} params.razorpay_signature - Razorpay signature
 * @param {Object} params.plan - Plan details for subscription creation
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Verification result with subscription data
 */
export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }, token) {
  const response = await fetch(`${getBaseUrl()}/verify-payment`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Payment verification failed');
  }

  return response.json();
}

// ==================== SUBSCRIPTION ENDPOINTS ====================

/**
 * Get user's active subscription
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Subscription data
 */
export async function getSubscription(token) {
  const response = await fetch(`${getBaseUrl()}/get-subscription`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get subscription');
  }

  return response.json();
}

/**
 * Check subscription access for route protection
 * Returns detailed access information including grace period handling
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Access check result
 * @returns {boolean} result.hasAccess - Whether user has access
 * @returns {string} result.accessReason - Reason for access decision
 * @returns {Object|null} result.subscription - Subscription data if exists
 * @returns {boolean} result.showWarning - Whether to show warning banner
 * @returns {string} result.warningType - Type of warning (expiring_soon, grace_period, paused)
 * @returns {string} result.warningMessage - Warning message to display
 * @returns {number} result.daysUntilExpiry - Days until subscription expires
 */
export async function checkSubscriptionAccess(token) {
  const response = await fetch(`${getBaseUrl()}/check-subscription-access`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    // On 401, return no access
    if (response.status === 401) {
      return {
        success: false,
        hasAccess: false,
        accessReason: 'no_subscription',
        subscription: null,
        showWarning: false,
      };
    }

    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to check subscription access');
  }

  return response.json();
}

/**
 * Cancel a Razorpay recurring subscription
 * Use this for subscriptions with razorpay_subscription_id
 * @param {string} subscriptionId - Razorpay subscription ID
 * @param {boolean} cancelAtCycleEnd - Whether to cancel at end of billing cycle
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Cancellation result
 */
export async function cancelSubscription(subscriptionId, cancelAtCycleEnd = false, token) {
  const response = await fetch(`${getBaseUrl()}/cancel-subscription`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ subscription_id: subscriptionId, cancel_at_cycle_end: cancelAtCycleEnd }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to cancel subscription');
  }

  return response.json();
}

/**
 * Deactivate/cancel a subscription in database
 * Use this for one-time payment subscriptions (no Razorpay subscription)
 * @param {string} subscriptionId - Database subscription ID (UUID)
 * @param {string} cancellationReason - Reason for cancellation
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Deactivation result
 */
export async function deactivateSubscription(subscriptionId, cancellationReason = 'other', token) {
  const response = await fetch(`${getBaseUrl()}/deactivate-subscription`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ subscription_id: subscriptionId, cancellation_reason: cancellationReason }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to deactivate subscription');
  }

  return response.json();
}

/**
 * Pause a subscription for 1-3 months
 * Subscription end date is extended by pause duration
 * @param {string} subscriptionId - Database subscription ID (UUID)
 * @param {number} pauseMonths - Number of months to pause (1-3)
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Pause result with updated subscription
 */
export async function pauseSubscription(subscriptionId, pauseMonths = 1, token) {
  const response = await fetch(`${getBaseUrl()}/pause-subscription`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ subscription_id: subscriptionId, pause_months: pauseMonths }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to pause subscription');
  }

  return response.json();
}

/**
 * Resume a paused subscription
 * @param {string} subscriptionId - Database subscription ID (UUID)
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Resume result with updated subscription
 */
export async function resumeSubscription(subscriptionId, token) {
  const response = await fetch(`${getBaseUrl()}/resume-subscription`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ subscription_id: subscriptionId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to resume subscription');
  }

  return response.json();
}

// ==================== UTILITY ====================

/**
 * Check if payments API is configured and healthy
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${getBaseUrl()}/health`);
    return response.json();
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// Default export with all methods
export default {
  // Payment
  createOrder,
  createEventOrder,
  verifyPayment,
  // Subscription management
  getSubscription,
  checkSubscriptionAccess,
  cancelSubscription,
  deactivateSubscription,
  pauseSubscription,
  resumeSubscription,
  // Utility
  checkHealth,
};
