/**
 * Event payment handlers — no auth required for create-event-order
 *
 * POST /api/payments/create-event-order
 * POST /api/payments/update-event-payment-status
 * POST /api/payments/webhook
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../src/functions-lib/response';
import type { PaymentsEnv } from '../types';

function adminClient(env: PaymentsEnv) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL!;
  return createClient(url, env.SUPABASE_SERVICE_ROLE_KEY);
}

async function mintServiceJwt(secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({
    service_id: 'functions-payment-service',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
  })).replace(/=/g, '');
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${data}.${sigB64}`;
}

async function callWorker(env: PaymentsEnv, path: string, method: 'GET' | 'POST', body?: unknown): Promise<Response> {
  const token = await mintServiceJwt(env.RAZORPAY_SERVICE_SECRET);
  return fetch(`${env.RAZORPAY_WORKER_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// ── POST /create-event-order ──────────────────────────────────────────────────

export async function handleCreateEventOrder(req: Request, env: PaymentsEnv): Promise<Response> {
  const body = await req.json() as {
    amount?: number;
    currency?: string;
    registrationId?: string;
    planName?: string;
    userEmail?: string;
    userName?: string;
    userPhone?: string;
    campaign?: string;
    origin?: string;
  };

  const { amount, currency = 'INR', registrationId, planName, userEmail, userName, userPhone, campaign } = body;

  if (!amount || !userEmail) {
    return jsonResponse({ error: 'Missing required fields: amount, userEmail' }, 400);
  }
  if (amount <= 0) return jsonResponse({ error: 'Amount must be positive' }, 400);
  if (currency !== 'INR') return jsonResponse({ error: 'Only INR currency is supported' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    return jsonResponse({ error: 'Invalid email format' }, 400);
  }

  const supabase = adminClient(env);
  const tableName = planName?.toLowerCase().startsWith('pre-registration')
    ? 'pre_registrations'
    : 'event_registrations';

  let finalRegistrationId = registrationId;

  if (!finalRegistrationId) {
    const { data: existing } = await supabase
      .from(tableName).select('id, payment_status')
      .eq('email', userEmail.toLowerCase()).maybeSingle();

    if (existing) {
      if (existing.payment_status === 'completed') {
        return jsonResponse({ error: 'You have already registered with this email.' }, 400);
      }
      finalRegistrationId = existing.id;
    } else {
      const { data: newReg, error: insertError } = await supabase
        .from(tableName).insert({
          full_name: userName || '', email: userEmail.toLowerCase(),
          phone: userPhone || '', amount: amount / 100,
          campaign: campaign || 'direct', role_type: 'pre_registration', payment_status: 'pending',
        }).select('id').single();
      if (insertError) return jsonResponse({ error: 'Failed to create registration' }, 500);
      finalRegistrationId = newReg.id;
    }
  } else {
    const { data: existing } = await supabase
      .from(tableName).select('id, payment_status').eq('id', finalRegistrationId).maybeSingle();
    if (!existing) return jsonResponse({ error: 'Registration not found' }, 404);
  }

  // Create order via payments-worker
  const workerRes = await callWorker(env, '/create-order', 'POST', {
    amount,
    currency,
    receipt: `event_${Date.now()}_${finalRegistrationId!.substring(0, 8)}`,
    notes: { registration_id: finalRegistrationId, plan_name: planName, user_email: userEmail, user_name: userName },
  });

  const workerData = await workerRes.json() as any;
  if (!workerRes.ok || !workerData.success) {
    return jsonResponse({ error: workerData.error?.message || 'Failed to create order' }, 502);
  }

  // Update registration with order ID and payment history — matches old worker exactly
  const { data: regData } = await supabase.from(tableName)
    .select('payment_history').eq('id', finalRegistrationId!).maybeSingle();
  const paymentHistory = ((regData as any)?.payment_history as any[]) || [];
  paymentHistory.push({
    order_id: workerData.order.id,
    payment_id: null,
    status: 'pending',
    created_at: new Date().toISOString(),
    error: null,
  });
  await supabase.from(tableName)
    .update({ razorpay_order_id: workerData.order.id, payment_history: paymentHistory })
    .eq('id', finalRegistrationId!);

  return jsonResponse({
    success: true,
    id: workerData.order.id,
    amount: workerData.order.amount,
    currency: workerData.order.currency,
    receipt: workerData.order.receipt,
    key: workerData.key_id,
    registrationId: finalRegistrationId,
  });
}

// ── POST /update-event-payment-status ─────────────────────────────────────────

export async function handleUpdateEventPaymentStatus(req: Request, env: PaymentsEnv): Promise<Response> {
  const body = await req.json() as {
    registrationId?: string;
    orderId?: string;
    paymentId?: string;
    status?: 'completed' | 'failed';
    error?: string;
    planName?: string;
  };

  const { registrationId, orderId, paymentId, status, error: errorMessage, planName } = body;
  if (!registrationId || !orderId || !status) {
    return jsonResponse({ error: 'Missing required fields: registrationId, orderId, status' }, 400);
  }
  if (!['completed', 'failed'].includes(status)) {
    return jsonResponse({ error: 'Status must be either "completed" or "failed"' }, 400);
  }

  const supabase = adminClient(env);
  const tableName = planName?.toLowerCase().startsWith('pre-registration')
    ? 'pre_registrations' : 'event_registrations';

  // Get current registration and payment history
  const { data: registration, error: regError } = await supabase
    .from(tableName).select('id, payment_history, razorpay_order_id')
    .eq('id', registrationId).maybeSingle();

  if (regError || !registration) return jsonResponse({ error: 'Registration not found' }, 404);

  // Update payment history array — matches old worker exactly
  const paymentHistory = (registration.payment_history as any[]) || [];
  const updatedHistory = paymentHistory.map((attempt: any) => {
    if (attempt.order_id === orderId) {
      return {
        ...attempt,
        payment_id: paymentId || attempt.payment_id,
        status,
        completed_at: new Date().toISOString(),
        error: errorMessage || null,
      };
    }
    return attempt;
  });

  const updateData: Record<string, any> = { payment_history: updatedHistory };
  if (status === 'completed') {
    updateData.payment_status = 'completed';
    updateData.razorpay_payment_id = paymentId;
  } else if (status === 'failed') {
    updateData.payment_status = 'failed';
  }

  const { error: updateError } = await supabase.from(tableName).update(updateData).eq('id', registrationId);
  if (updateError) return jsonResponse({ error: 'Failed to update payment status' }, 500);

  return jsonResponse({ success: true, status, registration_id: registrationId, order_id: orderId });
}

// ── POST /webhook ─────────────────────────────────────────────────────────────

export async function handleWebhook(req: Request, env: PaymentsEnv): Promise<Response> {
  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) return jsonResponse({ error: 'Missing x-razorpay-signature' }, 400);

  // Verify via payments-worker
  const rawBody = await req.text();
  const verifyRes = await callWorker(env, '/verify-webhook', 'POST',
    JSON.parse(rawBody) // worker re-verifies from body
  );

  // Forward raw body with signature header to worker for proper HMAC check
  const token = await mintServiceJwt(env.RAZORPAY_SERVICE_SECRET);
  const workerVerifyRes = await fetch(`${env.RAZORPAY_WORKER_URL}/verify-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-razorpay-signature': signature,
    },
    body: rawBody,
  });

  const verifyData = await workerVerifyRes.json() as any;
  if (!workerVerifyRes.ok || !verifyData.verified) {
    return jsonResponse({ error: 'Invalid webhook signature' }, 400);
  }

  const payload = verifyData.payload as any;
  const event = payload?.event as string;

  if (!event || !payload) return jsonResponse({ success: true, event: 'ignored' });

  const supabase = adminClient(env);

  switch (event) {
    case 'payment.captured': {
      const payment = payload.payload?.payment?.entity;
      if (payment) {
        await supabase.from('payment_transactions').upsert({
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: 'success',
          payment_method: payment.method,
        }, { onConflict: 'razorpay_payment_id' });
      }
      break;
    }
    case 'payment.failed': {
      const payment = payload.payload?.payment?.entity;
      if (payment?.order_id) {
        await supabase.from('razorpay_orders')
          .update({ status: 'failed' }).eq('order_id', payment.order_id);
      }
      break;
    }
    case 'subscription.cancelled': {
      const sub = payload.payload?.subscription?.entity;
      if (sub?.id) {
        await supabase.from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', sub.id);
      }
      break;
    }
    case 'subscription.paused': {
      const sub = payload.payload?.subscription?.entity;
      if (sub?.id) {
        await supabase.from('subscriptions')
          .update({ status: 'paused', paused_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', sub.id);
      }
      break;
    }
    case 'subscription.resumed': {
      const sub = payload.payload?.subscription?.entity;
      if (sub?.id) {
        await supabase.from('subscriptions')
          .update({ status: 'active', paused_at: null })
          .eq('razorpay_subscription_id', sub.id);
      }
      break;
    }
  }

  return jsonResponse({ success: true, event });
}
