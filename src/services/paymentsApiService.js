/**
 * Payments API Service
 * Connects to Cloudflare Worker for payment-related API calls
 */

const WORKER_URL = import.meta.env.VITE_PAYMENTS_API_URL;

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

/**
 * Create a Razorpay order
 */
export async function createOrder({ amount, currency = 'INR', planId, userId, metadata = {} }, token) {
  const response = await fetch(`${getBaseUrl()}/create-order`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ amount, currency, planId, userId, metadata }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create order');
  }

  return response.json();
}

/**
 * Verify payment after Razorpay callback
 */
export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }, token) {
  const response = await fetch(`${getBaseUrl()}/verify-payment`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Payment verification failed');
  }

  return response.json();
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId, token) {
  const response = await fetch(`${getBaseUrl()}/cancel-subscription`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ subscriptionId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to cancel subscription');
  }

  return response.json();
}

/**
 * Deactivate a subscription (admin)
 */
export async function deactivateSubscription(subscriptionId, token) {
  const response = await fetch(`${getBaseUrl()}/deactivate-subscription`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ subscriptionId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to deactivate subscription');
  }

  return response.json();
}

/**
 * Create a Razorpay order for event registration
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

export default {
  createOrder,
  createEventOrder,
  verifyPayment,
  cancelSubscription,
  deactivateSubscription,
};
