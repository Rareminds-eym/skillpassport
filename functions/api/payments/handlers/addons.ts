/**
 * Add-on & Bundle handlers
 * GET  /api/payments/addon-catalog
 * GET  /api/payments/user-entitlements
 * POST /api/payments/create-addon-order
 * POST /api/payments/verify-addon-payment
 * POST /api/payments/cancel-addon
 * GET  /api/payments/check-addon-access
 * POST /api/payments/create-bundle-order
 * POST /api/payments/verify-bundle-payment
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../src/functions-lib';

// Call razorpay-api worker (server-to-server) for all Razorpay operations
async function callRazorpayWorker(path: string, body: object, env: any): Promise<any> {
  const workerUrl = env.RAZORPAY_WORKER_URL || 'http://localhost:8788';
  const apiKey = env.RAZORPAY_WORKER_API_KEY;
  const res = await fetch(`${workerUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

// ── Catalog ──────────────────────────────────────────────────────────────────

export async function handleGetAddonCatalog(url: URL, supabase: SupabaseClient): Promise<Response> {
  const category = url.searchParams.get('category');
  const role = url.searchParams.get('role');

  let query = supabase
    .from('subscription_plan_features')
    .select('id, feature_key, feature_name, category, addon_price_monthly, addon_price_annual, addon_description, target_roles, icon_url, sort_order_addon')
    .eq('is_addon', true)
    .order('sort_order_addon', { ascending: true });

  if (category) query = query.eq('category', category);

  const { data: addons, error } = await query;
  if (error) return jsonResponse({ error: error.message }, 500);

  const unique = new Map<string, any>();
  (addons || []).forEach((a: any) => {
    if (role && a.target_roles?.length && !a.target_roles.includes(role)) return;
    if (!unique.has(a.feature_key)) {
      unique.set(a.feature_key, {
        id: a.id,
        feature_key: a.feature_key,
        name: a.feature_name,
        description: a.addon_description,
        category: a.category,
        price_monthly: parseFloat(a.addon_price_monthly) || 0,
        price_annual: parseFloat(a.addon_price_annual) || 0,
        target_roles: a.target_roles || [],
        icon_url: a.icon_url,
      });
    }
  });

  const { data: bundles } = await supabase
    .from('bundles')
    .select('*, bundle_features(feature_key)')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const filteredBundles = (bundles || []).filter((b: any) =>
    !role || !b.target_roles?.length || b.target_roles.includes(role)
  );

  return jsonResponse({
    success: true,
    addons: Array.from(unique.values()),
    bundles: filteredBundles.map((b: any) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      price_monthly: parseFloat(b.monthly_price) || 0,
      price_annual: parseFloat(b.annual_price) || 0,
      discount_percentage: b.discount_percentage || 0,
      target_roles: b.target_roles || [],
      feature_keys: b.bundle_features?.map((bf: any) => bf.feature_key) || [],
    })),
  });
}

// ── User entitlements ─────────────────────────────────────────────────────────

export async function handleGetUserEntitlements(userId: string, supabase: SupabaseClient): Promise<Response> {
  const { data, error } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'grace_period'])
    .gte('end_date', new Date().toISOString());

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, entitlements: data || [] });
}

// ── Check access ──────────────────────────────────────────────────────────────

export async function handleCheckAddonAccess(url: URL, userId: string, supabase: SupabaseClient): Promise<Response> {
  const featureKey = url.searchParams.get('feature_key');
  if (!featureKey) return jsonResponse({ error: 'feature_key is required' }, 400);

  const { data: entitlement, error } = await supabase
    .from('user_entitlements')
    .select('id, feature_key, status, end_date, bundle_id')
    .eq('user_id', userId)
    .eq('feature_key', featureKey)
    .in('status', ['active', 'grace_period'])
    .gte('end_date', new Date().toISOString())
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 500);

  if (entitlement) {
    return jsonResponse({ success: true, hasAccess: true, accessSource: entitlement.bundle_id ? 'bundle' : 'addon', entitlement });
  }

  // Check plan includes feature
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (sub?.plan_id) {
    const { data: pf } = await supabase
      .from('subscription_plan_features')
      .select('is_included')
      .eq('plan_id', sub.plan_id)
      .eq('feature_key', featureKey)
      .maybeSingle();

    if (pf?.is_included) return jsonResponse({ success: true, hasAccess: true, accessSource: 'plan' });
  }

  return jsonResponse({ success: true, hasAccess: false, accessSource: null });
}

// ── Create addon order ────────────────────────────────────────────────────────

export async function handleCreateAddonOrder(
  body: any, userId: string, supabase: SupabaseClient, env: any
): Promise<Response> {
  const { feature_key, billing_period = 'monthly' } = body;
  if (!feature_key) return jsonResponse({ error: 'feature_key is required' }, 400);

  const { data: addon, error: addonErr } = await supabase
    .from('subscription_plan_features')
    .select('id, feature_key, feature_name, addon_price_monthly, addon_price_annual')
    .eq('feature_key', feature_key)
    .eq('is_addon', true)
    .limit(1)
    .maybeSingle();

  if (addonErr || !addon) return jsonResponse({ error: 'Add-on not found: ' + feature_key }, 404);

  const { data: existing } = await supabase
    .from('user_entitlements')
    .select('id, status, end_date')
    .eq('user_id', userId)
    .eq('feature_key', feature_key)
    .in('status', ['active', 'grace_period', 'cancelled'])
    .gte('end_date', new Date().toISOString())
    .maybeSingle();

  if (existing) {
    return jsonResponse({
      error: existing.status === 'cancelled'
        ? `Cancelled subscription still active until ${new Date(existing.end_date).toLocaleDateString()}`
        : 'Already have an active subscription for this add-on',
      code: 'ENTITLEMENT_EXISTS',
      existing_entitlement: existing,
    }, 409);
  }

  const price = billing_period === 'annual'
    ? parseFloat(addon.addon_price_annual)
    : parseFloat(addon.addon_price_monthly);

  if (!price || price <= 0) return jsonResponse({ error: 'Invalid pricing for this add-on' }, 400);

  const amountInPaise = Math.round(price * 100);

  // Call razorpay-api worker (server-to-server)
  const { ok, data: rzpData } = await callRazorpayWorker('/create-order', {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `addon_${feature_key}_${Date.now()}`,
    notes: { user_id: userId, feature_key, billing_period, addon_name: addon.feature_name },
  }, env);

  if (!ok) return jsonResponse({ error: 'Failed to create payment order' }, 500);

  const { data: pending, error: orderErr } = await supabase
    .from('addon_pending_orders')
    .insert({
      user_id: userId,
      addon_feature_key: feature_key,
      razorpay_order_id: rzpData.order.id,
      amount: price,
      currency: 'INR',
      billing_period,
      status: 'pending',
    })
    .select()
    .single();

  if (orderErr) return jsonResponse({ error: 'Failed to create order: ' + orderErr.message }, 500);

  return jsonResponse({
    success: true,
    razorpay_order_id: rzpData.order.id,
    order_id: pending.id,
    amount: amountInPaise,
    currency: 'INR',
    addon_name: addon.feature_name,
    key: rzpData.key_id,
  });
}

// ── Verify addon payment ──────────────────────────────────────────────────────

export async function handleVerifyAddonPayment(
  body: any, supabase: SupabaseClient, env: any
): Promise<Response> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return jsonResponse({ error: 'Missing required fields' }, 400);

  // Verify via razorpay-api worker
  const { ok, data: verifyData } = await callRazorpayWorker('/verify-payment', {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
  }, env);

  if (!ok || !verifyData.verified) return jsonResponse({ error: 'Invalid payment signature' }, 400);

  const { data: pending, error: orderErr } = await supabase
    .from('addon_pending_orders')
    .select('*')
    .eq('razorpay_order_id', razorpay_order_id)
    .single();

  if (orderErr || !pending) return jsonResponse({ error: 'Order not found' }, 404);
  if (pending.status !== 'pending') return jsonResponse({ error: 'Order already processed' }, 400);

  const now = new Date();
  const endDate = new Date(now);
  pending.billing_period === 'annual'
    ? endDate.setFullYear(endDate.getFullYear() + 1)
    : endDate.setMonth(endDate.getMonth() + 1);

  const { data: entitlement, error: entErr } = await supabase
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
    .select()
    .single();

  if (entErr) return jsonResponse({ error: 'Failed to create entitlement: ' + entErr.message }, 500);

  await supabase
    .from('addon_pending_orders')
    .update({ status: 'completed', razorpay_payment_id, completed_at: now.toISOString(), updated_at: now.toISOString() })
    .eq('id', pending.id);

  return jsonResponse({
    success: true,
    entitlement_id: entitlement.id,
    feature_key: entitlement.feature_key,
    end_date: entitlement.end_date,
    message: 'Payment verified and add-on activated successfully',
  });
}

// ── Cancel addon ──────────────────────────────────────────────────────────────

export async function handleCancelAddon(body: any, userId: string, supabase: SupabaseClient): Promise<Response> {
  const { entitlement_id } = body;
  if (!entitlement_id) return jsonResponse({ error: 'entitlement_id is required' }, 400);

  const { data: ent, error } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('id', entitlement_id)
    .eq('user_id', userId)
    .single();

  if (error || !ent) return jsonResponse({ error: 'Entitlement not found' }, 404);
  if (ent.status === 'cancelled') return jsonResponse({ success: true, message: 'Already cancelled', entitlement: ent, already_cancelled: true });

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from('user_entitlements')
    .update({ status: 'cancelled', auto_renew: false, cancelled_at: now, updated_at: now })
    .eq('id', entitlement_id)
    .select()
    .single();

  if (updErr) return jsonResponse({ error: 'Failed to cancel entitlement' }, 500);

  return jsonResponse({
    success: true,
    message: `Add-on cancelled. Access continues until ${ent.end_date}`,
    entitlement: updated,
  });
}

// ── Create bundle order ───────────────────────────────────────────────────────

export async function handleCreateBundleOrder(
  body: any, userId: string, supabase: SupabaseClient, env: any
): Promise<Response> {
  const { bundle_id, billing_period = 'monthly' } = body;
  if (!bundle_id) return jsonResponse({ error: 'bundle_id is required' }, 400);

  const { data: bundle, error: bundleErr } = await supabase
    .from('bundles')
    .select('*, bundle_features(feature_key)')
    .eq('id', bundle_id)
    .eq('is_active', true)
    .single();

  if (bundleErr || !bundle) return jsonResponse({ error: 'Bundle not found' }, 404);

  const featureKeys = bundle.bundle_features?.map((bf: any) => bf.feature_key) || [];
  if (!featureKeys.length) return jsonResponse({ error: 'Bundle has no features' }, 400);

  const { data: existing } = await supabase
    .from('user_entitlements')
    .select('feature_key')
    .eq('user_id', userId)
    .in('feature_key', featureKeys)
    .in('status', ['active', 'grace_period', 'cancelled'])
    .gte('end_date', new Date().toISOString());

  const owned = new Set((existing || []).map((e: any) => e.feature_key));
  if (featureKeys.every((k: string) => owned.has(k))) {
    return jsonResponse({ error: 'You already own all features in this bundle', code: 'BUNDLE_FULLY_OWNED' }, 409);
  }

  const price = billing_period === 'annual' ? parseFloat(bundle.annual_price) : parseFloat(bundle.monthly_price);
  if (!price || price <= 0) return jsonResponse({ error: 'Invalid pricing for this bundle' }, 400);

  // Call razorpay-api worker (server-to-server)
  const { ok, data: rzpData } = await callRazorpayWorker('/create-order', {
    amount: Math.round(price * 100),
    currency: 'INR',
    receipt: `bundle_${bundle.slug}_${Date.now()}`,
    notes: { user_id: userId, bundle_id, bundle_name: bundle.name, billing_period },
  }, env);

  if (!ok) return jsonResponse({ error: 'Failed to create payment order' }, 500);

  return jsonResponse({
    success: true,
    razorpay_order_id: rzpData.order.id,
    amount: Math.round(price * 100),
    currency: 'INR',
    bundle_name: bundle.name,
    feature_keys: featureKeys,
    key: rzpData.key_id,
  });
}

// ── Verify bundle payment ─────────────────────────────────────────────────────

export async function handleVerifyBundlePayment(
  body: any, userId: string, supabase: SupabaseClient, env: any
): Promise<Response> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bundle_id, billing_period = 'monthly' } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bundle_id)
    return jsonResponse({ error: 'Missing required fields' }, 400);

  // Verify via razorpay-api worker
  const { ok, data: verifyData } = await callRazorpayWorker('/verify-payment', {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
  }, env);

  if (!ok || !verifyData.verified) return jsonResponse({ error: 'Invalid payment signature' }, 400);

  const { data: bundle, error: bundleErr } = await supabase
    .from('bundles')
    .select('*, bundle_features(feature_key)')
    .eq('id', bundle_id)
    .single();

  if (bundleErr || !bundle) return jsonResponse({ error: 'Bundle not found' }, 404);

  const featureKeys = bundle.bundle_features?.map((bf: any) => bf.feature_key) || [];
  if (!featureKeys.length) return jsonResponse({ error: 'Bundle has no features' }, 400);

  const now = new Date();
  const endDate = new Date(now);
  billing_period === 'annual'
    ? endDate.setFullYear(endDate.getFullYear() + 1)
    : endDate.setMonth(endDate.getMonth() + 1);

  const bundlePrice = billing_period === 'annual' ? parseFloat(bundle.annual_price) : parseFloat(bundle.monthly_price);
  const pricePerFeature = bundlePrice / featureKeys.length;

  const { data: created, error: insertErr } = await supabase
    .from('user_entitlements')
    .insert(featureKeys.map((fk: string) => ({
      user_id: userId,
      feature_key: fk,
      bundle_id,
      status: 'active',
      billing_period,
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: true,
      price_at_purchase: pricePerFeature,
    })))
    .select();

  if (insertErr) return jsonResponse({ error: 'Failed to create entitlements: ' + insertErr.message }, 500);

  return jsonResponse({
    success: true,
    entitlements: created,
    bundle_name: bundle.name,
    end_date: endDate.toISOString(),
    message: 'Payment verified and bundle activated successfully',
  });
}
