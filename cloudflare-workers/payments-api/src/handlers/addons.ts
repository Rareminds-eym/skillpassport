/**
 * Add-On Payment Handlers
 * 
 * Server-side endpoints for add-on subscription management:
 * - POST /create-addon-order    - Create Razorpay order for add-on purchase
 * - POST /verify-addon-payment  - Verify payment AND create entitlement atomically
 * - POST /create-bundle-order   - Create Razorpay order for bundle purchase
 * - POST /verify-bundle-payment - Verify payment AND create bundle entitlements
 * - GET  /addon-catalog         - Get available add-ons
 * - GET  /user-entitlements     - Get user's active entitlements
 * - POST /cancel-addon          - Cancel an add-on subscription
 * 
 * @requirement REQ-3.3 - Server-side Add-On Payment Processing
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../index';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Helper functions
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getSupabaseUrl(env: Env): string {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is not configured');
  return url;
}

function getSupabaseAnonKey(env: Env): string {
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!key) throw new Error('SUPABASE_ANON_KEY is not configured');
  return key;
}

// Production domain check
const PRODUCTION_DOMAIN = 'skillpassport.rareminds.in';

function isProductionRequest(request: Request): boolean {
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  return origin.includes(PRODUCTION_DOMAIN) && !origin.includes('dev-');
}

function getRazorpayCredentials(request: Request, env: Env) {
  const isProduction = isProductionRequest(request);
  
  const keyId = isProduction 
    ? (env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID!)
    : (env.TEST_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID!);
  
  const keySecret = isProduction
    ? env.RAZORPAY_KEY_SECRET
    : (env.TEST_RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET);
  
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }
  
  return { keyId, keySecret, isProduction };
}

async function authenticateUser(request: Request, env: Env): Promise<{ user: any; supabase: SupabaseClient } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const supabase = createClient(supabaseUrl, getSupabaseAnonKey(env), {
    global: { headers: { Authorization: authHeader } },
  });

  return { user, supabase };
}

async function verifyRazorpaySignature(
  orderId: string, 
  paymentId: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
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

// ==================== ADD-ON CATALOG ====================

/**
 * GET /addon-catalog - Get available add-ons and bundles
 */
