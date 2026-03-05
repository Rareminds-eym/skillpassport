/**
 * Payment handlers - orders, verification, webhooks
 */

import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Env, CreateOrderBody, VerifyPaymentBody } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { authenticateUser } from '../utils/auth';
import { createSupabaseAdmin, getSupabaseUrl } from '../utils/supabase';
import { verifyWebhookSignature } from '../utils/razorpay';
import { MAX_AMOUNT, PLAN_DURATIONS } from '../config';
import { sendPaymentConfirmationEmail } from '../services/email';
import { generateReceiptPdfBase64 } from '../services/receipt';
import { uploadReceiptToR2, getReceiptDownloadUrl } from '../services/storage';

/**
 * POST /create-order - Create Razorpay order via shared worker
 */
export async function handleCreateOrder(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  const body = await request.json() as CreateOrderBody;
  const { amount, currency, planId, planName, userEmail, userName, isUpgrade } = body;

  if (!amount || !currency || !userEmail || !planId || !planName) {
    return jsonResponse({ error: 'Missing required fields: amount, currency, userEmail, planId, planName' }, 400);
  }

  if (amount <= 0 || amount > MAX_AMOUNT) {
    return jsonResponse({ error: 'Invalid amount' }, 400);
  }

  if (currency !== 'INR') {
    return jsonResponse({ error: 'Only INR currency is supported' }, 400);
  }

  const supabaseAdmin = createSupabaseAdmin(env);

  // Check for existing active subscription
  const { data: existingSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id, plan_type, status, subscription_end_date')
    .eq('user_id', user.id)
    .in('status', ['active', 'cancelled'])
    .gte('subscription_end_date', new Date().toISOString())
    .maybeSingle();

  if (existingSubscription && !isUpgrade) {
    const message = existingSubscription.status === 'cancelled'
      ? `You have a cancelled subscription that is still active until ${new Date(existingSubscription.subscription_end_date).toLocaleDateString()}`
      : 'You already have an active subscription';

    return jsonResponse({
      error: message,
      code: 'SUBSCRIPTION_EXISTS',
      existing_subscription: existingSubscription,
    }, 409);
  }

  // Rate limiting
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabase
    .from('razorpay_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo);

  if (count && count >= 5) {
    return jsonResponse({ error: 'Too many order attempts. Please wait a minute.' }, 429);
  }

  // Call shared Razorpay worker
  const receipt = `rcpt_${Date.now()}_${user.id.substring(0, 8)}`;
  
  try {
    const razorpayWorkerUrl = env.RAZORPAY_WORKER_URL || 'http://localhost:8787';
    const response = await fetch(`${razorpayWorkerUrl}/create-order`, {
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
          user_id: user.id,
          plan_id: planId,
          plan_name: planName,
          user_email: userEmail,
          user_name: userName,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Razorpay Worker Error:', errorData);
      return jsonResponse({ error: 'Unable to create payment order' }, 500);
    }

    const result = await response.json();
    const order = result.order;
    const keyId = result.key_id;

    // Save order to database
    await supabase.from('razorpay_orders').insert({
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

    return jsonResponse({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key: keyId,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return jsonResponse({ error: 'Failed to create order' }, 500);
  }
}

/**
 * Calculate subscription end date
 */
function calculateSubscriptionEndDate(billingCycle: string, fromDate?: Date): string {
  const baseDate = fromDate ? new Date(fromDate) : new Date();
  
  if (billingCycle === 'yearly' || billingCycle === 'annual') {
    baseDate.setFullYear(baseDate.getFullYear() + 1);
  } else {
    baseDate.setMonth(baseDate.getMonth() + 1);
  }
  
  return baseDate.toISOString();
}

/**
 * POST /verify-payment - Verify payment and create subscription
 */
export async function handleVerifyPayment(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = createSupabaseAdmin(env);
  const { keyId, keySecret, isProduction } = getRazorpayCredentialsForRequest(request, env);
  
  console.log(`[VERIFY-PAYMENT] Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

  const body = await request.json() as VerifyPaymentBody;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, planName, billingCycle, amount, userEmail, userName } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Check idempotency - if payment already processed, return existing subscription
  const { data: existingSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('razorpay_payment_id', razorpay_payment_id)
    .maybeSingle();

  if (existingSubscription) {
    console.log(`[VERIFY-PAYMENT] Payment already processed: ${razorpay_payment_id}`);
    
    // Get receipt URL if available
    const receiptUrl = existingSubscription.receipt_url;
    
    return jsonResponse({
      success: true,
      verified: true,
      message: 'Payment already verified',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      subscription: existingSubscription,
      receipt_url: receiptUrl,
      email_sent: false, // Email was sent in the original request
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

  // Verify signature via shared Razorpay worker
  try {
    const razorpayWorkerUrl = env.RAZORPAY_WORKER_URL || 'http://localhost:8787';
    const verifyResponse = await fetch(`${razorpayWorkerUrl}/verify-payment`, {
      method: 'POST',
      headers: {
        'X-API-Key': env.RAZORPAY_WORKER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }),
    });

    if (!verifyResponse.ok) {
      return jsonResponse({ error: 'Failed to verify payment' }, 500);
    }

    const verifyResult = await verifyResponse.json();
    
    if (!verifyResult.verified) {
      return jsonResponse({ error: 'Invalid payment signature' }, 400);
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    return jsonResponse({ error: 'Failed to verify payment' }, 500);
  }

  // Fetch payment details from Razorpay worker
  let paymentMethod = 'unknown';
  let paymentAmount = order.amount;

  try {
    const razorpayWorkerUrl = env.RAZORPAY_WORKER_URL || 'http://localhost:8787';
    const paymentResponse = await fetch(`${razorpayWorkerUrl}/payment/${razorpay_payment_id}`, {
      headers: { 'X-API-Key': env.RAZORPAY_WORKER_API_KEY },
    });

    if (paymentResponse.ok) {
      const result = await paymentResponse.json();
      const paymentDetails = result.payment;
      paymentMethod = paymentDetails.method || 'unknown';
      paymentAmount = paymentDetails.amount || order.amount;

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
    .update({ 
      status: 'paid', 
      razorpay_payment_id,
      updated_at: new Date().toISOString() 
    })
    .eq('order_id', razorpay_order_id);

  // Get user details
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('firstName, lastName, email, phone')
    .eq('id', order.user_id)
    .maybeSingle();

  const fullName = userData
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
    : userName || 'User';
  const userEmailFinal = userData?.email || userEmail || '';

  const planAmount = amount || paymentAmount / 100;
  const planType = planName || order.plan_name || 'Standard Plan';
  const cycle = billingCycle || 'yearly';
  const now = new Date();

  // Check for existing active subscription with same plan type
  const { data: existingActiveSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id, plan_type, status, subscription_end_date')
    .eq('user_id', order.user_id)
    .eq('plan_type', planType)
    .in('status', ['active', 'cancelled'])
    .gte('subscription_end_date', now.toISOString())
    .maybeSingle();

  if (existingActiveSub) {
    // Cancel the existing subscription before creating new one
    console.log(`[VERIFY-PAYMENT] Cancelling existing ${planType} subscription for user ${order.user_id}`);
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', existingActiveSub.id);
  }

  // Create subscription
  const subscriptionEndDate = calculateSubscriptionEndDate(cycle, now);

  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .insert([{
      user_id: order.user_id,
      full_name: fullName,
      email: userEmailFinal,
      phone: userData?.phone || null,
      plan_id: planId,
      plan_type: planType,
      plan_amount: planAmount,
      billing_cycle: cycle,
      razorpay_payment_id,
      razorpay_order_id,
      status: 'active',
      subscription_start_date: now.toISOString(),
      subscription_end_date: subscriptionEndDate,
      auto_renew: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }])
    .select()
    .single();

  if (subError) {
    console.error('Error creating subscription:', subError);
    
    // Check if it's a duplicate key error (user already has this plan type)
    if (subError.code === '23505') {
      // Race condition - another request just created the subscription
      // Check if subscription exists for this payment_id
      const { data: justCreatedSub } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('razorpay_payment_id', razorpay_payment_id)
        .maybeSingle();
      
      if (justCreatedSub) {
        console.log(`[VERIFY-PAYMENT] Subscription already created by parallel request: ${razorpay_payment_id}`);
        
        // Get receipt URL if available
        const receiptUrl = justCreatedSub.receipt_url;
        
        return jsonResponse({
          success: true,
          verified: true,
          message: 'Payment verified and subscription activated',
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          subscription: justCreatedSub,
          receipt_url: receiptUrl,
          email_sent: false, // Email was sent in the original request
          already_processed: true,
        });
      }
      
      return jsonResponse({ 
        error: 'User already has an active subscription of this type',
        code: 'DUPLICATE_SUBSCRIPTION',
        hint: 'Please cancel the existing subscription first or contact support',
        details: subError.message
      }, 409);
    }
    
    return jsonResponse({ 
      error: 'Failed to create subscription',
      details: subError.message 
    }, 500);
  }

  // Log transaction
  await supabaseAdmin
    .from('payment_transactions')
    .insert([{
      subscription_id: subscription.id,
      user_id: order.user_id,
      razorpay_payment_id,
      razorpay_order_id,
      amount: planAmount,
      currency: 'INR',
      status: 'success',
      payment_method: paymentMethod,
      created_at: now.toISOString(),
    }]);

  // Generate and upload receipt
  let receiptUrl: string | undefined;
  try {
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const receiptPdfBase64 = await generateReceiptPdfBase64({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: planAmount,
      planName: planType,
      billingCycle: cycle,
      subscriptionEndDate: formatDate(subscription.subscription_end_date),
      userName: fullName,
      userEmail: userEmailFinal,
      paymentMethod,
      paymentDate: formatDate(now.toISOString()),
    });

    const filename = `Receipt-${razorpay_payment_id.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Get auth token from request to pass to storage API
    const authHeader = request.headers.get('Authorization');
    const authToken = authHeader?.replace('Bearer ', '');
    
    const uploadResult = await uploadReceiptToR2(env, receiptPdfBase64, razorpay_payment_id, order.user_id, filename, fullName, authToken);

    if (uploadResult.success && uploadResult.fileKey) {
      receiptUrl = getReceiptDownloadUrl(env, uploadResult.fileKey);
      await supabaseAdmin
        .from('subscriptions')
        .update({ receipt_url: receiptUrl })
        .eq('id', subscription.id);
    }
  } catch (error) {
    console.error('Receipt generation failed:', error);
  }

  // Send confirmation email
  const emailSent = await sendPaymentConfirmationEmail(env, userEmailFinal, fullName, {
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    amount: planAmount,
    planName: planType,
    billingCycle: cycle,
    subscriptionEndDate: subscription.subscription_end_date,
    receiptUrl,
  });

  return jsonResponse({
    success: true,
    verified: true,
    message: 'Payment verified and subscription activated',
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    subscription,
    email_sent: emailSent,
    receipt_url: receiptUrl,
  });
}

/**
 * POST /webhook - Handle Razorpay webhooks
 */
export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) {
    return jsonResponse({ error: 'Missing signature' }, 400);
  }

  const rawBody = await request.text();

  // Verify webhook signature via Razorpay worker
  if (env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_WORKER_URL) {
    try {
      const razorpayWorkerUrl = env.RAZORPAY_WORKER_URL || 'http://localhost:8787';
      const verifyResponse = await fetch(`${razorpayWorkerUrl}/verify-webhook`, {
        method: 'POST',
        headers: {
          'X-API-Key': env.RAZORPAY_WORKER_API_KEY,
          'x-razorpay-signature': signature,
        },
        body: rawBody,
      });

      if (verifyResponse.ok) {
        const result = await verifyResponse.json();
        if (!result.verified) {
          return jsonResponse({ error: 'Invalid signature' }, 400);
        }
      }
    } catch (error) {
      console.error('Webhook verification error:', error);
      return jsonResponse({ error: 'Failed to verify webhook' }, 500);
    }
  }

  const webhookData = JSON.parse(rawBody);
  const event = webhookData.event;
  const payload = webhookData.payload;

  const supabaseAdmin = createSupabaseAdmin(env);

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
  }

  return jsonResponse({ success: true, event });
}
