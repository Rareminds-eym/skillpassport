/**
 * Payments API Cloudflare Worker
 * Complete subscription and payment management backend
 * 
 * PAYMENT ENDPOINTS:
 * - POST /create-order         - Create Razorpay order for subscription
 * - POST /create-event-order   - Create Razorpay order for events
 * - POST /verify-payment       - Verify payment + create subscription + log transaction
 * - POST /webhook              - Handle Razorpay webhooks
 * 
 * SUBSCRIPTION ENDPOINTS:
 * - GET  /get-subscription     - Get user's active subscription
 * - POST /cancel-subscription  - Cancel Razorpay recurring subscription
 * - POST /deactivate-subscription - Deactivate/cancel subscription in DB
 * - POST /pause-subscription   - Pause subscription (1-3 months)
 * - POST /resume-subscription  - Resume paused subscription
 * 
 * ADMIN/CRON ENDPOINTS:
 * - POST /expire-subscriptions - Auto-expire old subscriptions (cron)
 * - GET  /health               - Health check with config status
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Env {
  // Supabase - support both naming conventions
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // Legacy VITE_ prefixed names (fallback)
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  // Razorpay
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  // Test mode credentials (optional)
  TEST_RAZORPAY_KEY_ID?: string;
  TEST_RAZORPAY_KEY_SECRET?: string;
  // Legacy VITE_ prefixed names (fallback)
  VITE_RAZORPAY_KEY_ID?: string;
  // Note: Email sending now uses Supabase Edge Function (send-email) with SMTP
  // RESEND_API_KEY is no longer needed
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Valid plan amounts in paise
const VALID_AMOUNTS = [100, 49900, 99900, 199900];
const MAX_AMOUNT = 1000000;

// URL validation helper
function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Helper to get Supabase URL with fallback and validation
function getSupabaseUrl(env: Env): string {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL is not configured. Set it as a Cloudflare secret via: wrangler secret put SUPABASE_URL');
  }
  if (!isValidHttpUrl(url)) {
    throw new Error(`Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL. Got: "${url.substring(0, 50)}...". Ensure SUPABASE_URL is set correctly as a Cloudflare secret.`);
  }
  return url;
}

// Helper to get Supabase Anon Key with fallback
function getSupabaseAnonKey(env: Env): string {
  const key = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('SUPABASE_ANON_KEY is not configured. Set it as a Cloudflare secret via: wrangler secret put SUPABASE_ANON_KEY');
  }
  return key;
}

// Helper to get Razorpay Key ID with fallback
function getRazorpayKeyId(env: Env): string {
  const key = env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error('RAZORPAY_KEY_ID is not configured. Set it as a Cloudflare secret via: wrangler secret put RAZORPAY_KEY_ID');
  }
  return key;
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

function getRazorpayCredentials(env: Env) {
  // Use test credentials if available, otherwise use production
  const keyId = env.TEST_RAZORPAY_KEY_ID || getRazorpayKeyId(env);
  const keySecret = env.TEST_RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }
  return { keyId, keySecret };
}

async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
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

async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return generatedSignature === signature;
}

// ==================== EMAIL FUNCTIONS ====================

/**
 * Send email via Supabase Edge Function (SMTP)
 * This replaces the old Resend API implementation
 */
async function sendEmailViaSupabase(
  env: Env,
  to: string,
  subject: string,
  html: string,
  from?: string,
  fromName?: string
): Promise<boolean> {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('Supabase configuration missing for email sending');
    return false;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        from,
        fromName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email sending failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send email via Supabase:', error);
    return false;
  }
}

/**
 * Send payment confirmation email using Supabase Edge Function (SMTP)
 */
