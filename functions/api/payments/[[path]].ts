/**
 * Payments API - Pages Function
 * Handles payment operations directly (no separate worker needed for local dev)
 * In production, proxies to the payments-api worker via service binding if available.
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse } from '../../../src/functions-lib';
import { createSupabaseAdminClient } from '../../../src/functions-lib/supabase';

// ── helpers ──────────────────────────────────────────────────────────────────

function getSupabaseAdmin(env: any) {
  return createSupabaseAdminClient(env);
}

function getRazorpayKeys(env: any): { keyId: string; keySecret: string } {
  const isTest = env.RAZORPAY_MODE === 'test';
  const keyId = isTest
    ? (env.RAZORPAY_KEY_ID_TEST || env.RAZORPAY_KEY_ID)
    : (env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID);
  const keySecret = isTest
    ? (env.RAZORPAY_KEY_SECRET_TEST || env.RAZORPAY_KEY_SECRET)
    : env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(`Razorpay keys not configured (RAZORPAY_MODE=${env.RAZORPAY_MODE || 'unset'})`);
  }
  return { keyId, keySecret };
}

// ── create-event-order ───────────────────────────────────────────────────────

async function handleCreateEventOrder(request: Request, env: any): Promise<Response> {
  const body = await request.json() as any;
  const { amount: originalAmount, currency, planName, userEmail, userName, userPhone, campaign, registrationId } = body;

  console.log('[CREATE-EVENT] env SUPABASE_URL:', (env as any).SUPABASE_URL);
  console.log('[CREATE-EVENT] env RAZORPAY_MODE:', (env as any).RAZORPAY_MODE);
  console.log('[CREATE-EVENT] body:', JSON.stringify({ originalAmount, currency, planName, userEmail, campaign }));

  if (!originalAmount || !currency || !userEmail) {
    return jsonResponse({ error: 'Missing required fields: amount, currency, userEmail' }, 400);
  }
  if (currency !== 'INR') {
    return jsonResponse({ error: 'Only INR currency is supported' }, 400);
  }

  let { keyId, keySecret } = getRazorpayKeys(env);
  let amount = originalAmount;

  // Cap at ₹50,000 in test mode
  if (env.RAZORPAY_MODE === 'test' && amount > 5000000) {
    amount = 5000000;
  }

  const supabase = getSupabaseAdmin(env);

  const tableName = planName?.toLowerCase().startsWith('pre-registration')
    ? 'pre_registrations'
    : 'event_registrations';

  let finalRegistrationId = registrationId;
  let registration: any;

  if (!finalRegistrationId) {
    const { data: existing } = await supabase
      .from(tableName)
      .select('id, payment_status, payment_history')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle();

    if (existing) {
      if (existing.payment_status === 'completed') {
        return jsonResponse({ error: 'You have already registered with this email.' }, 400);
      }
      finalRegistrationId = existing.id;
      registration = existing;
    } else {
      const insertPayload = {
        full_name: userName || '',
        email: userEmail.toLowerCase(),
        phone: userPhone || '',
        amount: originalAmount / 100,
        campaign: campaign || 'direct',
        role_type: 'pre_registration',
        payment_status: 'pending',
      };
      console.log('[CREATE-EVENT] Inserting into', tableName, JSON.stringify(insertPayload));

      const { data: newReg, error: insertError } = await supabase
        .from(tableName)
        .insert(insertPayload)
        .select('id, payment_status, payment_history')
        .single();

      if (insertError || !newReg) {
        console.error('[CREATE-EVENT] Insert error:', JSON.stringify(insertError));
        return jsonResponse({ error: `Failed to create registration: ${insertError?.message || insertError?.code || 'unknown'}` }, 500);
      }
      finalRegistrationId = newReg.id;
      registration = newReg;
    }
  } else {
    const { data: existing, error } = await supabase
      .from(tableName)
      .select('id, payment_status, payment_history')
      .eq('id', finalRegistrationId)
      .maybeSingle();

    if (error || !existing) {
      return jsonResponse({ error: 'Registration not found' }, 404);
    }
    registration = existing;
  }

  // Create Razorpay order
  const receipt = `event_${Date.now()}_${finalRegistrationId.substring(0, 8)}`;
  const razorpayAuth = btoa(`${keyId}:${keySecret}`);

  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${razorpayAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes: { registration_id: finalRegistrationId, plan_name: planName, user_email: userEmail, user_name: userName },
    }),
  });

  if (!rzpRes.ok) {
    const errText = await rzpRes.text();
    console.error('[CREATE-EVENT] Razorpay error:', rzpRes.status, errText);
    let msg = 'Unable to create payment order. Please try again.';
    try { msg = JSON.parse(errText)?.error?.description || msg; } catch { }
    return jsonResponse({ error: msg }, 500);
  }

  const order = await rzpRes.json() as any;

  // Update registration with order id
  const paymentHistory = (registration.payment_history as any[]) || [];
  paymentHistory.push({ order_id: order.id, payment_id: null, status: 'pending', created_at: new Date().toISOString(), error: null });

  await supabase
    .from(tableName)
    .update({ razorpay_order_id: order.id, payment_history: paymentHistory })
    .eq('id', finalRegistrationId);

  return jsonResponse({
    success: true,
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    key: keyId,
    registrationId: finalRegistrationId,
  });
}

// ── update-event-payment-status ──────────────────────────────────────────────

async function handleUpdateEventPaymentStatus(request: Request, env: any): Promise<Response> {
  const body = await request.json() as any;
  const { registrationId, orderId, paymentId, status, error: payError, planName } = body;

  if (!registrationId || !orderId || !status) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const supabase = getSupabaseAdmin(env);
  const tableName = planName?.toLowerCase().startsWith('pre-registration')
    ? 'pre_registrations'
    : 'event_registrations';

  const { data: reg } = await supabase
    .from(tableName)
    .select('payment_history')
    .eq('id', registrationId)
    .maybeSingle();

  const paymentHistory = (reg?.payment_history as any[]) || [];
  const idx = paymentHistory.findIndex((h: any) => h.order_id === orderId);
  if (idx >= 0) {
    paymentHistory[idx] = { ...paymentHistory[idx], payment_id: paymentId || null, status, error: payError || null };
  } else {
    paymentHistory.push({ order_id: orderId, payment_id: paymentId || null, status, created_at: new Date().toISOString(), error: payError || null });
  }

  const updateData: any = { payment_history: paymentHistory };
  if (status === 'completed') {
    updateData.payment_status = 'completed';
    updateData.razorpay_payment_id = paymentId;
  }

  const { error: updateError } = await supabase
    .from(tableName)
    .update(updateData)
    .eq('id', registrationId);

  if (updateError) {
    console.error('[UPDATE-EVENT-PAYMENT] Error:', updateError);
    return jsonResponse({ error: 'Failed to update payment status' }, 500);
  }

  return jsonResponse({ success: true, registrationId, status });
}

// ── main handler ─────────────────────────────────────────────────────────────

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const subPath = url.pathname.replace(/^\/api\/payments/, '') || '/';

  // In production with service binding, proxy to the worker
  if ((env as any).PAYMENTS_SERVICE) {
    try {
      const service = (env as any).PAYMENTS_SERVICE;
      const proxyRequest = new Request(`https://payments-api.internal${subPath}${url.search}`, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });
      const response = await service.fetch(proxyRequest);
      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
      });
    } catch (err: any) {
      console.error('Payments service binding error:', err);
      return jsonResponse({ success: false, error: 'Payments service unavailable.' }, 503);
    }
  }

  // Handle directly (local dev or no service binding)
  try {
    if (request.method === 'POST' && subPath === '/create-event-order') {
      return await handleCreateEventOrder(request, env);
    }
    if (request.method === 'POST' && subPath === '/update-event-payment-status') {
      return await handleUpdateEventPaymentStatus(request, env);
    }

    // For all other routes, try proxying to local worker on port 9003
    const workerUrl = `http://localhost:9003${subPath}${url.search}`;
    const proxyRequest = new Request(workerUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });
    const response = await fetch(proxyRequest);
    const responseBody = await response.text();
    return new Response(responseBody, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
    });
  } catch (err: any) {
    console.error('Payments handler error:', err);
    return jsonResponse({ success: false, error: err.message || 'Payment service error' }, 500);
  }
};
