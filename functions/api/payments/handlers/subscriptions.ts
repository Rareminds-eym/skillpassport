/**
 * Subscription handlers — business logic layer
 * POST /api/payments/create-order
 * POST /api/payments/verify-payment
 * GET  /api/payments/get-subscription
 * POST /api/payments/cancel-subscription
 * POST /api/payments/deactivate-subscription
 * POST /api/payments/pause-subscription
 * POST /api/payments/resume-subscription
 * GET  /api/payments/check-subscription-access
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../src/functions-lib';
import { callRazorpayWorker } from '../services/razorpay-client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSupabaseAdmin(env: any): SupabaseClient {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  return createClient(url, env.SUPABASE_SERVICE_ROLE_KEY);
}

function calculateEndDate(billingCycle: string, from?: Date): string {
  const base = from ? new Date(from) : new Date();
  if (billingCycle === 'yearly' || billingCycle === 'annual') {
    base.setFullYear(base.getFullYear() + 1);
  } else {
    base.setMonth(base.getMonth() + 1);
  }
  return base.toISOString();
}

// ── Create Order ──────────────────────────────────────────────────────────────

export async function handleCreateOrder(body: any, userId: string, env: any): Promise<Response> {
  const supabase = getSupabaseAdmin(env);

  const { amount, currency = 'INR', planId, planName, userEmail, userName, isUpgrade } = body;

  if (!amount || !currency || !userEmail || !planId || !planName) {
    return jsonResponse({ error: 'Missing required fields: amount, currency, userEmail, planId, planName' }, 400);
  }
  if (amount <= 0) return jsonResponse({ error: 'Invalid amount' }, 400);
  if (currency !== 'INR') return jsonResponse({ error: 'Only INR currency is supported' }, 400);

  // Check existing subscription
  if (!isUpgrade) {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id, plan_type, status, subscription_end_date')
      .eq('user_id', userId)
      .in('status', ['active', 'cancelled'])
      .gte('subscription_end_date', new Date().toISOString())
      .maybeSingle();

    if (existing) {
      const msg = existing.status === 'cancelled'
        ? `Cancelled subscription still active until ${new Date(existing.subscription_end_date).toLocaleDateString()}`
        : 'You already have an active subscription';
      return jsonResponse({ error: msg, code: 'SUBSCRIPTION_EXISTS', existing_subscription: existing }, 409);
    }
  }

  // Rate limit
  const oneMinAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabase
    .from('razorpay_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneMinAgo);
  if (count && count >= 5) return jsonResponse({ error: 'Too many order attempts. Please wait a minute.' }, 429);

  // Create order via razorpay-api worker
  const { ok, data: rzpData } = await callRazorpayWorker('/create-order', {
    amount,
    currency,
    receipt: `rcpt_${Date.now()}_${userId.substring(0, 8)}`,
    notes: { user_id: userId, plan_id: planId, plan_name: planName, user_email: userEmail, user_name: userName },
  }, env);

  if (!ok) {
    const msg = rzpData?.error?.message || rzpData?.error || 'Unable to create payment order';
    return jsonResponse({ error: msg }, 500);
  }

  const order = rzpData.order;

  // Save to DB
  const { error: dbErr } = await supabase.from('razorpay_orders').insert({
    user_id: userId,
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

  if (dbErr) {
    console.error('[create-order] DB error:', dbErr);
    return jsonResponse({ error: 'Order created but failed to save' }, 500);
  }

  return jsonResponse({
    success: true,
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    key: env.RAZORPAY_KEY_ID,
  });
}

// ── Verify Payment ────────────────────────────────────────────────────────────

export async function handleVerifyPayment(body: any, userId: string, env: any): Promise<Response> {
  const supabase = getSupabaseAdmin(env);

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Idempotency check
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('razorpay_payment_id', razorpay_payment_id)
    .maybeSingle();

  if (existingSub) {
    return jsonResponse({ success: true, verified: true, message: 'Already processed', subscription: existingSub, already_processed: true });
  }

  // Get order
  const { data: order, error: orderErr } = await supabase
    .from('razorpay_orders')
    .select('*')
    .eq('order_id', razorpay_order_id)
    .maybeSingle();

  if (orderErr || !order) return jsonResponse({ error: 'Order not found' }, 404);

  // Verify signature via worker
  const { ok, data: verifyData } = await callRazorpayWorker('/verify-payment', {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
  }, env);

  if (!ok || !verifyData.verified) return jsonResponse({ error: 'Invalid payment signature' }, 400);

  // Update order status
  await supabase.from('razorpay_orders').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('order_id', razorpay_order_id);

  // Get user details
  const { data: userData } = await supabase.from('users').select('firstName, lastName, email, phone').eq('id', order.user_id).maybeSingle();
  const fullName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : order.user_name || 'User';
  const userEmail = userData?.email || order.user_email || '';

  const billingCycle = 'yearly';
  const planAmount = plan?.price || order.amount / 100;
  const planType = plan?.name || order.plan_name || 'Standard Plan';

  // Handle existing active subscription (renewal/upgrade)
  const { data: activeSub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', order.user_id)
    .eq('status', 'active')
    .maybeSingle();

  if (activeSub) {
    const isSamePlan = activeSub.plan_type?.toLowerCase() === planType?.toLowerCase();
    if (isSamePlan) {
      const currentEnd = new Date(activeSub.subscription_end_date);
      const base = currentEnd.getTime() > Date.now() ? currentEnd : new Date();
      const newEnd = calculateEndDate(billingCycle, base);

      const { data: updated } = await supabase
        .from('subscriptions')
        .update({ razorpay_payment_id, razorpay_order_id, subscription_end_date: newEnd, updated_at: new Date().toISOString() })
        .eq('id', activeSub.id)
        .select()
        .single();

      await supabase.from('payment_transactions').insert([{
        subscription_id: activeSub.id, user_id: order.user_id,
        razorpay_payment_id, razorpay_order_id, amount: planAmount,
        currency: 'INR', status: 'success', payment_method: 'unknown', created_at: new Date().toISOString(),
      }]);

      return jsonResponse({ success: true, verified: true, message: 'Subscription renewed', subscription: updated || activeSub, is_renewal: true, new_end_date: newEnd });
    } else {
      // Upgrade — cancel old
      await supabase.from('subscriptions').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', activeSub.id);
    }
  }

  // Resolve plan UUID
  let planId: string | null = null;
  if (plan?.id) {
    const { data: planRec } = await supabase.from('subscription_plans').select('id').eq('plan_code', plan.id).maybeSingle();
    if (planRec) planId = planRec.id;
  }
  if (!planId && planType) {
    const { data: planRec } = await supabase.from('subscription_plans').select('id').ilike('name', planType).maybeSingle();
    if (planRec) planId = planRec.id;
  }

  const now = new Date();
  const endDate = calculateEndDate(billingCycle, now);

  const { data: subscription, error: subErr } = await supabase
    .from('subscriptions')
    .insert([{
      user_id: order.user_id, full_name: fullName, email: userEmail,
      plan_id: planId, plan_type: planType, plan_amount: planAmount,
      billing_cycle: billingCycle, razorpay_payment_id, razorpay_order_id,
      status: 'active', subscription_start_date: now.toISOString(),
      subscription_end_date: endDate, auto_renew: false,
      created_at: now.toISOString(), updated_at: now.toISOString(),
    }])
    .select()
    .single();

  if (subErr) {
    console.error('[verify-payment] subscription error:', subErr);
    return jsonResponse({ success: true, verified: true, message: 'Payment verified but subscription creation failed', subscription_error: subErr.message });
  }

  await supabase.from('payment_transactions').insert([{
    subscription_id: subscription.id, user_id: order.user_id,
    razorpay_payment_id, razorpay_order_id, amount: planAmount,
    currency: 'INR', status: 'success', payment_method: 'unknown', created_at: now.toISOString(),
  }]);

  await supabase.from('razorpay_orders').update({ razorpay_payment_id, subscription_id: subscription.id, updated_at: now.toISOString() }).eq('order_id', razorpay_order_id);

  return jsonResponse({
    success: true, verified: true,
    message: 'Payment verified and subscription activated',
    payment_id: razorpay_payment_id, order_id: razorpay_order_id,
    user_id: order.user_id, user_name: fullName, user_email: userEmail,
    amount: order.amount, subscription,
  });
}

// ── Get Subscription ──────────────────────────────────────────────────────────

export async function handleGetSubscription(userId: string, env: any): Promise<Response> {
  const supabase = getSupabaseAdmin(env);
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'cancelled', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, subscription: data });
}

// ── Check Subscription Access ─────────────────────────────────────────────────

export async function handleCheckSubscriptionAccess(userId: string, env: any): Promise<Response> {
  const supabase = getSupabaseAdmin(env);
  const now = new Date().toISOString();

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'cancelled', 'paused'])
    .gte('subscription_end_date', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return jsonResponse({ success: true, hasAccess: false, accessReason: 'no_subscription', subscription: null, showWarning: false });

  const daysUntilExpiry = Math.ceil((new Date(sub.subscription_end_date).getTime() - Date.now()) / 86400000);
  const showWarning = daysUntilExpiry <= 7;

  return jsonResponse({
    success: true,
    hasAccess: true,
    accessReason: sub.status,
    subscription: sub,
    showWarning,
    warningType: daysUntilExpiry <= 1 ? 'expiring_soon' : sub.status === 'paused' ? 'paused' : 'expiring_soon',
    warningMessage: showWarning ? `Subscription expires in ${daysUntilExpiry} day(s)` : null,
    daysUntilExpiry,
  });
}

// ── Cancel Subscription ───────────────────────────────────────────────────────

export async function handleCancelSubscription(body: any, userId: string, env: any): Promise<Response> {
  const supabase = getSupabaseAdmin(env);
  const { subscription_id } = body;
  if (!subscription_id) return jsonResponse({ error: 'subscription_id is required' }, 400);

  const { data: sub } = await supabase.from('subscriptions').select('*').eq('id', subscription_id).eq('user_id', userId).maybeSingle();
  if (!sub) return jsonResponse({ error: 'Subscription not found' }, 404);

  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', subscription_id)
    .select()
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, subscription: updated });
}

// ── Deactivate Subscription ───────────────────────────────────────────────────

export async function handleDeactivateSubscription(body: any, userId: string, env: any): Promise<Response> {
  const supabase = getSupabaseAdmin(env);
  const { subscription_id, cancellation_reason } = body;
  if (!subscription_id) return jsonResponse({ error: 'subscription_id is required' }, 400);

  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancellation_reason, updated_at: new Date().toISOString() })
    .eq('id', subscription_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, subscription: updated });
}

// ── Pause Subscription ────────────────────────────────────────────────────────

export async function handlePauseSubscription(body: any, userId: string, env: any): Promise<Response> {
  const supabase = getSupabaseAdmin(env);
  const { subscription_id, pause_months = 1 } = body;
  if (!subscription_id) return jsonResponse({ error: 'subscription_id is required' }, 400);

  const { data: sub } = await supabase.from('subscriptions').select('*').eq('id', subscription_id).eq('user_id', userId).maybeSingle();
  if (!sub) return jsonResponse({ error: 'Subscription not found' }, 404);

  const newEnd = new Date(sub.subscription_end_date);
  newEnd.setMonth(newEnd.getMonth() + pause_months);

  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({ status: 'paused', subscription_end_date: newEnd.toISOString(), updated_at: new Date().toISOString() })
    .eq('id', subscription_id)
    .select()
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, subscription: updated });
}

// ── Resume Subscription ───────────────────────────────────────────────────────

export async function handleResumeSubscription(body: any, userId: string, env: any): Promise<Response> {
  const supabase = getSupabaseAdmin(env);
  const { subscription_id } = body;
  if (!subscription_id) return jsonResponse({ error: 'subscription_id is required' }, 400);

  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', subscription_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, subscription: updated });
}
