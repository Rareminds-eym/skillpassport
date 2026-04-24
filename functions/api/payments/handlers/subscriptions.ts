/**
 * Subscription handlers
 * Matches old payments-api request/response shapes exactly so frontend needs no changes.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser } from '../../shared/auth';
import type { PaymentsEnv } from '../types';
import { sendEmail } from '../../email/services/mailer';

function adminClient(env: PaymentsEnv) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL!;
  return createClient(url, env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Mint short-lived HS256 service JWT */
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

function calcEndDate(billingCycle: string, from = new Date()): Date {
  const d = new Date(from);
  if (billingCycle === 'yearly' || billingCycle === 'annual') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

// ── POST /create-order ────────────────────────────────────────────────────────

export async function handleCreateOrder(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const { user } = auth;
  const supabase = adminClient(env);

  const body = await req.json() as {
    amount?: number;
    currency?: string;
    planId?: string;
    planName?: string;
    userEmail?: string;
    userName?: string;
    isUpgrade?: boolean;
  };
  const { amount, currency, planId, planName, userEmail, userName, isUpgrade = false } = body;

  // Matches old worker validation exactly
  if (!amount || !currency || !userEmail || !planId || !planName) {
    return jsonResponse({ error: 'Missing required fields: amount, currency, userEmail, planId, planName' }, 400);
  }
  if (amount <= 0 || amount > 10_000_000) return jsonResponse({ error: 'Invalid amount' }, 400);
  if (currency !== 'INR') return jsonResponse({ error: 'Only INR currency is supported' }, 400);

  // Block if active subscription exists (unless upgrade) — matches old worker response shape
  if (!isUpgrade) {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id, plan_type, status, subscription_end_date')
      .eq('user_id', user.id)
      .in('status', ['active', 'cancelled'])
      .gte('subscription_end_date', new Date().toISOString())
      .maybeSingle();

    if (existing) {
      const message = existing.status === 'cancelled'
        ? 'You have a cancelled subscription that is still active until ' + new Date(existing.subscription_end_date).toLocaleDateString()
        : 'You already have an active subscription';
      return jsonResponse({
        error: message,
        code: 'SUBSCRIPTION_EXISTS',
        existing_subscription: { id: existing.id, plan_type: existing.plan_type, status: existing.status, end_date: existing.subscription_end_date },
        suggestion: existing.status === 'cancelled'
          ? 'Your subscription access continues until the end date. You can purchase a new plan after it expires.'
          : 'Please manage your existing subscription from your account settings, or wait for it to expire before purchasing a new plan.',
      }, 409);
    }
  }

  // Rate limit via DB count (matches old worker — not in-memory)
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabase
    .from('razorpay_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneMinuteAgo);
  if (count && count >= 5) {
    return jsonResponse({ error: 'Too many order attempts. Please wait a minute.' }, 429);
  }

  // Create order via payments-worker
  const workerRes = await callWorker(env, '/create-order', 'POST', {
    amount, currency,
    receipt: 'rcpt_' + Date.now() + '_' + user.id.slice(0, 8),
    notes: { user_id: user.id, plan_id: planId, plan_name: planName, user_email: userEmail, user_name: userName },
  });
  const workerData = await workerRes.json() as any;
  if (!workerRes.ok || !workerData.success) {
    return jsonResponse({
      error: 'Unable to create payment order',
      razorpay_status: workerRes.status,
      razorpay_error: workerData.error?.message || 'Unknown error',
    }, 500);
  }

  const { order, key_id } = workerData;

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
    user_name: userName ?? null,
    created_at: new Date().toISOString(),
  });

  if (dbError) {
    return jsonResponse({ error: 'Order created but failed to save' }, 500);
  }

  return jsonResponse({ success: true, id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt, key: key_id });
}

// ── POST /verify-payment ──────────────────────────────────────────────────────