async function sendPaymentConfirmationEmail(
  env: Env,
  email: string,
  name: string,
  paymentDetails: {
    paymentId: string;
    orderId: string;
    amount: number;
    planName: string;
    billingCycle: string;
    subscriptionEndDate: string;
  }
): Promise<boolean> {
  const { paymentId, orderId, amount, planName, billingCycle, subscriptionEndDate } = paymentDetails;
  
  const formatAmount = (a: number) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    minimumFractionDigits: 0 
  }).format(a);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Payment Confirmation</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <div style="width: 60px; height: 60px; background: white; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Payment Successful!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hi <strong>${name}</strong>,</p>
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Thank you for your payment! Your subscription has been activated successfully.</p>
              
              <!-- Payment Details Card -->
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1F2937; font-size: 18px;">💳 Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Amount Paid</td>
                    <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${formatAmount(amount)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Payment ID</td>
                    <td style="padding: 8px 0; color: #1F2937; font-family: monospace; text-align: right;">${paymentId.slice(-12)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Order ID</td>
                    <td style="padding: 8px 0; color: #1F2937; font-family: monospace; text-align: right;">${orderId.slice(-12)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Subscription Details Card -->
              <div style="background-color: #EFF6FF; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #3B82F6;">
                <h3 style="margin: 0 0 16px; color: #1F2937; font-size: 18px;">✨ Subscription Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Plan</td>
                    <td style="padding: 8px 0; color: #3B82F6; font-weight: 600; text-align: right;">${planName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Billing Cycle</td>
                    <td style="padding: 8px 0; color: #1F2937; text-align: right;">${billingCycle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Valid Until</td>
                    <td style="padding: 8px 0; color: #1F2937; text-align: right;">${formatDate(subscriptionEndDate)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://skillpassport.rareminds.in/subscription/manage" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Manage Subscription →</a>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">If you have any questions, feel free to contact our support team.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const success = await sendEmailViaSupabase(
    env,
    email,
    `Payment Confirmed - ${planName} Subscription Activated!`,
    htmlContent,
    'payments@rareminds.in',
    'Skill Passport'
  );

  if (success) {
    console.log(`Payment confirmation email sent to ${email}`);
  }
  
  return success;
}


// ==================== CREATE ORDER ====================

async function handleCreateOrder(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;
  const { keyId, keySecret } = getRazorpayCredentials(env);

  const body = await request.json() as {
    amount?: number;
    currency?: string;
    planId?: string;
    planName?: string;
    userEmail?: string;
    userName?: string;
  };

  const { amount, currency, planId, planName, userEmail, userName } = body;

  // Validate required fields
  if (!amount || !currency || !userEmail || !planId || !planName) {
    return jsonResponse({ error: 'Missing required fields: amount, currency, userEmail, planId, planName' }, 400);
  }

  // Validate amount
  if (amount <= 0 || amount > MAX_AMOUNT) {
    return jsonResponse({ error: 'Invalid amount' }, 400);
  }

  // Allow valid plan amounts or any amount for custom plans
  // VALID_AMOUNTS check is optional for flexibility
  // if (!VALID_AMOUNTS.includes(amount)) {
  //   return jsonResponse({ error: 'Invalid plan amount' }, 400);
  // }

  if (currency !== 'INR') {
    return jsonResponse({ error: 'Only INR currency is supported' }, 400);
  }

  // Rate limiting check
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabase
    .from('razorpay_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo);

  if (count && count >= 5) {
    return jsonResponse({ error: 'Too many order attempts. Please wait a minute.' }, 429);
  }

  // Create Razorpay order
  const receipt = `rcpt_${Date.now()}_${user.id.substring(0, 8)}`;
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
        plan_id: planId,
        plan_name: planName,
        user_email: userEmail,
        user_name: userName,
      },
    }),
  });

  if (!razorpayResponse.ok) {
    console.error('Razorpay API Error:', await razorpayResponse.text());
    return jsonResponse({ error: 'Unable to create payment order' }, 500);
  }

  const order = await razorpayResponse.json() as any;

  // Save order to database
  const { error: dbError } = await supabase.from('razorpay_orders').insert({
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

  if (dbError) {
    console.error('Failed to save order:', dbError);
    return jsonResponse({ error: 'Order created but failed to save' }, 500);
  }

  return jsonResponse({
    success: true,
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
  });
}

// ==================== VERIFY PAYMENT ====================

// Helper to calculate subscription end date
function calculateSubscriptionEndDate(billingCycle: string): string {
  const now = new Date();
  if (billingCycle.toLowerCase().includes('year')) {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    // Default to 1 month
    now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString();
}

async function handleVerifyPayment(request: Request, env: Env): Promise<Response> {
  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
  const { keyId, keySecret } = getRazorpayCredentials(env);

  const body = await request.json() as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    // Optional: plan details for subscription creation
    plan?: {
      name?: string;
      price?: number;
      duration?: string;
    };
  };

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Check idempotency - if subscription already exists for this payment
  const { data: existingSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('razorpay_payment_id', razorpay_payment_id)
    .maybeSingle();

  if (existingSubscription) {
    // Fetch transaction details for complete response
    const { data: transaction } = await supabaseAdmin
      .from('payment_transactions')
      .select('payment_method, amount')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();

    return jsonResponse({
      success: true,
      verified: true,
      message: 'Payment already verified and subscription exists',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      user_id: existingSubscription.user_id,
      user_name: existingSubscription.full_name,
      user_email: existingSubscription.email,
      payment_method: transaction?.payment_method || 'Card',
      amount: (transaction?.amount || existingSubscription.plan_amount || 0) * 100, // Convert to paise for consistency
      subscription: existingSubscription,
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

  // Verify signature
  const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
  if (!isValid) {
    return jsonResponse({ error: 'Invalid payment signature' }, 400);
  }

  // Fetch payment details from Razorpay
  let paymentMethod = 'unknown';
  let paymentAmount = order.amount;

  try {
    const razorpayAuth = btoa(`${keyId}:${keySecret}`);
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { 'Authorization': `Basic ${razorpayAuth}` },
    });

    if (paymentResponse.ok) {
      const paymentDetails = await paymentResponse.json() as any;
      paymentMethod = paymentDetails.method || 'unknown';
      paymentAmount = paymentDetails.amount || order.amount;

      if (paymentAmount !== order.amount) {
        return jsonResponse({ error: 'Payment amount mismatch' }, 400);
      }

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
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('order_id', razorpay_order_id);

  // Get user details for subscription
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('firstName, lastName, email, phone')
    .eq('id', order.user_id)
    .maybeSingle();

  const fullName = userData 
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() 
    : order.user_name || 'User';
  const userEmail = userData?.email || order.user_email || '';
  const userPhone = userData?.phone || null;

  // Determine billing cycle from plan or order notes
  const billingCycle = plan?.duration || order.plan_name?.toLowerCase().includes('year') ? 'year' : 'month';
  const planAmount = (plan?.price || paymentAmount / 100); // Convert paise to rupees if needed
  const planType = plan?.name || order.plan_name || 'Standard Plan';

  // Check if user already has an active subscription of the same plan type
  // This prevents the database trigger from blocking duplicate subscriptions
  const { data: existingActiveSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', order.user_id)
    .eq('plan_type', planType)
    .eq('status', 'active')
    .maybeSingle();

  if (existingActiveSubscription) {
    // User already has active subscription of this plan type
    // Return existing subscription instead of trying to create a new one
    const { data: existingTransaction } = await supabaseAdmin
      .from('payment_transactions')
      .select('payment_method, amount')
      .eq('subscription_id', existingActiveSubscription.id)
      .maybeSingle();

    return jsonResponse({
      success: true,
      verified: true,
      message: 'User already has an active subscription of this plan type',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      user_id: existingActiveSubscription.user_id,
      user_name: existingActiveSubscription.full_name,
      user_email: existingActiveSubscription.email,
      payment_method: existingTransaction?.payment_method || paymentMethod,
      amount: paymentAmount,
      subscription: existingActiveSubscription,
      already_processed: true,
    });
  }

  // CREATE SUBSCRIPTION RECORD
  const now = new Date().toISOString();
  const subscriptionData = {
    user_id: order.user_id,
    full_name: fullName,
    email: userEmail,
    phone: userPhone,
    plan_type: planType,
    plan_amount: planAmount,
    billing_cycle: billingCycle,
    razorpay_payment_id: razorpay_payment_id,
    razorpay_order_id: razorpay_order_id,
    status: 'active' as const,
    subscription_start_date: now,
    subscription_end_date: calculateSubscriptionEndDate(billingCycle),
    auto_renew: false,
    created_at: now,
    updated_at: now,
  };

  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .insert([subscriptionData])
    .select()
    .single();

  if (subError) {
    console.error('Error creating subscription:', subError);
    // Don't fail the verification, but log the error
    return jsonResponse({
      success: true,
      verified: true,
      message: 'Payment verified but subscription creation failed',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      user_id: order.user_id,
      user_name: fullName,
      user_email: userEmail,
      payment_method: paymentMethod,
      amount: paymentAmount,
      subscription_error: subError.message,
    });
  }

  // LOG PAYMENT TRANSACTION
  const transactionData = {
    subscription_id: subscription.id,
    user_id: order.user_id,
    razorpay_payment_id: razorpay_payment_id,
    razorpay_order_id: razorpay_order_id,
    amount: planAmount,
    currency: 'INR',
    status: 'success',
    payment_method: paymentMethod,
    created_at: now,
  };

  const { error: txnError } = await supabaseAdmin
    .from('payment_transactions')
    .insert([transactionData]);

  if (txnError) {
    console.error('Error logging transaction:', txnError);
    // Don't fail, subscription is already created
  }

  // Send payment confirmation email
  await sendPaymentConfirmationEmail(env, userEmail, fullName, {
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    amount: planAmount,
    planName: planType,
    billingCycle: billingCycle,
    subscriptionEndDate: subscription.subscription_end_date,
  });

  return jsonResponse({
    success: true,
    verified: true,
    message: 'Payment verified and subscription activated',
    payment_id: razorpay_payment_id,
    order_id: razorpay_order_id,
    user_id: order.user_id,
    user_name: fullName,
    user_email: userEmail,
    payment_method: paymentMethod,
    amount: paymentAmount,
    subscription: subscription,
  });
}


// ==================== WEBHOOK ====================

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) {
    return jsonResponse({ error: 'Missing signature' }, 400);
  }

  const rawBody = await request.text();
  
  // Only verify signature if webhook secret is configured
  if (env.RAZORPAY_WEBHOOK_SECRET) {
    const isValid = await verifyWebhookSignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET);
    if (!isValid) {
      return jsonResponse({ error: 'Invalid signature' }, 400);
    }
  }

  const webhookData = JSON.parse(rawBody);
  const event = webhookData.event;
  const payload = webhookData.payload;

  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

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

    case 'subscription.paused':
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;

    case 'subscription.resumed':
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          paused_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;

    case 'subscription.charged':
      const payment = payload.payment.entity;
      await supabaseAdmin.from('payment_transactions').insert({
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: 'success',
        payment_method: payment.method,
        created_at: new Date().toISOString(),
      });
      break;
  }

  return jsonResponse({ success: true, event });
}

// ==================== CANCEL SUBSCRIPTION ====================

async function handleCancelSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;
  const { keyId, keySecret } = getRazorpayCredentials(env);

  const body = await request.json() as { subscription_id?: string; cancel_at_cycle_end?: boolean };
  const { subscription_id, cancel_at_cycle_end = false } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'Missing subscription_id' }, 400);
  }

  const razorpayAuth = btoa(`${keyId}:${keySecret}`);
  const razorpayResponse = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${subscription_id}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancel_at_cycle_end }),
    }
  );

  if (!razorpayResponse.ok) {
    if (razorpayResponse.status === 404) {
      return jsonResponse({
        success: true,
        message: 'Subscription already cancelled or not found',
        subscription_id,
        status: 'cancelled',
      });
    }
    return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
  }

  const cancelledSubscription = await razorpayResponse.json() as any;

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renew: false,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription_id)
    .eq('user_id', user.id);

  return jsonResponse({
    success: true,
    message: 'Subscription cancelled successfully',
    subscription_id,
    status: cancelledSubscription.status,
  });
}

