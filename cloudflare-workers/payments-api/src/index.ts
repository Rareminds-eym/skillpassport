/**
 * Payments API Cloudflare Worker
 * Handles Razorpay payment processing:
 * - /create-order - Create Razorpay order
 * - /verify-payment - Verify payment signature
 * - /webhook - Handle Razorpay webhooks
 * - /cancel-subscription - Cancel Razorpay subscription
 * - /deactivate-subscription - Deactivate subscription in DB
 * - /expire-subscriptions - Expire old subscriptions (cron)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Valid plan amounts in paise
const VALID_AMOUNTS = [100, 49900, 99900, 199900];
const MAX_AMOUNT = 1000000;

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function authenticateUser(request: Request, env: Env): Promise<{ user: any; supabase: SupabaseClient } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  return { user, supabase };
}

function getRazorpayCredentials(env: Env) {
  // Use test credentials if available
  const keyId = env.TEST_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID;
  const keySecret = env.TEST_RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
  return { keyId, keySecret };
}

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const text = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(text));
  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return generatedSignature === signature;
}

async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return generatedSignature === signature;
}


// ==================== CREATE ORDER ====================

async function handleCreateOrder(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;
  const { keyId, keySecret } = getRazorpayCredentials(env);

  const body = await request.json() as {
    amount?: number;
    currency?: string;
    planId?: string;
    planName?: string;
    userEmail?: string;
    userName?: string;
  };

  const { amount, currency, planId, planName, userEmail, userName } = body;

  // Validate required fields
  if (!amount || !currency || !userEmail || !planId || !planName) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Validate amount
  if (amount <= 0 || amount > MAX_AMOUNT) {
    return jsonResponse({ error: 'Invalid amount' }, 400);
  }

  if (!VALID_AMOUNTS.includes(amount)) {
    return jsonResponse({ error: 'Invalid plan amount' }, 400);
  }

  if (currency !== 'INR') {
    return jsonResponse({ error: 'Only INR currency is supported' }, 400);
  }

  // Rate limiting check
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabase
    .from('razorpay_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo);

  if (count && count >= 5) {
    return jsonResponse({ error: 'Too many order attempts. Please wait a minute.' }, 429);
  }

  // Create Razorpay order
  const receipt = `rcpt_${Date.now()}_${user.id.substring(0, 8)}`;
  const razorpayAuth = btoa(`${keyId}:${keySecret}`);

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${razorpayAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes: {
        user_id: user.id,
        plan_id: planId,
        plan_name: planName,
        user_email: userEmail,
        user_name: userName,
      },
    }),
  });

  if (!razorpayResponse.ok) {
    console.error('Razorpay API Error:', await razorpayResponse.text());
    return jsonResponse({ error: 'Unable to create payment order' }, 500);
  }

  const order = await razorpayResponse.json() as any;

  // Save order to database
  const { error: dbError } = await supabase.from('razorpay_orders').insert({
    user_id: user.id,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    status: 'created',
    plan_id: planId,
    plan_name: planName,
    user_email: userEmail,
    user_name: userName,
    created_at: new Date().toISOString(),
  });

  if (dbError) {
    console.error('Failed to save order:', dbError);
    return jsonResponse({ error: 'Order created but failed to save' }, 500);
  }

  return jsonResponse({
    success: true,
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
  });
}

// ==================== VERIFY PAYMENT ====================

async function handleVerifyPayment(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { keyId, keySecret } = getRazorpayCredentials(env);

  const body = await request.json() as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Check idempotency
  const { data: existingPayment } = await supabaseAdmin
    .from('payment_transactions')
    .select('id')
    .eq('razorpay_payment_id', razorpay_payment_id)
    .maybeSingle();

  if (existingPayment) {
    const { data: order } = await supabaseAdmin
      .from('razorpay_orders')
      .select('user_id')
      .eq('order_id', razorpay_order_id)
      .maybeSingle();

    return jsonResponse({
      success: true,
      verified: true,
      message: 'Payment already verified',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      user_id: order?.user_id,
      already_processed: true,
    });
  }

  // Verify order exists
  const { data: order, error: orderError } = await supabaseAdmin
    .from('razorpay_orders')
    .select('*')
    .eq('order_id', razorpay_order_id)
    .maybeSingle();

  if (orderError || !order) {
    return jsonResponse({ error: 'Order not found' }, 404);
  }

  // Verify signature
  const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
  if (!isValid) {
    return jsonResponse({ error: 'Invalid payment signature' }, 400);
  }

  // Fetch payment details from Razorpay
  let paymentMethod = 'unknown';
  let paymentAmount = 0;

  try {
    const razorpayAuth = btoa(`${keyId}:${keySecret}`);
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { 'Authorization': `Basic ${razorpayAuth}` },
    });

    if (paymentResponse.ok) {
      const paymentDetails = await paymentResponse.json() as any;
      paymentMethod = paymentDetails.method || 'unknown';
      paymentAmount = paymentDetails.amount || 0;

      if (paymentAmount !== order.amount) {
        return jsonResponse({ error: 'Payment amount mismatch' }, 400);
      }

      if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
        return jsonResponse({ error: 'Payment not completed' }, 400);
      }
    }
  } catch (err) {
    console.error('Error fetching payment details:', err);
  }

  // Update order status
  await supabaseAdmin
    .from('razorpay_orders')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('order_id', razorpay_order_id);

  return jsonResponse({
    success: true,
    verified: true,
    message: 'Payment verified successfully',
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    user_id: order.user_id,
    user_name: order.user_name,
    user_email: order.user_email,
    payment_method: paymentMethod,
    amount: paymentAmount,
  });
}


// ==================== WEBHOOK ====================

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) {
    return jsonResponse({ error: 'Missing signature' }, 400);
  }

  const rawBody = await request.text();
  const isValid = await verifyWebhookSignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET);
  if (!isValid) {
    return jsonResponse({ error: 'Invalid signature' }, 400);
  }

  const webhookData = JSON.parse(rawBody);
  const event = webhookData.event;
  const payload = webhookData.payload;

  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  switch (event) {
    case 'payment.captured':
      await supabaseAdmin
        .from('payment_transactions')
        .update({ status: 'success', updated_at: new Date().toISOString() })
        .eq('razorpay_payment_id', payload.payment.entity.id);
      break;

    case 'payment.failed':
      await supabaseAdmin
        .from('payment_transactions')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('razorpay_payment_id', payload.payment.entity.id);
      break;

    case 'subscription.cancelled':
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;

    case 'subscription.paused':
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;

    case 'subscription.resumed':
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          paused_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;

    case 'subscription.charged':
      const payment = payload.payment.entity;
      await supabaseAdmin.from('payment_transactions').insert({
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: 'success',
        payment_method: payment.method,
        created_at: new Date().toISOString(),
      });
      break;
  }

  return jsonResponse({ success: true, event });
}

// ==================== CANCEL SUBSCRIPTION ====================

async function handleCancelSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;
  const { keyId, keySecret } = getRazorpayCredentials(env);

  const body = await request.json() as { subscription_id?: string; cancel_at_cycle_end?: boolean };
  const { subscription_id, cancel_at_cycle_end = false } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'Missing subscription_id' }, 400);
  }

  const razorpayAuth = btoa(`${keyId}:${keySecret}`);
  const razorpayResponse = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${subscription_id}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancel_at_cycle_end }),
    }
  );

  if (!razorpayResponse.ok) {
    if (razorpayResponse.status === 404) {
      return jsonResponse({
        success: true,
        message: 'Subscription already cancelled or not found',
        subscription_id,
        status: 'cancelled',
      });
    }
    return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
  }

  const cancelledSubscription = await razorpayResponse.json() as any;

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renew: false,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription_id)
    .eq('user_id', user.id);

  return jsonResponse({
    success: true,
    message: 'Subscription cancelled successfully',
    subscription_id,
    status: cancelledSubscription.status,
  });
}

// ==================== DEACTIVATE SUBSCRIPTION ====================

async function handleDeactivateSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  const body = await request.json() as {
    subscription_id?: string;
    cancellation_reason?: string;
  };
  const { subscription_id, cancellation_reason = 'other' } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'subscription_id is required' }, 400);
  }

  // Verify subscription exists and belongs to user
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, user_id, status, subscription_end_date, cancelled_at')
    .eq('id', subscription_id)
    .maybeSingle();

  if (fetchError || !subscription) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  if (subscription.user_id !== user.id) {
    return jsonResponse({ error: 'Permission denied' }, 403);
  }

  if (subscription.status === 'cancelled') {
    return jsonResponse({
      success: true,
      message: 'Subscription is already cancelled',
      subscription: {
        id: subscription.id,
        status: 'cancelled',
        cancelled_at: subscription.cancelled_at,
        access_until: subscription.subscription_end_date,
      },
      already_cancelled: true,
    });
  }

  if (!['active', 'paused'].includes(subscription.status)) {
    return jsonResponse({ error: `Cannot cancel subscription with status '${subscription.status}'` }, 400);
  }

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      auto_renew: false,
      cancellation_reason,
    })
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .select('id, status, cancelled_at, subscription_end_date')
    .single();

  if (updateError) {
    return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
  }

  return jsonResponse({
    success: true,
    message: 'Subscription cancelled successfully',
    subscription: updated,
  });
}

// ==================== CREATE EVENT ORDER ====================

const MAX_EVENT_AMOUNT_RUPEES = 10000000; // ₹1 crore max
const TEST_MODE_MAX_AMOUNT = 5000000; // ₹50,000 in paise for test mode

async function handleCreateEventOrder(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    amount?: number;
    currency?: string;
    registrationId?: string;
    planName?: string;
    userEmail?: string;
    userName?: string;
    origin?: string;
  };

  const { amount: originalAmount, currency, registrationId, planName, userEmail, userName, origin: bodyOrigin } = body;

  // Validate required fields
  if (!originalAmount || !currency || !registrationId || !userEmail) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  if (originalAmount <= 0) {
    return jsonResponse({ error: 'Amount must be positive' }, 400);
  }

  const amountInRupees = originalAmount / 100;
  if (amountInRupees > MAX_EVENT_AMOUNT_RUPEES) {
    return jsonResponse({ error: `Amount exceeds maximum limit of ₹${MAX_EVENT_AMOUNT_RUPEES.toLocaleString()}` }, 400);
  }

  if (currency !== 'INR') {
    return jsonResponse({ error: 'Only INR currency is supported' }, 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    return jsonResponse({ error: 'Invalid email format' }, 400);
  }

  // Detect if request is from production site
  const headerOrigin = request.headers.get('origin') || request.headers.get('referer') || '';
  const requestOrigin = bodyOrigin || headerOrigin;
  const isProductionSite = requestOrigin.includes('skillpassport.rareminds.in') && !requestOrigin.includes('dev-');

  // Determine credentials and amount based on site
  let keyId: string;
  let keySecret: string;
  let amount = originalAmount;

  if (isProductionSite) {
    keyId = env.RAZORPAY_KEY_ID || env.TEST_RAZORPAY_KEY_ID || '';
    keySecret = env.RAZORPAY_KEY_SECRET || env.TEST_RAZORPAY_KEY_SECRET || '';
  } else {
    keyId = env.TEST_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || '';
    keySecret = env.TEST_RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET || '';
    // Cap amount at test limit for non-production sites
    if (amount > TEST_MODE_MAX_AMOUNT) {
      console.log(`TEST MODE: Capping amount from ₹${amount / 100} to ₹${TEST_MODE_MAX_AMOUNT / 100}`);
      amount = TEST_MODE_MAX_AMOUNT;
    }
  }

  if (!keyId || !keySecret) {
    return jsonResponse({ error: 'Payment service not configured' }, 500);
  }

  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // Verify registration exists
  const { data: registration, error: regError } = await supabaseAdmin
    .from('event_registrations')
    .select('id, payment_status')
    .eq('id', registrationId)
    .maybeSingle();

  if (regError || !registration) {
    return jsonResponse({ error: 'Registration not found' }, 404);
  }

  // Create Razorpay order
  const receipt = `event_${Date.now()}_${registrationId.substring(0, 8)}`;
  const razorpayAuth = btoa(`${keyId}:${keySecret}`);

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${razorpayAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes: {
        registration_id: registrationId,
        plan_name: planName,
        user_email: userEmail,
        user_name: userName,
      },
    }),
  });

  if (!razorpayResponse.ok) {
    const errorData = await razorpayResponse.text();
    console.error('Razorpay API Error:', razorpayResponse.status, errorData);
    
    let errorMessage = 'Unable to create payment order. Please try again.';
    try {
      const parsedError = JSON.parse(errorData);
      if (parsedError.error?.description) {
        errorMessage = parsedError.error.description;
      }
    } catch {}
    
    return jsonResponse({ error: errorMessage }, 500);
  }

  const order = await razorpayResponse.json() as any;
  console.log(`Event order created: ${order.id} for registration: ${registrationId}`);

  // Update registration with order ID
  await supabaseAdmin
    .from('event_registrations')
    .update({ razorpay_order_id: order.id })
    .eq('id', registrationId);

  return jsonResponse({
    success: true,
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    key: keyId,
  });
}

// ==================== EXPIRE SUBSCRIPTIONS ====================

async function handleExpireSubscriptions(env: Env): Promise<Response> {
  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabaseAdmin.rpc('expire_old_subscriptions');

  if (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }

  const expiredCount = data?.[0]?.expired_count || 0;
  return jsonResponse({
    success: true,
    expired_count: expiredCount,
    timestamp: new Date().toISOString(),
  });
}

// ==================== MAIN HANDLER ====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/create-order':
          return await handleCreateOrder(request, env);
        case '/create-event-order':
          return await handleCreateEventOrder(request, env);
        case '/verify-payment':
          return await handleVerifyPayment(request, env);
        case '/webhook':
          return await handleWebhook(request, env);
        case '/cancel-subscription':
          return await handleCancelSubscription(request, env);
        case '/deactivate-subscription':
          return await handleDeactivateSubscription(request, env);
        case '/expire-subscriptions':
          return await handleExpireSubscriptions(env);
        case '/health':
          return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
        default:
          return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500);
    }
  },
};