function calculateSubscriptionEndDate(billingCycle: string, fromDate?: Date): string {
  const d = fromDate ? new Date(fromDate) : new Date();
  if (billingCycle === 'yearly' || billingCycle === 'annual') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

async function generateReceiptPdfBase64(data: {
  paymentId: string; orderId: string; amount: number; planName: string;
  billingCycle: string; subscriptionEndDate: string; userName: string;
  userEmail: string; paymentMethod: string; paymentDate: string;
}): Promise<string> {
  const { paymentId, orderId, amount, planName, billingCycle, subscriptionEndDate, userName, userEmail, paymentMethod, paymentDate } = data;
  const formatAmount = (a: number) => `Rs. ${a.toLocaleString('en-IN')}`;

  // Dynamic import so pdf-lib doesn't break module init if unavailable
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595, 842]);
  const { height } = page.getSize();
  let y = height - 50;

  page.drawText('PAYMENT RECEIPT', { x: 50, y, size: 24, font: boldFont, color: rgb(0.15, 0.39, 0.92) });
  y -= 40;
  page.drawText('RareMinds - Skill Passport', { x: 50, y, size: 12, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 50;

  page.drawText('Transaction Details', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
  y -= 25;
  page.drawText(`Reference: ${paymentId}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) }); y -= 18;
  page.drawText(`Order ID: ${orderId}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) }); y -= 18;
  page.drawText(`Date: ${paymentDate}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) }); y -= 18;
  page.drawText(`Payment Method: ${paymentMethod}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) }); y -= 18;
  page.drawText(`Status: Success`, { x: 50, y, size: 10, font, color: rgb(0.13, 0.77, 0.37) }); y -= 40;

  page.drawText('Amount Paid', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) }); y -= 25;
  page.drawText(formatAmount(amount), { x: 50, y, size: 20, font: boldFont, color: rgb(0.15, 0.39, 0.92) }); y -= 50;

  page.drawText('Customer Details', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) }); y -= 25;
  page.drawText(`Name: ${userName}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) }); y -= 18;
  page.drawText(`Email: ${userEmail}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) }); y -= 40;

  page.drawText('Subscription Details', { x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1) }); y -= 25;
  page.drawText(`Plan: ${planName}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) }); y -= 18;
  page.drawText(`Billing Cycle: ${billingCycle}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) }); y -= 18;
  page.drawText(`Valid Until: ${subscriptionEndDate}`, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) }); y -= 50;

  page.drawText('Thank you for your payment!', { x: 50, y, size: 12, font: boldFont, color: rgb(0.15, 0.39, 0.92) }); y -= 20;
  page.drawText('For support: marketing@rareminds.in', { x: 50, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) }); y -= 15;
  page.drawText(`Generated: ${new Date().toLocaleString()}`, { x: 50, y, size: 8, font, color: rgb(0.6, 0.6, 0.6) });

  const pdfBytes = await pdfDoc.save();
  let binary = '';
  for (let i = 0; i < pdfBytes.length; i++) binary += String.fromCharCode(pdfBytes[i]);
  return btoa(binary);
}