// ==================== DEACTIVATE SUBSCRIPTION ====================

async function handleDeactivateSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  const body = await request.json() as {
    subscription_id?: string;
    cancellation_reason?: string;
  };
  const { subscription_id, cancellation_reason = 'other' } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'subscription_id is required' }, 400);
  }

  // Verify subscription exists and belongs to user
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, user_id, status, subscription_end_date, cancelled_at')
    .eq('id', subscription_id)
    .maybeSingle();

  if (fetchError || !subscription) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  if (subscription.user_id !== user.id) {
    return jsonResponse({ error: 'Permission denied' }, 403);
  }

  if (subscription.status === 'cancelled') {
    return jsonResponse({
      success: true,
      message: 'Subscription is already cancelled',
      subscription: {
        id: subscription.id,
        status: 'cancelled',
        cancelled_at: subscription.cancelled_at,
        access_until: subscription.subscription_end_date,
      },
      already_cancelled: true,
    });
  }

  if (!['active', 'paused'].includes(subscription.status)) {
    return jsonResponse({ error: `Cannot cancel subscription with status '${subscription.status}'` }, 400);
  }

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      auto_renew: false,
      cancelled_at: now,
      cancellation_reason,
      updated_at: now,
    })
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
  }

  // Log cancellation for analytics
  await supabase
    .from('subscription_cancellations')
    .insert([{
      subscription_id,
      user_id: user.id,
      cancellation_reason,
      cancelled_at: now,
      access_until: subscription.subscription_end_date,
    }])
    .select()
    .maybeSingle();

  return jsonResponse({
    success: true,
    message: 'Subscription cancelled successfully',
    subscription: updated,
  });
}

