/**
 * Event order handlers
 */

import { createClient } from '@supabase/supabase-js';
import type { Env } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { createSupabaseAdmin, getSupabaseUrl } from '../utils/supabase';
import { getRazorpayKeyId, getRazorpayKeySecret, isTestMode } from '../utils/razorpay';
import { MAX_EVENT_AMOUNT_RUPEES, EVENT_TEST_MODE_MAX_AMOUNT } from '../config';

/**
 * POST /create-event-order - Create Razorpay order for event registration
 */
export async function handleCreateEventOrder(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    amount?: number;
    currency?: string;
    registrationId?: string;
    planName?: string;
    userEmail?: string;
    userName?: string;
    userPhone?: string;
    campaign?: string;
  };

  const { amount, currency, registrationId, planName, userEmail, userName, userPhone, campaign } = body;

  if (!amount || !currency || !userEmail) {
    return jsonResponse({ error: 'Missing required fields: amount, currency, userEmail' }, 400);
  }

  if (amount <= 0) {
    return jsonResponse({ error: 'Amount must be positive' }, 400);
  }

  const amountInRupees = amount / 100;
  if (amountInRupees > MAX_EVENT_AMOUNT_RUPEES) {
    return jsonResponse({ error: `Amount exceeds maximum limit of ₹${MAX_EVENT_AMOUNT_RUPEES.toLocaleString()}` }, 400);
  }

  if (currency !== 'INR') {
    return jsonResponse({ error: 'Only INR currency is supported' }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    return jsonResponse({ error: 'Invalid email format' }, 400);
  }

  const supabaseAdmin = createSupabaseAdmin(env);

  let tableName = 'event_registrations';
  if (planName && planName.toLowerCase().startsWith('pre-registration')) {
    tableName = 'pre_registrations';
  }

  let finalRegistrationId = registrationId;

  if (!finalRegistrationId) {
    const { data: existingReg } = await supabaseAdmin
      .from(tableName)
      .select('id, payment_status')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle();

    if (existingReg) {
      if (existingReg.payment_status === 'completed') {
        return jsonResponse({ error: 'You have already registered with this email.' }, 400);
      }
      finalRegistrationId = existingReg.id;
    } else {
      const { data: newReg, error: insertError } = await supabaseAdmin
        .from(tableName)
        .insert({
          full_name: userName || '',
          email: userEmail.toLowerCase(),
          phone: userPhone || '',
          amount: amountInRupees,
          campaign: campaign || 'direct',
          role_type: 'pre_registration',
          payment_status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) {
        return jsonResponse({ error: 'Failed to create registration' }, 500);
      }

      finalRegistrationId = newReg.id;
    }
  }

  if (!finalRegistrationId) {
    return jsonResponse({ error: 'Failed to determine registration ID' }, 500);
  }

  const receipt = `event_${Date.now()}_${finalRegistrationId.substring(0, 8)}`;

  // Create Razorpay order via shared worker
  const razorpayWorkerUrl = env.RAZORPAY_WORKER_URL || 'http://localhost:8787';
  const razorpayResponse = await fetch(`${razorpayWorkerUrl}/create-order`, {
    method: 'POST',
    headers: {
      'X-API-Key': env.RAZORPAY_WORKER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes: {
        registration_id: finalRegistrationId,
        plan_name: planName,
        user_email: userEmail,
        user_name: userName,
      },
    }),
  });

  if (!razorpayResponse.ok) {
    const errorData = await razorpayResponse.json();
    console.error('Razorpay Worker Error:', errorData);
    return jsonResponse({ error: 'Unable to create payment order' }, 500);
  }

  const result = await razorpayResponse.json();
  const order = result.order;
  const keyId = result.key_id;

  await supabaseAdmin
    .from(tableName)
    .update({
      razorpay_order_id: order.id,
    })
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

/**
 * POST /update-event-payment-status - Update event payment status
 */
export async function handleUpdateEventPaymentStatus(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
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

  const supabaseAdmin = createSupabaseAdmin(env);

  let tableName = 'event_registrations';
  if (planName && planName.toLowerCase().startsWith('pre-registration')) {
    tableName = 'pre_registrations';
  }

  const updateData: any = {
    payment_status: status,
  };

  if (status === 'completed') {
    updateData.razorpay_payment_id = paymentId;
  }

  const { error: updateError } = await supabaseAdmin
    .from(tableName)
    .update(updateData)
    .eq('id', registrationId);

  if (updateError) {
    return jsonResponse({ error: 'Failed to update payment status' }, 500);
  }

  return jsonResponse({
    success: true,
    status: status,
    registration_id: registrationId,
    order_id: orderId
  });
}

/**
 * POST /expire-subscriptions - Auto-expire old subscriptions (cron)
 */
export async function handleExpireSubscriptions(env: Env): Promise<Response> {
  const supabaseAdmin = createSupabaseAdmin(env);

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
