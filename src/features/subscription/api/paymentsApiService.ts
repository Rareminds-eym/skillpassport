/**
 * Payments API Service
 * Frontend API client for Pages Functions (which proxy to payment-worker)
 * 
 * ALL subscription write operations go through this service → Pages Functions → Worker → Supabase
 * This ensures security, consistency, and proper audit trails.
 * 
 * Authentication is handled automatically by ssoClient.fetch() from @rareminds-eym/auth-client.
 * Callers do NOT need to pass tokens — they are injected by the auth client.
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

import { ssoClient } from '@/shared/api/ssoClient';

// Use Pages Functions for payments (not direct worker access)
const getBaseUrl = () => {
  const origin = window.location.origin;
  return `${origin}/api/payments`;
};

/**
 * Extract a human-readable error message from the worker/proxy response.
 * Handles both formats:
 *   - Worker v2: { success: false, error: { code, message } }
 *   - Pages Functions: { error: { code, message } }
 *   - Flat: { error: "string" }
 */
export function extractErrorMessage(errorObj) {
  if (!errorObj) return 'Unknown error';
  if (errorObj.error && typeof errorObj.error === 'object' && errorObj.error.message) {
    return errorObj.error.message;
  }
  if (typeof errorObj.error === 'string') {
    return errorObj.error;
  }
  return errorObj.message || errorObj.details || 'Unknown error';
}

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
 * @returns {Promise<Object>} Order details from Razorpay
 */
export async function createOrder({ amount, currency = 'INR', planId, planName, userEmail, userName, isUpgrade }) {
  const response = await ssoClient.fetch(`${getBaseUrl()}/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency, planId, planName, userEmail, userName, isUpgrade }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const baseMessage = extractErrorMessage(error);
    const errorMessage = error.razorpay_error
      ? `${baseMessage}: ${error.razorpay_error}`
      : baseMessage;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Create a Razorpay order for event registration
 * @param {Object} params - Order parameters
 * @param {number} params.amount - Amount in paise
 * @param {string} params.currency - Currency code
 * @param {string} params.registrationId - Event registration ID (optional)
 * @param {string} params.planName - Event name
 * @param {string} params.userEmail - User's email
 * @param {string} params.userName - User's name
 * @param {string} params.userPhone - User's phone
 * @param {string} params.campaign - Campaign name
 * @param {string} params.origin - Request origin
 * @returns {Promise<Object>} Order details from Razorpay + registration ID
 */
export async function createEventOrder({ amount, currency = 'INR', registrationId, planName, userEmail, userName, userPhone, campaign, origin }) {
  const response = await ssoClient.fetch(`${getBaseUrl()}/create-event-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency, registrationId, planName, userEmail, userName, userPhone, campaign, origin }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error) || 'Failed to create event order');
  }

  return response.json();
}

/**
 * Create a Razorpay order for learner/corporate registration
 * Automatically generates registrationId on the backend
 * Public endpoint - no authentication required
 * @param {Object} params - Order parameters
 * @param {number} params.amount - Amount in paise
 * @param {string} params.currency - Currency code (default: INR)
 * @param {string} params.planName - Registration plan name
 * @param {string} params.userEmail - User's email
 * @param {string} params.userName - User's name
 * @param {string} params.userPhone - User's phone
 * @param {string} params.campaign - Campaign name (e.g., 'skill-passport')
 * @param {string} params.origin - Request origin
 * @returns {Promise<Object>} Order details from Razorpay + auto-generated registrationId
 */
export async function createRegistrationOrder({ amount, currency = 'INR', planName, userEmail, userName, userPhone, campaign, origin }) {
  const response = await ssoClient.fetch(`${getBaseUrl()}/create-registration-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency, planName, userEmail, userName, userPhone, campaign, origin }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error) || 'Failed to create registration order');
  }

  return response.json();
}

/**
 * Update event payment status (success or failure)
 * @param {Object} params - Payment status update parameters
 * @param {string} params.registrationId - Registration ID (UUID)
 * @param {string} params.orderId - Razorpay order ID
 * @param {string} params.paymentId - Razorpay payment ID (optional for failures)
 * @param {string} params.status - Payment status ('completed' or 'failed')
 * @param {string} params.error - Error message (optional, for failures)
 * @param {string} params.planName - Plan name (to determine table)
 * @returns {Promise<Object>} Update result
 */
export async function updateEventPaymentStatus({ registrationId, orderId, paymentId, status, error, planName }) {
  const response = await ssoClient.fetch(`${getBaseUrl()}/update-event-payment-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId, orderId, paymentId, status, error, planName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update payment status');
  }

  return response.json();
}