// ==================== PAUSE SUBSCRIPTION ====================

async function handlePauseSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  const body = await request.json() as {
    subscription_id?: string;
    pause_months?: number;
  };
  const { subscription_id, pause_months = 1 } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'subscription_id is required' }, 400);
  }

  // Validate pause duration (1-3 months)
  if (pause_months < 1 || pause_months > 3) {
    return jsonResponse({ error: 'Pause duration must be between 1 and 3 months' }, 400);
  }

  // Verify subscription exists and belongs to user
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .maybeSingle();

  if (fetchError || !subscription) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  if (subscription.user_id !== user.id) {
    return jsonResponse({ error: 'Permission denied' }, 403);
  }

  if (subscription.status === 'paused') {
    return jsonResponse({
      success: true,
      message: 'Subscription is already paused',
      subscription,
      already_paused: true,
    });
  }

  if (subscription.status !== 'active') {
    return jsonResponse({ error: `Cannot pause subscription with status '${subscription.status}'` }, 400);
  }

  const now = new Date();
  const pausedUntil = new Date(now);
  pausedUntil.setMonth(pausedUntil.getMonth() + pause_months);

  // Extend subscription end date by pause duration
  const currentEndDate = new Date(subscription.subscription_end_date);
  currentEndDate.setMonth(currentEndDate.getMonth() + pause_months);

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'paused',
      paused_at: now.toISOString(),
      paused_until: pausedUntil.toISOString(),
      subscription_end_date: currentEndDate.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return jsonResponse({ error: 'Failed to pause subscription' }, 500);
  }

  return jsonResponse({
    success: true,
    message: `Subscription paused for ${pause_months} month(s)`,
    subscription: updated,
    paused_until: pausedUntil.toISOString(),
  });
}

