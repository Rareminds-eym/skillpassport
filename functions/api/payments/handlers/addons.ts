/**
 * Add-on and bundle handlers — matches old payments-api request/response shapes exactly.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser } from '../../shared/auth';
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

// ── GET /user-entitlements ────────────────────────────────────────────────────

export async function handleGetUserEntitlements(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const { data, error } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', auth.user.id)
    .in('status', ['active', 'grace_period'])
    .gte('end_date', new Date().toISOString());
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, entitlements: data ?? [] });
}

// ── GET /check-addon-access?feature_key= ─────────────────────────────────────

export async function handleCheckAddonAccess(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const url = new URL(req.url);
  // Support both old (feature_key) and new (featureKey) param names
  const featureKey = url.searchParams.get('feature_key') || url.searchParams.get('featureKey');
  if (!featureKey) return jsonResponse({ error: 'feature_key is required' }, 400);

  const supabase = adminClient(env);

  const { data: entitlement } = await supabase
    .from('user_entitlements')
    .select('id, feature_key, status, end_date, bundle_id')
    .eq('user_id', auth.user.id)
    .eq('feature_key', featureKey)
    .in('status', ['active', 'grace_period'])
    .gte('end_date', new Date().toISOString())
    .maybeSingle();

  if (entitlement) {
    return jsonResponse({ success: true, hasAccess: true, accessSource: entitlement.bundle_id ? 'bundle' : 'addon', entitlement });
  }

  // Check if plan includes this feature
  const { data: sub } = await supabase
    .from('subscriptions').select('plan_id').eq('user_id', auth.user.id).eq('status', 'active').maybeSingle();
  if (sub?.plan_id) {
    const { data: pf } = await supabase
      .from('subscription_plan_features').select('is_included')
      .eq('plan_id', sub.plan_id).eq('feature_key', featureKey).maybeSingle();
    if (pf?.is_included) return jsonResponse({ success: true, hasAccess: true, accessSource: 'plan' });
  }

  return jsonResponse({ success: true, hasAccess: false, accessSource: null });
}

// ── POST /create-addon-order ──────────────────────────────────────────────────
// Old shape: { feature_key, billing_period: 'monthly'|'annual' }

export async function handleCreateAddonOrder(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const body = await req.json() as { feature_key?: string; billing_period?: 'monthly' | 'annual' };
  const { feature_key, billing_period = 'monthly' } = body;
  if (!feature_key) return jsonResponse({ error: 'feature_key is required' }, 400);

  // Check existing active entitlement
  const { data: existing } = await supabase
    .from('user_entitlements').select('id, status, end_date')
    .eq('user_id', auth.user.id).eq('feature_key', feature_key)
    .in('status', ['active', 'grace_period', 'cancelled'])
    .gte('end_date', new Date().toISOString()).maybeSingle();

  if (existing) {
    const msg = existing.status === 'cancelled'
      ? `You have a cancelled subscription for this add-on that is still active until ${new Date(existing.end_date).toLocaleDateString()}`
      : 'You already have an active subscription for this add-on';
    return jsonResponse({ error: msg, code: 'ENTITLEMENT_EXISTS', existing_entitlement: existing }, 409);
  }

  const { data: addon } = await supabase
    .from('subscription_plan_features')
    .select('id, feature_key, feature_name, addon_price_monthly, addon_price_annual')
    .eq('feature_key', feature_key).eq('is_addon', true).limit(1).maybeSingle();

  if (!addon) return jsonResponse({ error: 'Add-on not found for feature_key: ' + feature_key }, 404);

  const price = billing_period === 'annual'
    ? parseFloat(addon.addon_price_annual)
    : parseFloat(addon.addon_price_monthly);

  if (!price || price <= 0) return jsonResponse({ error: 'Invalid pricing for this add-on' }, 400);

  const amountPaise = Math.round(price * 100);

  const workerRes = await callWorker(env, '/create-order', 'POST', {
    amount: amountPaise, currency: 'INR',
    receipt: `addon_${feature_key}_${Date.now()}`,
    notes: { user_id: auth.user.id, feature_key, billing_period, addon_name: addon.feature_name },
  });
  const workerData = await workerRes.json() as any;
  if (!workerRes.ok || !workerData.success) {
    return jsonResponse({ error: workerData.error?.message || 'Failed to create order' }, 502);
  }

  await supabase.from('addon_pending_orders').insert({
    user_id: auth.user.id,
    addon_feature_key: feature_key,
    razorpay_order_id: workerData.order.id,
    amount: price,
    currency: 'INR',
    billing_period,
    status: 'pending',
  });

  return jsonResponse({
    success: true,
    razorpay_order_id: workerData.order.id,
    amount: amountPaise,
    currency: 'INR',
    addon_name: addon.feature_name,
    key: workerData.key_id,
  });
}

// ── POST /verify-addon-payment ────────────────────────────────────────────────

export async function handleVerifyAddonPayment(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const body = await req.json() as { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const verifyRes = await callWorker(env, '/verify-payment', 'POST', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
  const verifyData = await verifyRes.json() as any;
  if (!verifyRes.ok || !verifyData.verified) return jsonResponse({ error: 'Invalid payment signature' }, 400);

  const { data: pending } = await supabase
    .from('addon_pending_orders').select('*')
    .eq('razorpay_order_id', razorpay_order_id).single();

  if (!pending) return jsonResponse({ error: 'Order not found' }, 404);
  if (pending.status !== 'pending') return jsonResponse({ error: 'Order already processed' }, 400);

  const now = new Date();
  const endDate = new Date(now);
  if (pending.billing_period === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);

  const { data: entitlement, error: entError } = await supabase
    .from('user_entitlements')
    .insert({
      user_id: pending.user_id,
      feature_key: pending.addon_feature_key,
      status: 'active',
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      billing_period: pending.billing_period,
      price_at_purchase: pending.amount,
      auto_renew: true,
    })
    .select().single();

  if (entError) return jsonResponse({ error: entError.message }, 500);

  await supabase.from('addon_pending_orders')
    .update({ status: 'completed', razorpay_payment_id, completed_at: now.toISOString() })
    .eq('id', pending.id);

  return jsonResponse({
    success: true,
    entitlement_id: entitlement.id,
    feature_key: entitlement.feature_key,
    end_date: entitlement.end_date,
    message: 'Payment verified and add-on activated successfully',
  });
}

// ── POST /cancel-addon ────────────────────────────────────────────────────────
// Old shape: { entitlement_id }

export async function handleCancelAddon(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const body = await req.json() as { entitlement_id?: string };
  if (!body.entitlement_id) return jsonResponse({ error: 'entitlement_id is required' }, 400);

  const { data: entitlement } = await supabase
    .from('user_entitlements').select('*')
    .eq('id', body.entitlement_id).eq('user_id', auth.user.id).single();

  if (!entitlement) return jsonResponse({ error: 'Entitlement not found' }, 404);
  if (entitlement.status === 'cancelled') {
    return jsonResponse({ success: true, message: 'Entitlement is already cancelled', entitlement, already_cancelled: true });
  }

  const now = new Date().toISOString();
  const { data: updated } = await supabase
    .from('user_entitlements')
    .update({ status: 'cancelled', auto_renew: false, cancelled_at: now, updated_at: now })
    .eq('id', body.entitlement_id).select().single();

  return jsonResponse({
    success: true,
    message: `Add-on cancelled successfully. Access continues until ${entitlement.end_date}`,
    entitlement: updated,
  });
}

// ── POST /create-bundle-order ─────────────────────────────────────────────────
// Old shape: { bundle_id, billing_period: 'monthly'|'annual' }

export async function handleCreateBundleOrder(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const body = await req.json() as { bundle_id?: string; billing_period?: 'monthly' | 'annual' };
  const { bundle_id, billing_period = 'monthly' } = body;
  if (!bundle_id) return jsonResponse({ error: 'bundle_id is required' }, 400);

  const { data: bundle } = await supabase
    .from('bundles').select('*, bundle_features(feature_key)')
    .eq('id', bundle_id).eq('is_active', true).single();

  if (!bundle) return jsonResponse({ error: 'Bundle not found' }, 404);

  const price = billing_period === 'annual' ? parseFloat(bundle.annual_price) : parseFloat(bundle.monthly_price);
  if (!price || price <= 0) return jsonResponse({ error: `No price for ${billing_period} billing` }, 400);

  const amountPaise = Math.round(price * 100);

  const workerRes = await callWorker(env, '/create-order', 'POST', {
    amount: amountPaise, currency: 'INR',
    receipt: `bundle_${bundle.slug ?? bundle_id}_${Date.now()}`,
    notes: { user_id: auth.user.id, bundle_id, bundle_name: bundle.name, billing_period },
  });
  const workerData = await workerRes.json() as any;
  if (!workerRes.ok || !workerData.success) {
    return jsonResponse({ error: workerData.error?.message || 'Failed to create order' }, 502);
  }

  return jsonResponse({
    success: true,
    razorpay_order_id: workerData.order.id,
    amount: amountPaise,
    currency: 'INR',
    bundle_name: bundle.name,
    feature_keys: bundle.bundle_features?.map((bf: any) => bf.feature_key) ?? [],
    key: workerData.key_id,
  });
}

// ── POST /verify-bundle-payment ───────────────────────────────────────────────

export async function handleVerifyBundlePayment(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);

  const body = await req.json() as {
    razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string;
    bundle_id?: string; billing_period?: 'monthly' | 'annual';
  };
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bundle_id, billing_period = 'monthly' } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bundle_id) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const verifyRes = await callWorker(env, '/verify-payment', 'POST', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
  const verifyData = await verifyRes.json() as any;
  if (!verifyRes.ok || !verifyData.verified) return jsonResponse({ error: 'Invalid payment signature' }, 400);

  const { data: bundle } = await supabase
    .from('bundles').select('*, bundle_features(feature_key)').eq('id', bundle_id).single();
  if (!bundle) return jsonResponse({ error: 'Bundle not found' }, 404);

  const featureKeys: string[] = bundle.bundle_features?.map((bf: any) => bf.feature_key) ?? [];
  if (!featureKeys.length) return jsonResponse({ error: 'Bundle has no features' }, 400);

  const now = new Date();
  const endDate = new Date(now);
  if (billing_period === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);

  const bundlePrice = billing_period === 'annual' ? parseFloat(bundle.annual_price) : parseFloat(bundle.monthly_price);
  const pricePerFeature = bundlePrice / featureKeys.length;

  const { data: created, error: entError } = await supabase
    .from('user_entitlements')
    .insert(featureKeys.map((fk: string) => ({
      user_id: auth.user.id, feature_key: fk, bundle_id,
      status: 'active', billing_period,
      start_date: now.toISOString(), end_date: endDate.toISOString(),
      auto_renew: true, price_at_purchase: pricePerFeature,
    })))
    .select();

  if (entError) return jsonResponse({ error: entError.message }, 500);

  return jsonResponse({
    success: true,
    entitlements: created,
    bundle_name: bundle.name,
    end_date: endDate.toISOString(),
    message: 'Payment verified and bundle activated successfully',
  });
}