export async function handleGetAddonCatalog(request: Request, env: Env): Promise<Response> {
  try {
    const supabaseUrl = getSupabaseUrl(env);
    const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
    
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const category = url.searchParams.get('category');

    // Fetch add-ons
    let addOnQuery = supabaseAdmin
      .from('addon_pricing')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (role) {
      addOnQuery = addOnQuery.contains('applicable_roles', [role]);
    }
    if (category) {
      addOnQuery = addOnQuery.eq('category', category);
    }

    const { data: addOns, error: addOnError } = await addOnQuery;

    if (addOnError) {
      console.error('Error fetching add-ons:', addOnError);
      return jsonResponse({ error: 'Failed to fetch add-ons' }, 500);
    }

    // Fetch bundles with their features
    const { data: bundles, error: bundleError } = await supabaseAdmin
      .from('addon_bundles')
      .select(`
        *,
        bundle_features:addon_bundle_features(
          feature_key,
          addon:addon_pricing(feature_name, feature_key, icon)
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (bundleError) {
      console.error('Error fetching bundles:', bundleError);
    }

    // Get unique categories
    const categories = [...new Set((addOns || []).map(a => a.category).filter(Boolean))];

    return jsonResponse({
      success: true,
      data: {
        addOns: addOns || [],
        bundles: bundles || [],
        categories
      }
    });
  } catch (error) {
    console.error('Error in handleGetAddonCatalog:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

// ==================== USER ENTITLEMENTS ====================

/**
 * GET /user-entitlements - Get user's active entitlements
 */
export async function handleGetUserEntitlements(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { user } = auth;
    const supabaseUrl = getSupabaseUrl(env);
    const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: entitlements, error } = await supabaseAdmin
      .from('user_entitlements')
      .select(`
        *,
        addon:addon_pricing(feature_name, feature_key, icon, category)
      `)
      .eq('user_id', user.id)
      .in('status', ['active', 'grace_period'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entitlements:', error);
      return jsonResponse({ error: 'Failed to fetch entitlements' }, 500);
    }

    return jsonResponse({
      success: true,
      data: entitlements || []
    });
  } catch (error) {
    console.error('Error in handleGetUserEntitlements:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

// ==================== CREATE ADD-ON ORDER ====================

/**
 * POST /create-addon-order - Create Razorpay order for add-on purchase
 */
export async function handleCreateAddonOrder(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { user } = auth;
    const body = await request.json() as {
      featureKey: string;
      billingPeriod: 'monthly' | 'annual';
      discountCode?: string;
      userEmail?: string;
      userName?: string;
    };

    const { featureKey, billingPeriod, discountCode, userEmail, userName } = body;

    // Validate required fields
    if (!featureKey) {
      return jsonResponse({ error: 'Feature key is required' }, 400);
    }
    if (!billingPeriod || !['monthly', 'annual'].includes(billingPeriod)) {
      return jsonResponse({ error: 'Billing period must be "monthly" or "annual"' }, 400);
    }

    const supabaseUrl = getSupabaseUrl(env);
    const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

    // Get add-on details
    const { data: addOn, error: addOnError } = await supabaseAdmin
      .from('addon_pricing')
      .select('*')
      .eq('feature_key', featureKey)
      .eq('is_active', true)
      .single();

    if (addOnError || !addOn) {
      return jsonResponse({ error: 'Add-on not found or inactive' }, 404);
    }

    // Check if user already has this add-on
    const { data: existingEntitlement } = await supabaseAdmin
      .from('user_entitlements')
      .select('id, status, end_date')
      .eq('user_id', user.id)
      .eq('feature_key', featureKey)
      .in('status', ['active', 'grace_period'])
      .single();

    if (existingEntitlement) {
      return jsonResponse({ 
        error: 'You already have access to this feature',
        existingEntitlement: {
          id: existingEntitlement.id,
          status: existingEntitlement.status,
          endDate: existingEntitlement.end_date
        }
      }, 400);
    }

    // Get price based on billing period
    const isProduction = isProductionRequest(request);
    let price = billingPeriod === 'monthly' 
      ? addOn.addon_price_monthly 
      : addOn.addon_price_annual;

    // Use test pricing in non-production
    if (!isProduction) {
      price = 1; // ₹1 for testing
    }

    if (!price || price <= 0) {
      return jsonResponse({ error: 'Invalid price for selected billing cycle' }, 400);
    }

    // Apply discount code if provided
    let discountAmount = 0;
    let discountDetails = null;

    if (discountCode) {
      const { data: discount, error: discountError } = await supabaseAdmin
        .from('addon_discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (!discountError && discount) {
        const now = new Date();
        const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
        const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;

        if ((!validFrom || validFrom <= now) && (!validUntil || validUntil >= now)) {
          if (discount.max_uses === null || discount.current_uses < discount.max_uses) {
            if (discount.discount_type === 'percentage') {
              discountAmount = Math.floor((price * discount.discount_value) / 100);
            } else {
              discountAmount = discount.discount_value;
            }
            
            if (discount.max_discount_amount) {
              discountAmount = Math.min(discountAmount, discount.max_discount_amount);
            }
            
            discountDetails = {
              code: discount.code,
              type: discount.discount_type,
              value: discount.discount_value
            };
          }
        }
      }
    }

    const finalPrice = Math.max(price - discountAmount, 0);
    const amountInPaise = Math.round(finalPrice * 100);

    // Create Razorpay order
    const { keyId, keySecret } = getRazorpayCredentials(request, env);
    const razorpayAuth = btoa(`${keyId}:${keySecret}`);

    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `addon_${featureKey}_${Date.now()}`,
        notes: {
          type: 'addon',
          feature_key: featureKey,
          user_id: user.id,
          billing_period: billingPeriod,
          discount_code: discountCode || null,
          original_price: price,
          discount_amount: discountAmount
        }
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Razorpay order creation failed:', errorText);
      return jsonResponse({ error: 'Failed to create payment order' }, 500);
    }

    const orderData = await orderResponse.json() as { id: string };

    // Store pending order in database for verification
    await supabaseAdmin
      .from('addon_pending_orders')
      .upsert({
        order_id: orderData.id,
        user_id: user.id,
        feature_key: featureKey,
        billing_period: billingPeriod,
        original_price: price,
        discount_code: discountCode || null,
        discount_amount: discountAmount,
        final_price: finalPrice,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    console.log(`[ADDON-ORDER] Created order ${orderData.id} for user ${user.id}, addon ${featureKey}`);

    return jsonResponse({
      success: true,
      data: {
        orderId: orderData.id,
        amount: amountInPaise,
        currency: 'INR',
        featureKey,
        addOnName: addOn.feature_name,
        billingPeriod,
        originalPrice: price,
        discountAmount,
        finalPrice,
        discountApplied: discountAmount > 0,
        discountDetails,
        razorpayKeyId: keyId,
        isProduction
      }
    });
  } catch (error) {
    console.error('Error in handleCreateAddonOrder:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

// ==================== VERIFY ADD-ON PAYMENT ====================

/**
 * POST /verify-addon-payment - Verify payment AND create entitlement atomically
 */
export async function handleVerifyAddonPayment(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { user } = auth;
    const body = await request.json() as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonResponse({ error: 'Missing payment verification parameters' }, 400);
    }

    const supabaseUrl = getSupabaseUrl(env);
    const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

    // Get pending order details
    const { data: pendingOrder, error: orderError } = await supabaseAdmin
      .from('addon_pending_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (orderError || !pendingOrder) {
      console.error('Pending order not found:', razorpay_order_id);
      return jsonResponse({ error: 'Order not found or already processed' }, 404);
    }

    // Verify Razorpay signature
    const { keySecret } = getRazorpayCredentials(request, env);
    const isValid = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      console.error('Invalid Razorpay signature for order:', razorpay_order_id);
      
      // Mark order as failed
      await supabaseAdmin
        .from('addon_pending_orders')
        .update({ status: 'signature_failed', updated_at: new Date().toISOString() })
        .eq('order_id', razorpay_order_id);

      return jsonResponse({ error: 'Payment verification failed' }, 400);
    }

    // Calculate entitlement dates
    const now = new Date();
    const endDate = new Date(now);
    if (pendingOrder.billing_period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create entitlement (atomic operation)
    const { data: entitlement, error: entitlementError } = await supabaseAdmin
      .from('user_entitlements')
      .insert({
        user_id: user.id,
        feature_key: pendingOrder.feature_key,
        source_type: 'addon',
        billing_period: pendingOrder.billing_period,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        price_at_purchase: pendingOrder.final_price,
        status: 'active',
        auto_renew: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
      })
      .select()
      .single();

    if (entitlementError) {
      console.error('Failed to create entitlement:', entitlementError);
      
      // Mark order as entitlement_failed for manual resolution
      await supabaseAdmin
        .from('addon_pending_orders')
        .update({ 
          status: 'entitlement_failed', 
          payment_id: razorpay_payment_id,
          error_message: entitlementError.message,
          updated_at: new Date().toISOString() 
        })
        .eq('order_id', razorpay_order_id);

      return jsonResponse({ 
        error: 'Payment successful but activation failed. Please contact support.',
        paymentSucceeded: true,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      }, 500);
    }

    // Mark order as completed
    await supabaseAdmin
      .from('addon_pending_orders')
      .update({ 
        status: 'completed', 
        payment_id: razorpay_payment_id,
        entitlement_id: entitlement.id,
        updated_at: new Date().toISOString() 
      })
      .eq('order_id', razorpay_order_id);

    // Update discount code usage if applicable
    if (pendingOrder.discount_code) {
      await supabaseAdmin.rpc('increment_addon_discount_usage', {
        code_param: pendingOrder.discount_code.toUpperCase()
      }).catch(() => {
        // Fallback if RPC doesn't exist
        supabaseAdmin
          .from('addon_discount_codes')
          .update({ current_uses: supabaseAdmin.sql`current_uses + 1` })
          .eq('code', pendingOrder.discount_code.toUpperCase());
      });
    }

    // Log analytics event
    await supabaseAdmin
      .from('addon_events')
      .insert({
        user_id: user.id,
        event_type: 'addon_purchased',
        feature_key: pendingOrder.feature_key,
        metadata: {
          billing_period: pendingOrder.billing_period,
          amount: pendingOrder.final_price,
          discount_code: pendingOrder.discount_code,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id
        }
      });

    // Get add-on details for response
    const { data: addOn } = await supabaseAdmin
      .from('addon_pricing')
      .select('feature_name, icon')
      .eq('feature_key', pendingOrder.feature_key)
      .single();

    console.log(`[ADDON-VERIFY] Payment verified and entitlement created for user ${user.id}, addon ${pendingOrder.feature_key}`);

    return jsonResponse({
      success: true,
      data: {
        entitlement: {
          id: entitlement.id,
          featureKey: entitlement.feature_key,
          startDate: entitlement.start_date,
          endDate: entitlement.end_date,
          status: entitlement.status
        },
        addOnName: addOn?.feature_name || pendingOrder.feature_key,
        billingPeriod: pendingOrder.billing_period,
        amountPaid: pendingOrder.final_price
      }
    });
  } catch (error) {
    console.error('Error in handleVerifyAddonPayment:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}


// ==================== CREATE BUNDLE ORDER ====================

/**
 * POST /create-bundle-order - Create Razorpay order for bundle purchase
 */
export async function handleCreateBundleOrder(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { user } = auth;
    const body = await request.json() as {
      bundleId: string;
      billingPeriod: 'monthly' | 'annual';
      discountCode?: string;
      userEmail?: string;
      userName?: string;
    };

    const { bundleId, billingPeriod, discountCode, userEmail, userName } = body;

    // Validate required fields
    if (!bundleId) {
      return jsonResponse({ error: 'Bundle ID is required' }, 400);
    }
    if (!billingPeriod || !['monthly', 'annual'].includes(billingPeriod)) {
      return jsonResponse({ error: 'Billing period must be "monthly" or "annual"' }, 400);
    }

    const supabaseUrl = getSupabaseUrl(env);
    const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

    // Get bundle details with features
    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from('addon_bundles')
      .select(`
        *,
        bundle_features:addon_bundle_features(feature_key)
      `)
      .eq('id', bundleId)
      .eq('is_active', true)
      .single();

    if (bundleError || !bundle) {
      return jsonResponse({ error: 'Bundle not found or inactive' }, 404);
    }

    const featureKeys = bundle.bundle_features?.map((bf: any) => bf.feature_key) || [];

    // Check if user already has all features in the bundle
    const { data: existingEntitlements } = await supabaseAdmin
      .from('user_entitlements')
      .select('feature_key')
      .eq('user_id', user.id)
      .in('feature_key', featureKeys)
      .in('status', ['active', 'grace_period']);

    const ownedFeatures = existingEntitlements?.map(e => e.feature_key) || [];
    if (ownedFeatures.length === featureKeys.length) {
      return jsonResponse({ 
        error: 'You already have access to all features in this bundle',
        ownedFeatures
      }, 400);
    }

    // Get price based on billing period
    const isProduction = isProductionRequest(request);
    let price = billingPeriod === 'monthly' 
      ? bundle.monthly_price 
      : bundle.annual_price;

    // Use test pricing in non-production
    if (!isProduction) {
      price = 1; // ₹1 for testing
    }

    if (!price || price <= 0) {
      return jsonResponse({ error: 'Invalid price for selected billing cycle' }, 400);
    }

    // Apply discount code if provided
    let discountAmount = 0;
    let discountDetails = null;

    if (discountCode) {
      const { data: discount } = await supabaseAdmin
        .from('addon_discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (discount) {
        const now = new Date();
        const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
        const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;

        if ((!validFrom || validFrom <= now) && (!validUntil || validUntil >= now)) {
          if (discount.max_uses === null || discount.current_uses < discount.max_uses) {
            if (discount.discount_type === 'percentage') {
              discountAmount = Math.floor((price * discount.discount_value) / 100);
            } else {
              discountAmount = discount.discount_value;
            }
            
            if (discount.max_discount_amount) {
              discountAmount = Math.min(discountAmount, discount.max_discount_amount);
            }
            
            discountDetails = {
              code: discount.code,
              type: discount.discount_type,
              value: discount.discount_value
            };
          }
        }
      }
    }

    const finalPrice = Math.max(price - discountAmount, 0);
    const amountInPaise = Math.round(finalPrice * 100);

    // Create Razorpay order
    const { keyId, keySecret } = getRazorpayCredentials(request, env);
    const razorpayAuth = btoa(`${keyId}:${keySecret}`);

    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `bundle_${bundleId}_${Date.now()}`,
        notes: {
          type: 'bundle',
          bundle_id: bundleId,
          user_id: user.id,
          feature_keys: featureKeys.join(','),
          billing_period: billingPeriod,
          discount_code: discountCode || null,
          original_price: price,
          discount_amount: discountAmount
        }
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Razorpay order creation failed:', errorText);
      return jsonResponse({ error: 'Failed to create payment order' }, 500);
    }

    const orderData = await orderResponse.json() as { id: string };

    // Store pending order in database
    await supabaseAdmin
      .from('addon_pending_orders')
      .upsert({
        order_id: orderData.id,
        user_id: user.id,
        feature_key: `bundle_${bundleId}`,
        bundle_id: bundleId,
        feature_keys: featureKeys,
        billing_period: billingPeriod,
        original_price: price,
        discount_code: discountCode || null,
        discount_amount: discountAmount,
        final_price: finalPrice,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    console.log(`[BUNDLE-ORDER] Created order ${orderData.id} for user ${user.id}, bundle ${bundleId}`);

    return jsonResponse({
      success: true,
      data: {
        orderId: orderData.id,
        amount: amountInPaise,
        currency: 'INR',
        bundleId,
        bundleName: bundle.name,
        featureKeys,
        billingPeriod,
        originalPrice: price,
        discountAmount,
        finalPrice,
        discountApplied: discountAmount > 0,
        discountDetails,
        razorpayKeyId: keyId,
        isProduction
      }
    });
  } catch (error) {
    console.error('Error in handleCreateBundleOrder:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

// ==================== VERIFY BUNDLE PAYMENT ====================

/**
 * POST /verify-bundle-payment - Verify payment AND create bundle entitlements atomically
 */
export async function handleVerifyBundlePayment(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { user } = auth;
    const body = await request.json() as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonResponse({ error: 'Missing payment verification parameters' }, 400);
    }

    const supabaseUrl = getSupabaseUrl(env);
    const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

    // Get pending order details
    const { data: pendingOrder, error: orderError } = await supabaseAdmin
      .from('addon_pending_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (orderError || !pendingOrder) {
      console.error('Pending order not found:', razorpay_order_id);
      return jsonResponse({ error: 'Order not found or already processed' }, 404);
    }

    // Verify Razorpay signature
    const { keySecret } = getRazorpayCredentials(request, env);
    const isValid = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      console.error('Invalid Razorpay signature for order:', razorpay_order_id);
      
      await supabaseAdmin
        .from('addon_pending_orders')
        .update({ status: 'signature_failed', updated_at: new Date().toISOString() })
        .eq('order_id', razorpay_order_id);

      return jsonResponse({ error: 'Payment verification failed' }, 400);
    }

    // Calculate entitlement dates
    const now = new Date();
    const endDate = new Date(now);
    if (pendingOrder.billing_period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Get feature keys from pending order
    const featureKeys = pendingOrder.feature_keys || [];
    
    if (featureKeys.length === 0) {
      return jsonResponse({ error: 'No features found in bundle order' }, 400);
    }

    // Calculate price per feature for tracking
    const pricePerFeature = pendingOrder.final_price / featureKeys.length;

    // Create entitlements for all features in the bundle
    const entitlementInserts = featureKeys.map((featureKey: string) => ({
      user_id: user.id,
      feature_key: featureKey,
      source_type: 'bundle',
      source_id: pendingOrder.bundle_id,
      billing_period: pendingOrder.billing_period,
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      price_at_purchase: pricePerFeature,
      status: 'active',
      auto_renew: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id
    }));

    const { data: entitlements, error: entitlementError } = await supabaseAdmin
      .from('user_entitlements')
      .insert(entitlementInserts)
      .select();

    if (entitlementError) {
      console.error('Failed to create bundle entitlements:', entitlementError);
      
      await supabaseAdmin
        .from('addon_pending_orders')
        .update({ 
          status: 'entitlement_failed', 
          payment_id: razorpay_payment_id,
          error_message: entitlementError.message,
          updated_at: new Date().toISOString() 
        })
        .eq('order_id', razorpay_order_id);

      return jsonResponse({ 
        error: 'Payment successful but activation failed. Please contact support.',
        paymentSucceeded: true,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      }, 500);
    }

    // Mark order as completed
    await supabaseAdmin
      .from('addon_pending_orders')
      .update({ 
        status: 'completed', 
        payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString() 
      })
      .eq('order_id', razorpay_order_id);

    // Update discount code usage
    if (pendingOrder.discount_code) {
      await supabaseAdmin.rpc('increment_addon_discount_usage', {
        code_param: pendingOrder.discount_code.toUpperCase()
      }).catch(() => {});
    }

    // Log analytics event
    await supabaseAdmin
      .from('addon_events')
      .insert({
        user_id: user.id,
        event_type: 'bundle_purchased',
        feature_key: `bundle_${pendingOrder.bundle_id}`,
        metadata: {
          bundle_id: pendingOrder.bundle_id,
          feature_keys: featureKeys,
          billing_period: pendingOrder.billing_period,
          amount: pendingOrder.final_price,
          discount_code: pendingOrder.discount_code,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id
        }
      });

    // Get bundle details for response
    const { data: bundle } = await supabaseAdmin
      .from('addon_bundles')
      .select('name')
      .eq('id', pendingOrder.bundle_id)
      .single();

    console.log(`[BUNDLE-VERIFY] Payment verified and ${featureKeys.length} entitlements created for user ${user.id}`);

    return jsonResponse({
      success: true,
      data: {
        entitlements: entitlements?.map(e => ({
          id: e.id,
          featureKey: e.feature_key,
          startDate: e.start_date,
          endDate: e.end_date,
          status: e.status
        })),
        bundleName: bundle?.name || pendingOrder.bundle_id,
        billingPeriod: pendingOrder.billing_period,
        amountPaid: pendingOrder.final_price,
        featuresActivated: featureKeys.length
      }
    });
  } catch (error) {
    console.error('Error in handleVerifyBundlePayment:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

// ==================== CANCEL ADD-ON ====================

/**
 * POST /cancel-addon - Cancel an add-on subscription
 */
export async function handleCancelAddon(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { user } = auth;
    const body = await request.json() as {
      featureKey: string;
      cancelImmediately?: boolean;
    };

    const { featureKey, cancelImmediately = false } = body;

    if (!featureKey) {
      return jsonResponse({ error: 'Feature key is required' }, 400);
    }

    const supabaseUrl = getSupabaseUrl(env);
    const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

    // Get the entitlement
    const { data: entitlement, error: entError } = await supabaseAdmin
      .from('user_entitlements')
      .select('*')
      .eq('user_id', user.id)
      .eq('feature_key', featureKey)
      .in('status', ['active', 'grace_period'])
      .single();

    if (entError || !entitlement) {
      return jsonResponse({ error: 'Active entitlement not found' }, 404);
    }

    if (cancelImmediately) {
      // Cancel immediately - set status to cancelled
      const { error: updateError } = await supabaseAdmin
        .from('user_entitlements')
        .update({ 
          status: 'cancelled',
          auto_renew: false,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', entitlement.id);

      if (updateError) {
        console.error('Failed to cancel entitlement:', updateError);
        return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
      }
    } else {
      // Cancel at end of period - just disable auto-renew
      const { error: updateError } = await supabaseAdmin
        .from('user_entitlements')
        .update({ 
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', entitlement.id);

      if (updateError) {
        console.error('Failed to disable auto-renew:', updateError);
        return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
      }
    }

    // Log analytics event
    await supabaseAdmin
      .from('addon_events')
      .insert({
        user_id: user.id,
        event_type: 'addon_cancelled',
        feature_key: featureKey,
        metadata: {
          cancel_immediately: cancelImmediately,
          end_date: entitlement.end_date
        }
      });

    console.log(`[ADDON-CANCEL] User ${user.id} cancelled addon ${featureKey}, immediate: ${cancelImmediately}`);

    return jsonResponse({
      success: true,
      data: {
        featureKey,
        cancelledImmediately: cancelImmediately,
        accessUntil: cancelImmediately ? new Date().toISOString() : entitlement.end_date,
        message: cancelImmediately 
          ? 'Subscription cancelled immediately' 
          : `Subscription will end on ${new Date(entitlement.end_date).toLocaleDateString()}`
      }
    });
  } catch (error) {
    console.error('Error in handleCancelAddon:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

// ==================== CHECK FEATURE ACCESS ====================

/**
 * GET /check-addon-access - Check if user has access to a specific feature
 */
export async function handleCheckAddonAccess(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { user } = auth;
    const url = new URL(request.url);
    const featureKey = url.searchParams.get('featureKey');

    if (!featureKey) {
      return jsonResponse({ error: 'Feature key is required' }, 400);
    }

    const supabaseUrl = getSupabaseUrl(env);
    const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

    // Check for active entitlement
    const { data: entitlement } = await supabaseAdmin
      .from('user_entitlements')
      .select('id, status, end_date, source_type')
      .eq('user_id', user.id)
      .eq('feature_key', featureKey)
      .in('status', ['active', 'grace_period'])
      .single();

    if (entitlement) {
      return jsonResponse({
        success: true,
        data: {
          hasAccess: true,
          accessSource: entitlement.source_type,
          expiresAt: entitlement.end_date,
          status: entitlement.status
        }
      });
    }

    // Check if feature is included in user's subscription plan
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subscription) {
      // Check if plan includes this feature
      const { data: planFeature } = await supabaseAdmin
        .from('subscription_plan_features')
        .select('is_included')
        .eq('plan_code', subscription.plan_type)
        .eq('feature_key', featureKey)
        .eq('is_included', true)
        .single();

      if (planFeature) {
        return jsonResponse({
          success: true,
          data: {
            hasAccess: true,
            accessSource: 'subscription',
            planType: subscription.plan_type
          }
        });
      }
    }

    // No access
    return jsonResponse({
      success: true,
      data: {
        hasAccess: false,
        accessSource: null
      }
    });
  } catch (error) {
    console.error('Error in handleCheckAddonAccess:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