// ==================== RESUME SUBSCRIPTION ====================

async function handleResumeSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  const body = await request.json() as {
    subscription_id?: string;
  };
  const { subscription_id } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'subscription_id is required' }, 400);
  }

  // Verify subscription exists and belongs to user
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .maybeSingle();

  if (fetchError || !subscription) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  if (subscription.user_id !== user.id) {
    return jsonResponse({ error: 'Permission denied' }, 403);
  }

  if (subscription.status === 'active') {
    return jsonResponse({
      success: true,
      message: 'Subscription is already active',
      subscription,
      already_active: true,
    });
  }

  if (subscription.status !== 'paused') {
    return jsonResponse({ error: `Cannot resume subscription with status '${subscription.status}'` }, 400);
  }

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      paused_at: null,
      paused_until: null,
      updated_at: now,
    })
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return jsonResponse({ error: 'Failed to resume subscription' }, 500);
  }

  return jsonResponse({
    success: true,
    message: 'Subscription resumed successfully',
    subscription: updated,
  });
}

// ==================== GET SUBSCRIPTION ====================

async function handleGetSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  // Get active or paused subscription
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: 'Failed to fetch subscription' }, 500);
  }

  if (!subscription) {
    // Try to get most recent subscription (even if cancelled/expired)
    const { data: recentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return jsonResponse({
      success: true,
      has_active_subscription: false,
      subscription: recentSub || null,
    });
  }

  return jsonResponse({
    success: true,
    has_active_subscription: true,
    subscription,
  });
}

