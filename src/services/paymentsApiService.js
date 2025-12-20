/**
 * Payments API Service
 * Connects to Cloudflare Worker for payment-related API calls
 * Falls back to Supabase edge functions if worker URL not configured
 */

const WORKER_URL = import.meta.env.VITE_PAYMENTS_API_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getBaseUrl = () => WORKER_URL || `${SUPABASE_URL}/functions/v1`;
const isUsingWorker = () => !!WORKER_URL;

const getAuthHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isUsingWorker() && SUPABASE_ANON_KEY) headers['apikey'] = SUPABASE_ANON_KEY;
  return headers;
};

/**
 * Create a Razorpay order
 */
export async function createOrder({ amount, currency = 'INR', planId, userId, metadata = {} }, token) {
  const endpoint = isUsingWorker() ? '/create-order' : '/create-razorpay-order';
  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
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
  const endpoint = isUsingWorker() ? '/verify-payment' : '/verify-razorpay-payment';
  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
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

export default {
  createOrder,
  verifyPayment,
  cancelSubscription,
  deactivateSubscription,
  isUsingWorker,
};
