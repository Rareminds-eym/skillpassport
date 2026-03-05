/**
 * Razorpay service - handles payment operations
 */

import { jsonResponse, errorResponse } from '../utils/response.js';

/**
 * Create Razorpay order
 */
export async function createRazorpayOrder(request, env) {
  const isDev = env.ENVIRONMENT === 'development';
  console.log(`[RAZORPAY] Environment: ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);

  const body = await request.json();
  const { amount, currency, receipt, notes } = body;

  // Validate required fields
  if (!amount || amount <= 0) {
    return errorResponse('Invalid amount', 'Amount must be greater than 0', 400);
  }

  const razorpayAuth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: currency || 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Razorpay API Error:', data);
      return errorResponse('Failed to create order', data.error?.description, response.status);
    }

    return jsonResponse({
      success: true,
      order: data,
      key_id: env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return errorResponse('Failed to create order', error.message, 500);
  }
}

/**
 * Verify Razorpay payment signature
 */
export async function verifyRazorpaySignature(request, env) {
  const isDev = env.ENVIRONMENT === 'development';
  console.log(`[RAZORPAY] Verifying in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return errorResponse(
      'Missing required fields',
      'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      400
    );
  }

  try {
    // Generate signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(text));
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = generatedSignature === razorpay_signature;

    return jsonResponse({
      success: true,
      verified: isValid,
      message: isValid ? 'Payment signature verified' : 'Invalid payment signature',
    });
  } catch (error) {
    console.error('Verify signature error:', error);
    return errorResponse('Failed to verify signature', error.message, 500);
  }
}

/**
 * Get payment details from Razorpay
 */
export async function getPaymentDetails(request, env, paymentId) {
  const isDev = env.ENVIRONMENT === 'development';
  console.log(`[RAZORPAY] Fetching payment details: ${paymentId}`);

  if (!paymentId) {
    return errorResponse('Invalid request', 'Payment ID is required', 400);
  }

  const razorpayAuth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

  try {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Razorpay API Error:', data);
      return errorResponse('Failed to fetch payment', data.error?.description, response.status);
    }

    return jsonResponse({
      success: true,
      payment: data,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    return errorResponse('Failed to fetch payment', error.message, 500);
  }
}

/**
 * Cancel Razorpay subscription
 */
export async function cancelSubscription(request, env, subscriptionId) {
  const isDev = env.ENVIRONMENT === 'development';
  console.log(`[RAZORPAY] Cancelling subscription: ${subscriptionId}`);

  if (!subscriptionId) {
    return errorResponse('Invalid request', 'Subscription ID is required', 400);
  }

  const razorpayAuth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

  try {
    const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancel_at_cycle_end: 0 }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Razorpay API Error:', data);
      return errorResponse('Failed to cancel subscription', data.error?.description, response.status);
    }

    return jsonResponse({
      success: true,
      subscription: data,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return errorResponse('Failed to cancel subscription', error.message, 500);
  }
}

/**
 * Verify Razorpay webhook signature
 */
export async function verifyWebhookSignature(request, env) {
  const isDev = env.ENVIRONMENT === 'development';
  console.log(`[RAZORPAY] Verifying webhook signature`);

  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) {
    return errorResponse('Missing signature', 'x-razorpay-signature header is required', 400);
  }

  const body = await request.text();

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const isValid = generatedSignature === signature;

    return jsonResponse({
      success: true,
      verified: isValid,
      message: isValid ? 'Webhook signature verified' : 'Invalid webhook signature',
      payload: isValid ? JSON.parse(body) : null,
    });
  } catch (error) {
    console.error('Verify webhook error:', error);
    return errorResponse('Failed to verify webhook', error.message, 500);
  }
}