// ==================== CREATE EVENT ORDER ====================

const MAX_EVENT_AMOUNT_RUPEES = 10000000; // ₹1 crore max
const TEST_MODE_MAX_AMOUNT = 5000000; // ₹50,000 in paise for test mode

async function handleCreateEventOrder(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    amount?: number;
    currency?: string;
    registrationId?: string;
    planName?: string;
    userEmail?: string;
    userName?: string;
    origin?: string;
  };

  const { amount: originalAmount, currency, registrationId, planName, userEmail, userName, origin: bodyOrigin } = body;

  // Validate required fields
  if (!originalAmount || !currency || !registrationId || !userEmail) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  if (originalAmount <= 0) {
    return jsonResponse({ error: 'Amount must be positive' }, 400);
  }

  const amountInRupees = originalAmount / 100;
  if (amountInRupees > MAX_EVENT_AMOUNT_RUPEES) {
    return jsonResponse({ error: `Amount exceeds maximum limit of ₹${MAX_EVENT_AMOUNT_RUPEES.toLocaleString()}` }, 400);
  }

  if (currency !== 'INR') {
    return jsonResponse({ error: 'Only INR currency is supported' }, 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    return jsonResponse({ error: 'Invalid email format' }, 400);
  }

  // Detect if request is from production site
  const headerOrigin = request.headers.get('origin') || request.headers.get('referer') || '';
  const requestOrigin = bodyOrigin || headerOrigin;
  const isProductionSite = requestOrigin.includes('skillpassport.rareminds.in') && !requestOrigin.includes('dev-');

  // Determine credentials and amount based on site
  let keyId: string;
  let keySecret: string;
  let amount = originalAmount;

  if (isProductionSite) {
    keyId = getRazorpayKeyId(env);
    keySecret = env.RAZORPAY_KEY_SECRET;
  } else {
    keyId = env.TEST_RAZORPAY_KEY_ID || getRazorpayKeyId(env);
    keySecret = env.TEST_RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET;
    // Cap amount at test limit for non-production sites
    if (amount > TEST_MODE_MAX_AMOUNT) {
      console.log(`TEST MODE: Capping amount from ₹${amount / 100} to ₹${TEST_MODE_MAX_AMOUNT / 100}`);
      amount = TEST_MODE_MAX_AMOUNT;
    }
  }

  if (!keyId || !keySecret) {
    return jsonResponse({ error: 'Payment service not configured' }, 500);
  }

  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

  // Verify registration exists
  const { data: registration, error: regError } = await supabaseAdmin
    .from('event_registrations')
    .select('id, payment_status')
    .eq('id', registrationId)
    .maybeSingle();

  if (regError || !registration) {
    return jsonResponse({ error: 'Registration not found' }, 404);
  }

  // Create Razorpay order
  const receipt = `event_${Date.now()}_${registrationId.substring(0, 8)}`;
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
        registration_id: registrationId,
        plan_name: planName,
        user_email: userEmail,
        user_name: userName,
      },
    }),
  });

  if (!razorpayResponse.ok) {
    const errorData = await razorpayResponse.text();
    console.error('Razorpay API Error:', razorpayResponse.status, errorData);
    
    let errorMessage = 'Unable to create payment order. Please try again.';
    try {
      const parsedError = JSON.parse(errorData);
      if (parsedError.error?.description) {
        errorMessage = parsedError.error.description;
      }
    } catch {}
    
    return jsonResponse({ error: errorMessage }, 500);
  }

  const order = await razorpayResponse.json() as any;
  console.log(`Event order created: ${order.id} for registration: ${registrationId}`);

  // Update registration with order ID
  await supabaseAdmin
    .from('event_registrations')
    .update({ razorpay_order_id: order.id })
    .eq('id', registrationId);

  return jsonResponse({
    success: true,
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    key: keyId,
  });
}

