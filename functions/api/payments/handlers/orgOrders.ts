/**
 * Organization order handlers (Razorpay integration)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { createSupabaseAdmin } from '../utils/supabase';
import { getRazorpayCredentialsForRequest, verifySignature } from '../utils/razorpay';

/**
 * POST /create-org-order - Create Razorpay order for organization subscription
 */
export async function handleCreateOrgOrder(request: Request, env: Env, user: any): Promise<Response> {
  const supabaseAdmin = createSupabaseAdmin(env);
  const { keyId, keySecret, isProduction } = getRazorpayCredentialsForRequest(request, env);
  
  console.log(`[CREATE-ORG-ORDER] Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

  const body = await request.json() as {
    amount?: number;
    currency?: string;
    organizationId?: string;
    organizationType?: string;
    planId?: string;
    planName?: string;
    seatCount?: number;
    targetMemberType?: string;
    billingCycle?: string;
    billingEmail?: string;
    billingName?: string;
  };

  const { amount, currency = 'INR', organizationId, organizationType, planId, planName, seatCount, targetMemberType, billingCycle, billingEmail, billingName } = body;

  if (!amount || !organizationId || !organizationType || !planId || !planName || !seatCount || !billingEmail) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  if (amount < 100 || amount > 100000000) {
    return jsonResponse({ error: 'Invalid amount' }, 400);
  }

  // Rate limiting
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabaseAdmin
    .from('razorpay_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo);

  if (count && count >= 5) {
    return jsonResponse({ error: 'Too many order attempts. Please wait a minute.' }, 429);
  }

  const receipt = `org_${Date.now()}_${organizationId.substring(0, 8)}`;
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
        organization_id: organizationId,
        organization_type: organizationType,
        plan_id: planId,
        plan_name: planName,
        seat_count: seatCount.toString(),
        target_member_type: targetMemberType,
        billing_cycle: billingCycle,
        billing_email: billingEmail,
        billing_name: billingName,
        order_type: 'organization_subscription',
      },
    }),
  });

  if (!razorpayResponse.ok) {
    const errorText = await razorpayResponse.text();
    console.error('[CREATE-ORG-ORDER] Razorpay API Error:', razorpayResponse.status, errorText);
    return jsonResponse({ error: 'Unable to create payment order' }, 500);
  }

  const order = await razorpayResponse.json() as any;

  await supabaseAdmin.from('razorpay_orders').insert({
    user_id: user.id,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    status: 'created',
    plan_id: planId,
    plan_name: planName,
    user_email: billingEmail,
    user_name: billingName,
    created_at: new Date().toISOString(),
  });

  return jsonResponse({
    success: true,
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    key: keyId,
  });
}

/**
 * POST /verify-org-payment - Verify organization payment and create subscription
 */
export async function handleVerifyOrgPayment(request: Request, env: Env, _supabase: SupabaseClient, user: any): Promise<Response> {
  const supabaseAdmin = createSupabaseAdmin(env);
  const { keyId, keySecret, isProduction } = getRazorpayCredentialsForRequest(request, env);
  
  console.log(`[VERIFY-ORG-PAYMENT] Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

  const body = await request.json() as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    purchaseData?: any;
  };

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, purchaseData } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !purchaseData) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Verify signature
  const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
  if (!isValid) {
    console.error('[VERIFY-ORG-PAYMENT] Invalid signature');
    return jsonResponse({ error: 'Invalid payment signature' }, 400);
  }

  // Get order
  const { data: order, error: orderError } = await supabaseAdmin
    .from('razorpay_orders')
    .select('*')
    .eq('order_id', razorpay_order_id)
    .single();

  if (orderError || !order) {
    return jsonResponse({ error: 'Order not found' }, 404);
  }

  // Verify payment with Razorpay
  const razorpayAuth = btoa(`${keyId}:${keySecret}`);
  const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
    headers: { 'Authorization': `Basic ${razorpayAuth}` },
  });

  if (!paymentResponse.ok) {
    return jsonResponse({ error: 'Failed to verify payment' }, 500);
  }

  const paymentDetails = await paymentResponse.json() as any;

  if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
    return jsonResponse({ error: 'Payment not completed' }, 400);
  }

  // Update order status
  await supabaseAdmin
    .from('razorpay_orders')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('order_id', razorpay_order_id);

  // Lookup plan UUID
  let subscriptionPlanId = purchaseData.planId;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(purchaseData.planId)) {
    const { data: planData } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('plan_code', purchaseData.planId)
      .eq('is_active', true)
      .single();

    if (planData) {
      subscriptionPlanId = planData.id;
    }
  }

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date(startDate);
  if (purchaseData.billingCycle === 'annual') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // Create organization subscription
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('organization_subscriptions')
    .insert({
      organization_id: purchaseData.organizationId,
      organization_type: purchaseData.organizationType,
      subscription_plan_id: subscriptionPlanId,
      purchased_by: user.id,
      total_seats: purchaseData.seatCount,
      assigned_seats: 0,
      target_member_type: purchaseData.targetMemberType,
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: purchaseData.autoRenew,
      price_per_seat: purchaseData.pricing.basePrice,
      total_amount: purchaseData.pricing.subtotal,
      discount_percentage: purchaseData.pricing.discountPercentage,
      final_amount: purchaseData.pricing.finalAmount,
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
    })
    .select()
    .single();

  if (subError) {
    console.error('[VERIFY-ORG-PAYMENT] Error creating subscription:', subError);
    return jsonResponse({ error: 'Failed to create subscription' }, 500);
  }

  // Create license pool if needed
  if (purchaseData.assignmentMode === 'create-pool' && purchaseData.poolName) {
    await supabaseAdmin
      .from('license_pools')
      .insert({
        organization_id: purchaseData.organizationId,
        organization_type: purchaseData.organizationType,
        organization_subscription_id: subscription.id,
        pool_name: purchaseData.poolName,
        member_type: purchaseData.targetMemberType === 'both' ? 'student' : purchaseData.targetMemberType,
        allocated_seats: purchaseData.seatCount,
        assigned_seats: 0,
        auto_assign_new_members: purchaseData.autoAssignNewMembers,
        is_active: true,
        created_by: user.id,
      });
  }

  // Log transaction
  await supabaseAdmin
    .from('payment_transactions')
    .insert({
      user_id: user.id,
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      amount: order.amount,
      currency: order.currency,
      status: 'success',
      payment_method: paymentDetails.method || 'unknown',
      transaction_type: 'organization_subscription',
      metadata: {
        organization_id: purchaseData.organizationId,
        organization_type: purchaseData.organizationType,
        seat_count: purchaseData.seatCount,
        subscription_id: subscription.id,
      },
    });

  return jsonResponse({
    success: true,
    subscription,
    message: 'Organization subscription created successfully',
  });
}