async function uploadReceiptToR2(
  env: PaymentsEnv,
  pdfBase64: string,
  paymentId: string,
  userId: string,
  filename: string,
  userName?: string
): Promise<{ success: boolean; url?: string; fileKey?: string; error?: string }> {
  const storageUrl = env.STORAGE_API_URL || 'http://localhost:8788/api/storage';
  try {
    const response = await fetch(`${storageUrl}/upload-payment-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64, paymentId, userId, userName, filename }),
    });
    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${err}` };
    }
    return await response.json() as { success: boolean; url?: string; fileKey?: string };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

function getReceiptDownloadUrl(env: PaymentsEnv, fileKey: string): string {
  const storageUrl = env.STORAGE_API_URL || 'http://localhost:8788/api/storage';
  return `${storageUrl}/payment-receipt?key=${encodeURIComponent(fileKey)}&mode=download`;
}

async function sendPaymentConfirmationEmail(
  env: PaymentsEnv,
  email: string,
  name: string,
  details: { paymentId: string; orderId: string; amount: number; planName: string; billingCycle: string; subscriptionEndDate: string; receiptUrl?: string }
): Promise<boolean> {
  const { paymentId, orderId, amount, planName, billingCycle, subscriptionEndDate, receiptUrl } = details;
  const formatAmount = (a: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const receiptButtonHtml = receiptUrl ? `
    <div style="text-align:center;margin:24px 0;">
      <a href="${receiptUrl}" style="display:inline-block;background:linear-gradient(135deg,#10B981 0%,#059669 100%);color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">📄 Download Receipt</a>
    </div>` : '';

  const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Payment Confirmation</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background-color:#f4f7fa;">
  <table style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table style="width:600px;max-width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding:40px;text-align:center;background:linear-gradient(135deg,#10B981 0%,#059669 100%);border-radius:12px 12px 0 0;">
            <div style="width:60px;height:60px;background:white;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;"><span style="font-size:32px;">✓</span></div>
            <h1 style="margin:0;color:#ffffff;font-size:28px;">Payment Successful!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#374151;font-size:16px;margin-bottom:24px;">Hi <strong>${name}</strong>,</p>
            <p style="color:#374151;font-size:16px;margin-bottom:24px;">Thank you for your payment! Your subscription has been activated successfully.</p>
            <div style="background-color:#F3F4F6;border-radius:8px;padding:24px;margin:24px 0;">
              <h3 style="margin:0 0 16px;color:#1F2937;font-size:18px;">💳 Payment Details</h3>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#6B7280;">Amount Paid</td><td style="padding:8px 0;color:#1F2937;font-weight:600;text-align:right;">${formatAmount(amount)}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280;">Payment ID</td><td style="padding:8px 0;color:#1F2937;font-family:monospace;text-align:right;">${paymentId.slice(-12)}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280;">Order ID</td><td style="padding:8px 0;color:#1F2937;font-family:monospace;text-align:right;">${orderId.slice(-12)}</td></tr>
              </table>
            </div>
            <div style="background-color:#EFF6FF;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #3B82F6;">
              <h3 style="margin:0 0 16px;color:#1F2937;font-size:18px;">✨ Subscription Details</h3>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#6B7280;">Plan</td><td style="padding:8px 0;color:#3B82F6;font-weight:600;text-align:right;">${planName}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280;">Billing Cycle</td><td style="padding:8px 0;color:#1F2937;text-align:right;">${billingCycle}</td></tr>
                <tr><td style="padding:8px 0;color:#6B7280;">Valid Until</td><td style="padding:8px 0;color:#1F2937;text-align:right;">${formatDate(subscriptionEndDate)}</td></tr>
              </table>
            </div>
            ${receiptButtonHtml}
            <div style="text-align:center;margin:32px 0;">
              <a href="/subscription/manage" style="display:inline-block;background:linear-gradient(135deg,#3B82F6 0%,#1D4ED8 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">Manage Subscription →</a>
            </div>
            <p style="color:#6B7280;font-size:14px;margin-top:24px;">If you have any questions, feel free to contact our support team.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background-color:#F9FAFB;border-radius:0 0 12px 12px;text-align:center;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await sendEmail(env as any, {
      to: email,
      subject: `Payment Confirmed - ${planName} Subscription Activated!`,
      html: htmlContent,
      from: 'noreply@rareminds.in',
      fromName: 'Skill Passport',
    });
    console.log(`Payment confirmation email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
    return false;
  }
}

export async function handleVerifyPayment(req: Request, env: PaymentsEnv): Promise<Response> {
  const supabase = adminClient(env);

  const body = await req.json() as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    plan?: { id?: string; name?: string; price?: number; duration?: string };
  };
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  // Idempotency — if subscription already exists for this payment
  const { data: existingSubscription } = await supabase
    .from('subscriptions').select('*')
    .eq('razorpay_payment_id', razorpay_payment_id).maybeSingle();

  if (existingSubscription) {
    const { data: transaction } = await supabase
      .from('payment_transactions').select('payment_method, amount')
      .eq('razorpay_payment_id', razorpay_payment_id).maybeSingle();
    return jsonResponse({
      success: true, verified: true,
      message: 'Payment already verified and subscription exists',
      payment_id: razorpay_payment_id, order_id: razorpay_order_id,
      user_id: existingSubscription.user_id, user_name: existingSubscription.full_name,
      user_email: existingSubscription.email,
      payment_method: transaction?.payment_method || 'Card',
      amount: (transaction?.amount || existingSubscription.plan_amount || 0) * 100,
      subscription: existingSubscription, already_processed: true,
    });
  }

  // Verify order exists
  const { data: order, error: orderError } = await supabase
    .from('razorpay_orders').select('*').eq('order_id', razorpay_order_id).maybeSingle();
  if (orderError || !order) return jsonResponse({ error: 'Order not found' }, 404);

  // Verify HMAC signature via payments-worker
  const verifyRes = await callWorker(env, '/verify-payment', 'POST', {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
  });
  const verifyData = await verifyRes.json() as any;
  if (!verifyRes.ok || !verifyData.verified) {
    return jsonResponse({ error: 'Invalid payment signature' }, 400);
  }

  // Fetch payment details from Razorpay via worker to get method and verify amount
  let paymentMethod = 'unknown';
  let paymentAmount = order.amount;
  try {
    const payRes = await callWorker(env, `/payment/${razorpay_payment_id}`, 'GET');
    if (payRes.ok) {
      const payData = await payRes.json() as any;
      if (payData.success && payData.payment) {
        paymentMethod = payData.payment.method || 'unknown';
        paymentAmount = payData.payment.amount || order.amount;
        if (paymentAmount !== order.amount) {
          return jsonResponse({ error: 'Payment amount mismatch' }, 400);
        }
        if (payData.payment.status !== 'captured' && payData.payment.status !== 'authorized') {
          return jsonResponse({ error: 'Payment not completed' }, 400);
        }
      }
    }
  } catch (err) {
    console.error('[verify-payment] Error fetching payment details:', err);
  }

  // Update order status
  await supabase.from('razorpay_orders')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('order_id', razorpay_order_id);

  // Get user details — uses firstName/lastName like old worker
  const { data: userData } = await supabase
    .from('users').select('firstName, lastName, email, phone').eq('id', order.user_id).maybeSingle();

  const fullName = userData
    ? `${(userData as any).firstName || ''} ${(userData as any).lastName || ''}`.trim()
    : order.user_name || 'User';
  const userEmail = (userData as any)?.email || order.user_email || '';
  const userPhone = (userData as any)?.phone || null;

  // FORCE YEARLY BILLING — matches old worker exactly
  const billingCycle = 'yearly';
  const planAmount = plan?.price ?? (paymentAmount / 100);
  const planType = plan?.name || order.plan_name || 'Standard Plan';

  // Resolve plan_id from subscription_plans
  let planId: string | null = null;
  const planCode = plan?.id;
  if (planCode) {
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRe.test(planCode)) {
      planId = planCode;
    } else {
      const { data: pr } = await supabase.from('subscription_plans').select('id').eq('plan_code', planCode).maybeSingle();
      planId = pr?.id ?? null;
    }
  }
  if (!planId) {
    const { data: pr } = await supabase.from('subscription_plans').select('id').ilike('name', planType).maybeSingle();
    planId = pr?.id ?? null;
  }

  const now = new Date();

  // Check for existing active subscription — renewal vs upgrade
  const { data: existingActiveSub } = await supabase
    .from('subscriptions').select('*').eq('user_id', order.user_id).eq('status', 'active').maybeSingle();

  if (existingActiveSub) {
    const isSamePlan = existingActiveSub.plan_type?.toLowerCase() === planType?.toLowerCase();
    const ts = now.toISOString();

    if (isSamePlan) {
      // Renewal — extend end date
      const currentEnd = new Date(existingActiveSub.subscription_end_date);
      const extBase = currentEnd.getTime() > now.getTime() ? currentEnd : now;
      const newEnd = calculateSubscriptionEndDate(billingCycle, extBase);

      const { data: renewed } = await supabase.from('subscriptions')
        .update({ razorpay_payment_id, razorpay_order_id, subscription_end_date: newEnd, updated_at: ts })
        .eq('id', existingActiveSub.id).select().single();

      await supabase.from('payment_transactions').insert({
        subscription_id: existingActiveSub.id, user_id: order.user_id,
        razorpay_payment_id, razorpay_order_id,
        amount: planAmount, currency: 'INR', status: 'success',
        payment_method: paymentMethod, created_at: ts,
      });

      await supabase.from('razorpay_orders')
        .update({ razorpay_payment_id, payment_method: paymentMethod, subscription_id: existingActiveSub.id, updated_at: ts })
        .eq('order_id', razorpay_order_id);

      const emailSent = await sendPaymentConfirmationEmail(env, userEmail, fullName, {
        paymentId: razorpay_payment_id, orderId: razorpay_order_id,
        amount: planAmount, planName: planType, billingCycle, subscriptionEndDate: newEnd,
      });

      return jsonResponse({
        success: true, verified: true,
        message: 'Subscription renewed successfully! Your subscription has been extended.',
        payment_id: razorpay_payment_id, order_id: razorpay_order_id,
        user_id: existingActiveSub.user_id, user_name: existingActiveSub.full_name,
        user_email: existingActiveSub.email, payment_method: paymentMethod,
        amount: paymentAmount, subscription: renewed || existingActiveSub,
        is_renewal: true, new_end_date: newEnd, email_sent: emailSent,
      });
    } else {
      // Upgrade — cancel old subscription
      await supabase.from('subscriptions')
        .update({ status: 'cancelled', updated_at: ts })
        .eq('id', existingActiveSub.id);
    }
  }

  // Create new subscription
  const subscriptionEndDate = calculateSubscriptionEndDate(billingCycle, now);

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: order.user_id,
      full_name: fullName,
      email: userEmail,
      phone: userPhone,
      plan_id: planId,
      plan_type: planType,
      plan_amount: planAmount,
      billing_cycle: billingCycle,
      razorpay_payment_id,
      razorpay_order_id,
      status: 'active',
      subscription_start_date: now.toISOString(),
      subscription_end_date: subscriptionEndDate,
      auto_renew: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .select().single();

  if (subError) {
    console.error('Error creating subscription:', subError);
    return jsonResponse({
      success: true, verified: true,
      message: 'Payment verified but subscription creation failed',
      payment_id: razorpay_payment_id, order_id: razorpay_order_id,
      user_id: order.user_id, user_name: fullName, user_email: userEmail,
      payment_method: paymentMethod, amount: paymentAmount,
      subscription_error: subError.message,
    });
  }

  // Log payment transaction
  await supabase.from('payment_transactions').insert({
    subscription_id: subscription.id, user_id: order.user_id,
    razorpay_payment_id, razorpay_order_id,
    amount: planAmount, currency: 'INR', status: 'success',
    payment_method: paymentMethod, created_at: now.toISOString(),
  });

  // Update razorpay_orders with payment result
  await supabase.from('razorpay_orders')
    .update({ razorpay_payment_id, payment_method: paymentMethod, subscription_id: subscription.id, updated_at: now.toISOString() })
    .eq('order_id', razorpay_order_id);

  // Generate and upload receipt PDF to R2 (matches old worker exactly)
  let receiptUrl: string | undefined;
  try {
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const pdfBase64 = await generateReceiptPdfBase64({
      paymentId: razorpay_payment_id, orderId: razorpay_order_id,
      amount: planAmount, planName: planType, billingCycle,
      subscriptionEndDate: formatDate(subscription.subscription_end_date),
      userName: fullName, userEmail, paymentMethod,
      paymentDate: formatDate(now.toISOString()),
    });
    const filename = `Receipt-${razorpay_payment_id.slice(-8)}-${now.toISOString().split('T')[0]}.pdf`;
    const uploadResult = await uploadReceiptToR2(env, pdfBase64, razorpay_payment_id, order.user_id, filename, fullName);
    if (uploadResult.success && uploadResult.fileKey) {
      receiptUrl = getReceiptDownloadUrl(env, uploadResult.fileKey);
      await supabase.from('subscriptions').update({ receipt_url: receiptUrl }).eq('id', subscription.id);
    }
  } catch (receiptErr) {
    console.error('[verify-payment] Receipt generation/upload failed:', receiptErr);
  }

  // Send confirmation email
  const emailSent = await sendPaymentConfirmationEmail(env, userEmail, fullName, {
    paymentId: razorpay_payment_id, orderId: razorpay_order_id,
    amount: planAmount, planName: planType, billingCycle,
    subscriptionEndDate: subscription.subscription_end_date,
    receiptUrl,
  });

  if (!emailSent) {
    console.warn(`Failed to send confirmation email to ${userEmail} for payment ${razorpay_payment_id}`);
  }

  return jsonResponse({
    success: true, verified: true,
    message: 'Payment verified and subscription activated',
    payment_id: razorpay_payment_id, order_id: razorpay_order_id,
    user_id: order.user_id, user_name: fullName, user_email: userEmail,
    payment_method: paymentMethod, amount: paymentAmount,
    subscription, email_sent: emailSent, receipt_url: receiptUrl ?? null,
  });
}

// ── POST /webhook ─────────────────────────────────────────────────────────────

export async function handleWebhook(req: Request, env: PaymentsEnv): Promise<Response> {
  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) return jsonResponse({ error: 'Missing signature' }, 400);

  const rawBody = await req.text();
  const supabase = adminClient(env);

  // Verify signature via payments-worker
  const token = await mintServiceJwt(env.RAZORPAY_SERVICE_SECRET);
  const verifyRes = await fetch(env.RAZORPAY_WORKER_URL + '/verify-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'x-razorpay-signature': signature },
    body: rawBody,
  });
  const verifyData = await verifyRes.json() as any;
  if (!verifyRes.ok || !verifyData.verified) {
    return jsonResponse({ error: 'Invalid signature' }, 400);
  }

  const webhookData = JSON.parse(rawBody);
  const event = webhookData.event;
  const payload = webhookData.payload;
  const now = new Date().toISOString();

  switch (event) {
    case 'payment.captured':
      await supabase.from('payment_transactions')
        .update({ status: 'success', updated_at: now })
        .eq('razorpay_payment_id', payload.payment.entity.id);
      break;
    case 'payment.failed':
      await supabase.from('payment_transactions')
        .update({ status: 'failed', updated_at: now })
        .eq('razorpay_payment_id', payload.payment.entity.id);
      break;
    case 'subscription.cancelled':
      await supabase.from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;
    case 'subscription.paused':
      await supabase.from('subscriptions')
        .update({ status: 'paused', paused_at: now, updated_at: now })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;
    case 'subscription.resumed':
      await supabase.from('subscriptions')
        .update({ status: 'active', paused_at: null, updated_at: now })
        .eq('razorpay_subscription_id', payload.subscription.entity.id);
      break;
    case 'subscription.charged': {
      const payment = payload.payment.entity;
      await supabase.from('payment_transactions').insert({
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: 'success',
        payment_method: payment.method,
        created_at: now,
      });
      break;
    }
  }

  return jsonResponse({ success: true, event });
}

// ── GET /get-subscription ─────────────────────────────────────────────────────

export async function handleGetSubscription(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', auth.user.id)
    .in('status', ['active', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return jsonResponse({ error: error.message }, 500);

  if (!data) {
    // Return most recent subscription even if cancelled/expired (matches old worker)
    const { data: recent } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return jsonResponse({ success: true, has_active_subscription: false, subscription: recent ?? null });
  }

  return jsonResponse({ success: true, has_active_subscription: true, subscription: data });
}

// ── GET /check-subscription-access ───────────────────────────────────────────

const GRACE_PERIOD_DAYS = 3;

export async function handleCheckSubscriptionAccess(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ success: false, hasAccess: false, accessReason: 'no_subscription', subscription: null, showWarning: false }, 401);

  const supabase = adminClient(env);
  const now = new Date();

  // Check org license assignment first
  const { data: licenseAssignment } = await supabase
    .from('license_assignments')
    .select(`id, status, expires_at, organization_subscription_id,
      organization_subscriptions!inner(id, status, start_date, end_date, organization_id, organization_type, subscription_plan_id,
        subscription_plans(id, name, plan_code))`)
    .eq('user_id', auth.user.id).eq('status', 'active').maybeSingle();

  if (licenseAssignment) {
    const orgSub = (licenseAssignment as any).organization_subscriptions;
    if (orgSub?.status === 'active') {
      const orgEnd = new Date(orgSub.end_date);
      const licenseExpiry = licenseAssignment.expires_at ? new Date(licenseAssignment.expires_at) : null;
      const effectiveEnd = licenseExpiry && licenseExpiry < orgEnd ? licenseExpiry : orgEnd;
      if (effectiveEnd > now) {
        const daysUntilExpiry = Math.ceil((effectiveEnd.getTime() - now.getTime()) / 86_400_000);
        const showWarning = daysUntilExpiry <= 7;
        return jsonResponse({
          success: true, hasAccess: true, accessReason: 'active',
          subscription: {
            id: orgSub.id, plan_id: orgSub.subscription_plan_id,
            plan_name: orgSub.subscription_plans?.name || 'Organization Plan',
            plan_code: orgSub.subscription_plans?.plan_code,
            status: 'active', subscription_start_date: orgSub.start_date,
            subscription_end_date: effectiveEnd.toISOString(),
            is_organization_license: true, organization_id: orgSub.organization_id,
            organization_type: orgSub.organization_type, license_assignment_id: licenseAssignment.id,
          },
          showWarning, warningType: showWarning ? 'expiring_soon' : undefined,
          warningMessage: showWarning ? `Your organization license expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}` : undefined,
          daysUntilExpiry, expiresAt: effectiveEnd.toISOString(),
        });
      }
    }
  }

  // Check for revoked license
  const { data: revokedLicense } = await supabase
    .from('license_assignments')
    .select(`id, status, revoked_at, organization_subscriptions(subscription_plans(name, plan_code))`)
    .eq('user_id', auth.user.id).eq('status', 'revoked')
    .order('revoked_at', { ascending: false }).limit(1).maybeSingle();

  // Individual subscription with grace period
  const gracePeriodDate = new Date(now);
  gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);

  const { data: subscription, error } = await supabase
    .from('subscriptions').select('*')
    .eq('user_id', auth.user.id)
    .in('status', ['active', 'paused', 'cancelled'])
    .gte('subscription_end_date', gracePeriodDate.toISOString())
    .order('status', { ascending: true })
    .order('subscription_end_date', { ascending: false })
    .limit(1).maybeSingle();

  if (error) return jsonResponse({ success: false, hasAccess: false, accessReason: 'no_subscription', subscription: null, showWarning: false }, 500);

  if (!subscription) {
    if (revokedLicense) {
      const revokedOrgSub = (revokedLicense as any).organization_subscriptions;
      return jsonResponse({ success: true, hasAccess: false, accessReason: 'expired', subscription: { id: revokedLicense.id, status: 'expired', plan_name: revokedOrgSub?.subscription_plans?.name || 'Organization License', is_organization_license: true, was_revoked: true, revoked_at: revokedLicense.revoked_at }, showWarning: false });
    }
    const { data: anySub } = await supabase.from('subscriptions').select('id, status, subscription_end_date')
      .eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
    return jsonResponse({ success: true, hasAccess: false, accessReason: anySub ? 'expired' : 'no_subscription', subscription: anySub ?? null, showWarning: false });
  }

  const endDate = new Date(subscription.subscription_end_date);
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / 86_400_000);

  if (subscription.status === 'paused') {
    return jsonResponse({ success: true, hasAccess: true, accessReason: 'paused', subscription, showWarning: true, warningType: 'paused', warningMessage: `Your subscription is paused until ${new Date(subscription.paused_until).toLocaleDateString()}`, daysUntilExpiry, expiresAt: subscription.subscription_end_date });
  }
  if (subscription.status === 'cancelled' && endDate > now) {
    return jsonResponse({ success: true, hasAccess: true, accessReason: 'cancelled', subscription, showWarning: true, warningType: 'expiring_soon', warningMessage: `Your subscription was cancelled. Access ends in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.`, daysUntilExpiry, expiresAt: subscription.subscription_end_date });
  }
  if (subscription.status === 'active' && endDate > now) {
    const showWarning = daysUntilExpiry <= 7;
    return jsonResponse({ success: true, hasAccess: true, accessReason: 'active', subscription, showWarning, warningType: showWarning ? 'expiring_soon' : undefined, warningMessage: showWarning ? `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}` : undefined, daysUntilExpiry, expiresAt: subscription.subscription_end_date });
  }
  if (daysUntilExpiry >= -GRACE_PERIOD_DAYS) {
    const daysLeftInGrace = GRACE_PERIOD_DAYS - Math.abs(daysUntilExpiry);
    return jsonResponse({ success: true, hasAccess: true, accessReason: 'grace_period', subscription, showWarning: true, warningType: 'grace_period', warningMessage: `Your subscription expired. You have ${daysLeftInGrace} day${daysLeftInGrace !== 1 ? 's' : ''} left to renew before losing access.`, daysUntilExpiry, expiresAt: subscription.subscription_end_date });
  }
  return jsonResponse({ success: true, hasAccess: false, accessReason: 'expired', subscription, showWarning: false, daysUntilExpiry, expiresAt: subscription.subscription_end_date });
}

// ── POST /cancel-subscription ─────────────────────────────────────────────────

export async function handleCancelSubscription(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { subscription_id?: string; cancel_at_cycle_end?: boolean };

  // Look up by provided subscription_id or fall back to user's active sub
  let query = supabase.from('subscriptions').select('id, status, razorpay_subscription_id, subscription_end_date, cancelled_at').eq('user_id', auth.user.id);
  if (body.subscription_id) query = query.eq('id', body.subscription_id);
  else query = query.eq('status', 'active');
  const { data: sub } = await query.maybeSingle();

  if (!sub) return jsonResponse({ error: 'No active subscription found' }, 404);

  if (sub.status === 'cancelled') {
    return jsonResponse({ success: true, message: 'Subscription is already cancelled', subscription_id: sub.id, status: 'cancelled', already_cancelled: true });
  }

  if (sub.razorpay_subscription_id) {
    await callWorker(env, `/subscription/${sub.razorpay_subscription_id}/cancel`, 'POST');
  }

  const now = new Date().toISOString();
  const { data: updated } = await supabase.from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: now, auto_renew: false, cancellation_reason: 'user_requested' })
    .eq('id', sub.id).select().single();

  return jsonResponse({ success: true, message: 'Subscription cancelled successfully', subscription_id: sub.id, status: 'cancelled', subscription: updated });
}

// ── POST /deactivate-subscription ────────────────────────────────────────────

export async function handleDeactivateSubscription(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { subscription_id?: string; cancellation_reason?: string };

  if (!body.subscription_id) return jsonResponse({ error: 'subscription_id is required' }, 400);

  const { data: sub } = await supabase.from('subscriptions')
    .select('id, user_id, status, subscription_end_date, cancelled_at')
    .eq('id', body.subscription_id).maybeSingle();

  if (!sub) return jsonResponse({ error: 'Subscription not found' }, 404);
  if (sub.user_id !== auth.user.id) return jsonResponse({ error: 'Permission denied' }, 403);

  if (sub.status === 'cancelled') {
    return jsonResponse({
      success: true, message: 'Subscription is already cancelled',
      subscription: { id: sub.id, status: 'cancelled', cancelled_at: sub.cancelled_at, access_until: sub.subscription_end_date },
      already_cancelled: true,
    });
  }

  if (!['active', 'paused'].includes(sub.status)) {
    return jsonResponse({ error: `Cannot cancel subscription with status '${sub.status}'` }, 400);
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase.from('subscriptions')
    .update({ status: 'cancelled', auto_renew: false, cancelled_at: now, cancellation_reason: body.cancellation_reason ?? 'other', updated_at: now })
    .eq('id', sub.id).eq('user_id', auth.user.id).select('*').single();

  if (error) return jsonResponse({ error: 'Failed to cancel subscription' }, 500);

  await supabase.from('subscription_cancellations').insert({
    subscription_id: sub.id, user_id: auth.user.id,
    cancellation_reason: body.cancellation_reason ?? 'other',
    cancelled_at: now, access_until: sub.subscription_end_date,
  }).maybeSingle();

  return jsonResponse({ success: true, message: 'Subscription cancelled successfully', subscription: updated });
}

// ── POST /pause-subscription ──────────────────────────────────────────────────

export async function handlePauseSubscription(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { subscription_id?: string; pause_months?: number };
  const months = Math.min(Math.max(body.pause_months ?? 1, 1), 3);

  let query = supabase.from('subscriptions').select('id, status, subscription_end_date').eq('user_id', auth.user.id);
  if (body.subscription_id) query = query.eq('id', body.subscription_id);
  else query = query.eq('status', 'active');
  const { data: sub } = await query.maybeSingle();

  if (!sub) return jsonResponse({ error: 'No active subscription found' }, 404);
  if (sub.status === 'paused') return jsonResponse({ success: true, message: 'Subscription is already paused', subscription: sub, already_paused: true });
  if (sub.status !== 'active') return jsonResponse({ error: `Cannot pause subscription with status '${sub.status}'` }, 400);

  const now = new Date();
  const pausedUntil = new Date(now);
  pausedUntil.setMonth(pausedUntil.getMonth() + months);
  const newEndDate = new Date(sub.subscription_end_date);
  newEndDate.setMonth(newEndDate.getMonth() + months);

  const { data: updated, error } = await supabase.from('subscriptions')
    .update({ status: 'paused', paused_at: now.toISOString(), paused_until: pausedUntil.toISOString(), subscription_end_date: newEndDate.toISOString() })
    .eq('id', sub.id).select().single();

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, message: `Subscription paused for ${months} month(s)`, subscription: updated, paused_until: pausedUntil.toISOString() });
}

// ── POST /resume-subscription ─────────────────────────────────────────────────

export async function handleResumeSubscription(req: Request, env: PaymentsEnv): Promise<Response> {
  const auth = await authenticateUser(req, env as any);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  const supabase = adminClient(env);
  const body = await req.json() as { subscription_id?: string };

  let query = supabase.from('subscriptions').select('id, status').eq('user_id', auth.user.id);
  if (body.subscription_id) query = query.eq('id', body.subscription_id);
  else query = query.eq('status', 'paused');
  const { data: sub } = await query.maybeSingle();

  if (!sub) return jsonResponse({ error: 'No paused subscription found' }, 404);
  if (sub.status === 'active') return jsonResponse({ success: true, message: 'Subscription is already active', subscription: sub, already_active: true });
  if (sub.status !== 'paused') return jsonResponse({ error: `Cannot resume subscription with status '${sub.status}'` }, 400);

  const { data: updated, error } = await supabase.from('subscriptions')
    .update({ status: 'active', paused_at: null, paused_until: null })
    .eq('id', sub.id).select().single();

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true, message: 'Subscription resumed successfully', subscription: updated });
}
