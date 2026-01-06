/**
 * Add-On Handlers
 * POST /create-addon-order - Create Razorpay order for add-on purchase
 * POST /verify-addon-payment - Verify payment AND create entitlement
 * GET /addon-catalog - Get available add-ons
 * GET /user-entitlements - Get user's active entitlements
 * POST /cancel-addon - Cancel an add-on subscription
 * GET /check-addon-access - Check if user has access to a feature
 * POST /create-bundle-order - Create Razorpay order for bundle purchase
 * POST /verify-bundle-payment - Verify bundle payment
 */

import { authenticateUser, createSupabaseAdmin, getRazorpayCredentialsForRequest, verifySignature } from '../helpers';
import { Env } from '../types';
import { jsonResponse } from '../utils';

/**
 * GET /addon-catalog - Get available add-ons and bundles
 */
export async function handleGetAddonCatalog(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const role = url.searchParams.get('role');

  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    // Fetch add-ons from subscription_plan_features where is_addon = true
    let addonsQuery = supabaseAdmin
      .from('subscription_plan_features')
      .select('id, feature_key, feature_name, category, addon_price_monthly, addon_price_annual, addon_description, target_roles, icon_url, sort_order_addon')
      .eq('is_addon', true)
      .order('sort_order_addon', { ascending: true });

    if (category) {
      addonsQuery = addonsQuery.eq('category', category);
    }

    const { data: addons, error: addonsError } = await addonsQuery;

    if (addonsError) {
      console.error('[ADDON-CATALOG] Error fetching addons:', addonsError);
      return jsonResponse({ error: addonsError.message }, 500);
    }

    // Filter by role if provided and deduplicate by feature_key
    const uniqueAddons = new Map();
    (addons || []).forEach(addon => {
      // Skip if role filter is provided and addon doesn't match
      if (role && addon.target_roles && addon.target_roles.length > 0) {
        if (!addon.target_roles.includes(role)) return;
      }
      
      // Deduplicate by feature_key
      if (!uniqueAddons.has(addon.feature_key)) {
        uniqueAddons.set(addon.feature_key, {
          id: addon.id,
          feature_key: addon.feature_key,
          name: addon.feature_name,
          description: addon.addon_description,
          category: addon.category,
          price_monthly: parseFloat(addon.addon_price_monthly) || 0,
          price_annual: parseFloat(addon.addon_price_annual) || 0,
          target_roles: addon.target_roles || [],
          icon_url: addon.icon_url,
        });
      }
    });

    // Fetch bundles
    let bundlesQuery = supabaseAdmin
      .from('bundles')
      .select('*, bundle_features(feature_key)')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const { data: bundles, error: bundlesError } = await bundlesQuery;

    // Filter bundles by role if provided
    let filteredBundles = bundles || [];
    if (role && bundles) {
      filteredBundles = bundles.filter(bundle => {
        if (!bundle.target_roles || bundle.target_roles.length === 0) return true;
        return bundle.target_roles.includes(role);
      });
    }

    return jsonResponse({
      success: true,
      addons: Array.from(uniqueAddons.values()),
      bundles: filteredBundles.map(b => ({
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
  } catch (error) {
    console.error('[ADDON-CATALOG] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * GET /user-entitlements - Get user's active entitlements
 */
export async function handleGetUserEntitlements(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user } = auth;
  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    const { data: entitlements, error } = await supabaseAdmin
      .from('user_entitlements')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'grace_period'])
      .gte('end_date', new Date().toISOString());

    if (error) {
      console.error('[USER-ENTITLEMENTS] Error:', error);
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({
      success: true,
      entitlements: entitlements || [],
    });
  } catch (error) {
    console.error('[USER-ENTITLEMENTS] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * POST /create-addon-order - Create Razorpay order for add-on purchase
 */
export async function handleCreateAddonOrder(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user } = auth;
  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    const body = await request.json() as {
      feature_key?: string;
      billing_period?: 'monthly' | 'annual';
    };

    const { feature_key, billing_period = 'monthly' } = body;

    if (!feature_key) {
      return jsonResponse({ error: 'feature_key is required' }, 400);
    }

    // Get addon details from subscription_plan_features
    const { data: addon, error: addonError } = await supabaseAdmin
      .from('subscription_plan_features')
      .select('id, feature_key, feature_name, addon_price_monthly, addon_price_annual')
      .eq('feature_key', feature_key)
      .eq('is_addon', true)
      .limit(1)
      .maybeSingle();

    if (addonError || !addon) {
      console.error('[CREATE-ADDON-ORDER] Add-on lookup error:', addonError);
      return jsonResponse({ error: 'Add-on not found for feature_key: ' + feature_key }, 404);
    }

    // Check if user already has an active entitlement
    const { data: existingEntitlement } = await supabaseAdmin
      .from('user_entitlements')
      .select('id')
      .eq('user_id', user.id)
      .eq('feature_key', feature_key)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .maybeSingle();

    if (existingEntitlement) {
      return jsonResponse({ error: 'You already have an active subscription for this add-on' }, 400);
    }

    // Calculate price
    const price = billing_period === 'annual' 
      ? parseFloat(addon.addon_price_annual) 
      : parseFloat(addon.addon_price_monthly);
    
    if (!price || price <= 0) {
      return jsonResponse({ error: 'Invalid pricing for this add-on' }, 400);
    }
    
    const amountInPaise = Math.round(price * 100);

    // Get Razorpay credentials
    const { keyId, keySecret } = getRazorpayCredentialsForRequest(request, env);
    const razorpayAuth = btoa(`${keyId}:${keySecret}`);

    // Create Razorpay order
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `addon_${feature_key}_${Date.now()}`,
        notes: {
          user_id: user.id,
          feature_key,
          billing_period,
          addon_name: addon.feature_name,
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error('[CREATE-ADDON-ORDER] Razorpay error:', errorData);
      return jsonResponse({ error: 'Failed to create payment order' }, 500);
    }

    const razorpayOrder = await razorpayResponse.json() as any;

    // Store pending order
    const { data: pendingOrder, error: orderError } = await supabaseAdmin
      .from('addon_pending_orders')
      .insert({
        user_id: user.id,
        addon_feature_key: feature_key,
        razorpay_order_id: razorpayOrder.id,
        amount: price,
        currency: 'INR',
        billing_period,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('[CREATE-ADDON-ORDER] Error creating pending order:', orderError);
      return jsonResponse({ error: 'Failed to create order: ' + orderError.message }, 500);
    }

    return jsonResponse({
      success: true,
      razorpay_order_id: razorpayOrder.id,
      order_id: pendingOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      addon_name: addon.feature_name,
      key: keyId,
    });
  } catch (error) {
    console.error('[CREATE-ADDON-ORDER] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * POST /verify-addon-payment - Verify payment AND create entitlement
 */
export async function handleVerifyAddonPayment(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    const body = await request.json() as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    // Verify signature
    const { keySecret } = getRazorpayCredentialsForRequest(request, env);
    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
    
    if (!isValid) {
      return jsonResponse({ error: 'Invalid payment signature' }, 400);
    }

    // Get pending order
    const { data: pendingOrder, error: orderError } = await supabaseAdmin
      .from('addon_pending_orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (orderError || !pendingOrder) {
      return jsonResponse({ error: 'Order not found' }, 404);
    }

    if (pendingOrder.status !== 'pending') {
      return jsonResponse({ error: 'Order already processed' }, 400);
    }

    // Calculate end date
    const now = new Date();
    const endDate = new Date(now);
    if (pendingOrder.billing_period === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create user entitlement
    const { data: entitlement, error: entitlementError } = await supabaseAdmin
      .from('user_entitlements')
      .insert({
        user_id: pendingOrder.user_id,
        feature_key: pendingOrder.addon_feature_key,
        status: 'active',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        billing_period: pendingOrder.billing_period,
        price_at_purchase: pendingOrder.amount,
        auto_renew: true,
      })
      .select()
      .single();

    if (entitlementError) {
      console.error('[VERIFY-ADDON-PAYMENT] Error creating entitlement:', entitlementError);
      return jsonResponse({ error: 'Failed to create entitlement: ' + entitlementError.message }, 500);
    }

    // Update pending order status
    await supabaseAdmin
      .from('addon_pending_orders')
      .update({
        status: 'completed',
        razorpay_payment_id,
        completed_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', pendingOrder.id);

    return jsonResponse({
      success: true,
      entitlement_id: entitlement.id,
      feature_key: entitlement.feature_key,
      end_date: entitlement.end_date,
      message: 'Payment verified and add-on activated successfully',
    });
  } catch (error) {
    console.error('[VERIFY-ADDON-PAYMENT] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * POST /cancel-addon - Cancel an add-on subscription
 */
export async function handleCancelAddon(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user } = auth;
  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    const body = await request.json() as { entitlement_id?: string };
    const { entitlement_id } = body;

    if (!entitlement_id) {
      return jsonResponse({ error: 'entitlement_id is required' }, 400);
    }

    // Verify entitlement belongs to user
    const { data: entitlement, error: fetchError } = await supabaseAdmin
      .from('user_entitlements')
      .select('*')
      .eq('id', entitlement_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !entitlement) {
      return jsonResponse({ error: 'Entitlement not found' }, 404);
    }

    if (entitlement.status === 'cancelled') {
      return jsonResponse({
        success: true,
        message: 'Entitlement is already cancelled',
        entitlement,
        already_cancelled: true,
      });
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('user_entitlements')
      .update({
        status: 'cancelled',
        auto_renew: false,
        cancelled_at: now,
        updated_at: now,
      })
      .eq('id', entitlement_id)
      .select()
      .single();

    if (updateError) {
      return jsonResponse({ error: 'Failed to cancel entitlement' }, 500);
    }

    return jsonResponse({
      success: true,
      message: 'Add-on cancelled successfully. Access continues until ' + entitlement.end_date,
      entitlement: updated,
    });
  } catch (error) {
    console.error('[CANCEL-ADDON] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * GET /check-addon-access - Check if user has access to a feature
 */
export async function handleCheckAddonAccess(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user } = auth;
  const url = new URL(request.url);
  const featureKey = url.searchParams.get('feature_key');

  if (!featureKey) {
    return jsonResponse({ error: 'feature_key is required' }, 400);
  }

  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    // Check for active entitlement
    const { data: entitlement, error } = await supabaseAdmin
      .from('user_entitlements')
      .select('id, feature_key, status, end_date, bundle_id')
      .eq('user_id', user.id)
      .eq('feature_key', featureKey)
      .in('status', ['active', 'grace_period'])
      .gte('end_date', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('[CHECK-ADDON-ACCESS] Error:', error);
      return jsonResponse({ error: error.message }, 500);
    }

    if (entitlement) {
      return jsonResponse({
        success: true,
        hasAccess: true,
        accessSource: entitlement.bundle_id ? 'bundle' : 'addon',
        entitlement,
      });
    }

    // Check if user's subscription plan includes this feature
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (subscription?.plan_id) {
      const { data: planFeature } = await supabaseAdmin
        .from('subscription_plan_features')
        .select('is_included')
        .eq('plan_id', subscription.plan_id)
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (planFeature?.is_included) {
        return jsonResponse({
          success: true,
          hasAccess: true,
          accessSource: 'plan',
        });
      }
    }

    return jsonResponse({
      success: true,
      hasAccess: false,
      accessSource: null,
    });
  } catch (error) {
    console.error('[CHECK-ADDON-ACCESS] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * POST /create-bundle-order - Create Razorpay order for bundle purchase
 */
export async function handleCreateBundleOrder(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user } = auth;
  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    const body = await request.json() as {
      bundle_id?: string;
      billing_period?: 'monthly' | 'annual';
    };

    const { bundle_id, billing_period = 'monthly' } = body;

    if (!bundle_id) {
      return jsonResponse({ error: 'bundle_id is required' }, 400);
    }

    // Get bundle details
    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from('bundles')
      .select('*, bundle_features(feature_key)')
      .eq('id', bundle_id)
      .eq('is_active', true)
      .single();

    if (bundleError || !bundle) {
      return jsonResponse({ error: 'Bundle not found' }, 404);
    }

    // Calculate price
    const price = billing_period === 'annual' 
      ? parseFloat(bundle.annual_price) 
      : parseFloat(bundle.monthly_price);
    
    if (!price || price <= 0) {
      return jsonResponse({ error: 'Invalid pricing for this bundle' }, 400);
    }
    
    const amountInPaise = Math.round(price * 100);

    // Get Razorpay credentials
    const { keyId, keySecret } = getRazorpayCredentialsForRequest(request, env);
    const razorpayAuth = btoa(`${keyId}:${keySecret}`);

    // Create Razorpay order
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `bundle_${bundle.slug}_${Date.now()}`,
        notes: {
          user_id: user.id,
          bundle_id,
          bundle_name: bundle.name,
          billing_period,
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error('[CREATE-BUNDLE-ORDER] Razorpay error:', errorData);
      return jsonResponse({ error: 'Failed to create payment order' }, 500);
    }

    const razorpayOrder = await razorpayResponse.json() as any;

    return jsonResponse({
      success: true,
      razorpay_order_id: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      bundle_name: bundle.name,
      feature_keys: bundle.bundle_features?.map((bf: any) => bf.feature_key) || [],
      key: keyId,
    });
  } catch (error) {
    console.error('[CREATE-BUNDLE-ORDER] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * POST /verify-bundle-payment - Verify bundle payment and create entitlements
 */
export async function handleVerifyBundlePayment(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user } = auth;
  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    const body = await request.json() as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      bundle_id?: string;
      billing_period?: 'monthly' | 'annual';
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bundle_id, billing_period = 'monthly' } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bundle_id) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    // Verify signature
    const { keySecret } = getRazorpayCredentialsForRequest(request, env);
    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
    
    if (!isValid) {
      return jsonResponse({ error: 'Invalid payment signature' }, 400);
    }

    // Get bundle with features
    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from('bundles')
      .select('*, bundle_features(feature_key)')
      .eq('id', bundle_id)
      .single();

    if (bundleError || !bundle) {
      return jsonResponse({ error: 'Bundle not found' }, 404);
    }

    const featureKeys = bundle.bundle_features?.map((bf: any) => bf.feature_key) || [];
    
    if (featureKeys.length === 0) {
      return jsonResponse({ error: 'Bundle has no features' }, 400);
    }

    // Calculate dates and price
    const now = new Date();
    const endDate = new Date(now);
    if (billing_period === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const bundlePrice = billing_period === 'annual' 
      ? parseFloat(bundle.annual_price) 
      : parseFloat(bundle.monthly_price);
    const pricePerFeature = bundlePrice / featureKeys.length;

    // Create entitlements for all features
    const entitlements = featureKeys.map((featureKey: string) => ({
      user_id: user.id,
      feature_key: featureKey,
      bundle_id,
      status: 'active',
      billing_period,
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: true,
      price_at_purchase: pricePerFeature,
    }));

    const { data: createdEntitlements, error: insertError } = await supabaseAdmin
      .from('user_entitlements')
      .insert(entitlements)
      .select();

    if (insertError) {
      console.error('[VERIFY-BUNDLE-PAYMENT] Error creating entitlements:', insertError);
      return jsonResponse({ error: 'Failed to create entitlements: ' + insertError.message }, 500);
    }

    return jsonResponse({
      success: true,
      entitlements: createdEntitlements,
      bundle_name: bundle.name,
      end_date: endDate.toISOString(),
      message: 'Payment verified and bundle activated successfully',
    });
  } catch (error) {
    console.error('[VERIFY-BUNDLE-PAYMENT] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