// ==================== EXPIRE SUBSCRIPTIONS ====================

async function handleExpireSubscriptions(env: Env): Promise<Response> {
  const supabaseUrl = getSupabaseUrl(env);
  const supabaseAdmin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);

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

// ==================== MAIN HANDLER ====================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        // Payment endpoints
        case '/create-order':
          return await handleCreateOrder(request, env);
        case '/create-event-order':
          return await handleCreateEventOrder(request, env);
        case '/verify-payment':
          return await handleVerifyPayment(request, env);
        case '/webhook':
          return await handleWebhook(request, env);
        
        // Subscription management endpoints
        case '/get-subscription':
          return await handleGetSubscription(request, env);
        case '/cancel-subscription':
          return await handleCancelSubscription(request, env);
        case '/deactivate-subscription':
          return await handleDeactivateSubscription(request, env);
        case '/pause-subscription':
          return await handlePauseSubscription(request, env);
        case '/resume-subscription':
          return await handleResumeSubscription(request, env);
        
        // Cron/Admin endpoints
        case '/expire-subscriptions':
          return await handleExpireSubscriptions(env);
        
        // Health check
        case '/health':
          const configStatus = {
            supabase_url: !!(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
            supabase_anon_key: !!(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
            supabase_service_role_key: !!env.SUPABASE_SERVICE_ROLE_KEY,
            razorpay_key_id: !!(env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID),
            razorpay_key_secret: !!env.RAZORPAY_KEY_SECRET,
          };
          const allConfigured = Object.values(configStatus).every(Boolean);
          return jsonResponse({ 
            status: allConfigured ? 'ok' : 'misconfigured',
            timestamp: new Date().toISOString(),
            config: configStatus,
            endpoints: [
              'POST /create-order',
              'POST /create-event-order', 
              'POST /verify-payment',
              'POST /webhook',
              'GET  /get-subscription',
              'POST /cancel-subscription',
              'POST /deactivate-subscription',
              'POST /pause-subscription',
              'POST /resume-subscription',
              'POST /expire-subscriptions',
              'GET  /health',
            ],
            message: allConfigured ? 'All required secrets are configured' : 'Some required secrets are missing.',
            email_note: 'Email sending uses Supabase Edge Function (send-email) with SMTP. Configure SMTP secrets in Supabase.',
          });
        
        default:
          return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: (error as Error).message || 'Internal server error' }, 500);
    }
  },
};