/**
 * Update registration payment status in pre_registrations table
 * Public endpoint - no authentication required
 * @param {Object} params - Payment status update parameters
 * @param {string} params.registrationId - Registration ID (UUID)
 * @param {string} params.orderId - Razorpay order ID
 * @param {string} params.paymentId - Razorpay payment ID (optional for failures)
 * @param {string} params.status - Payment status ('completed' or 'failed')
 * @param {string} params.error - Error message (optional, for failures)
 * @returns {Promise<Object>} Update result
 */
export async function updateRegistrationPaymentStatus({ registrationId, orderId, paymentId, status, error }) {
  const response = await ssoClient.fetch(`${getBaseUrl()}/update-registration-payment-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId, orderId, paymentId, status, error }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData) || 'Failed to update registration payment status');
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
 * @returns {Promise<Object>} Verification result with subscription data
 */
export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }) {
  const response = await ssoClient.fetch(`${getBaseUrl()}/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error) || 'Payment verification failed');
  }

  return response.json();
}

// ==================== SUBSCRIPTION ENDPOINTS ====================

/**
 * Get user's active subscription
 * @returns {Promise<Object>} Subscription data
 */
export async function getSubscription() {
  const response = await ssoClient.fetch(`${getBaseUrl()}/get-subscription`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error) || 'Failed to get subscription');
  }

  return response.json();
}

/**
 * Check subscription access for route protection
 * @returns {Promise<Object>} Access check result
 */
export async function checkSubscriptionAccess() {
  const response = await ssoClient.fetch(`${getBaseUrl()}/check-subscription-access`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
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
    throw new Error(extractErrorMessage(error) || 'Failed to check subscription access');
  }

  return response.json();
}

/**
 * Cancel a Razorpay recurring subscription
 * @param {string} subscriptionId - Razorpay subscription ID
 * @param {boolean} cancelAtCycleEnd - Whether to cancel at end of billing cycle
 * @returns {Promise<Object>} Cancellation result
 */
export async function cancelSubscription(subscriptionId, cancelAtCycleEnd = false) {
  const response = await ssoClient.fetch(`${getBaseUrl()}/subscription/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription_id: subscriptionId, cancel_at_cycle_end: cancelAtCycleEnd }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error) || 'Failed to cancel subscription');
  }

  return response.json();
}

/**
 * Deactivate/cancel a subscription in database
 * @param {string} subscriptionId - Database subscription ID (UUID)
 * @param {string} cancellationReason - Reason for cancellation
 * @returns {Promise<Object>} Deactivation result
 */
export async function deactivateSubscription(subscriptionId, cancellationReason = 'other') {
  const response = await ssoClient.fetch(`${getBaseUrl()}/deactivate-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription_id: subscriptionId, cancellation_reason: cancellationReason }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error) || 'Failed to deactivate subscription');
  }

  return response.json();
}

/**
 * Pause a subscription for 1-3 months
 * @param {string} subscriptionId - Database subscription ID (UUID)
 * @param {number} pauseMonths - Number of months to pause (1-3)
 * @returns {Promise<Object>} Pause result with updated subscription
 */
export async function pauseSubscription(subscriptionId, pauseMonths = 1) {
  const response = await ssoClient.fetch(`${getBaseUrl()}/pause-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription_id: subscriptionId, pause_months: pauseMonths }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error) || 'Failed to pause subscription');
  }

  return response.json();
}

/**
 * Resume a paused subscription
 * @param {string} subscriptionId - Database subscription ID (UUID)
 * @returns {Promise<Object>} Resume result with updated subscription
 */
export async function resumeSubscription(subscriptionId) {
  const response = await ssoClient.fetch(`${getBaseUrl()}/resume-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription_id: subscriptionId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(error) || 'Failed to resume subscription');
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
    const response = await ssoClient.fetch(`${getBaseUrl()}/health`);
    return response.json();
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// Default export with all methods
const paymentsApiService = {
  // Payment
  createOrder,
  createEventOrder,
  createRegistrationOrder,
  updateEventPaymentStatus,
  updateRegistrationPaymentStatus,
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

export { paymentsApiService };
export default paymentsApiService;
