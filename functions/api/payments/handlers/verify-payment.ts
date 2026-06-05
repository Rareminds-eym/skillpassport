/**
 * Verify Payment Handler
 *
 * POST /api/payments/verify-payment
 *
 * Verifies a Razorpay payment signature via the payment-worker RPC binding,
 * then creates a subscription and payment transaction in the auth DB via
 * the SSO worker, syncs the shadow table in the app DB, generates a receipt
 * PDF, and sends a confirmation email.
 *
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import { R2Client } from '../../storage/utils/r2-client';
import { generateReceiptPDF, fetchImageBytes, type ReceiptData } from '../../storage/utils/pdf-generator';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import { generateUserConfirmationHtml, getUserConfirmationSubject } from '../../email/services/templates';
import type { EventConfirmationTemplateData } from '../../email/types';
import { sendEmailSafe } from '../../../lib/email-service';
import {
  ssoCreateSubscription,
  ssoUpdateSubscriptionField,
  ssoRecordTransaction,
  ssoSyncSubscription,
} from '../../../lib/sso-client';
import { syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';

export async function handleVerifyPayment(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher };

  try {
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_INPUT',
            message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Verify Razorpay HMAC signature via payment-worker RPC (unchanged)
    const worker = getPaymentWorker(env);
    const verifyResult = await worker.verifyPaymentSignature(
      body.razorpay_order_id as string,
      body.razorpay_payment_id as string,
      body.razorpay_signature as string
    );

    // Step 2: Signature valid — prepare subscription data
    const plan = body.plan as Record<string, unknown> | undefined;
    if (!plan || !plan.id || !plan.name || !plan.price || !plan.duration) {
      console.warn('[VerifyPayment] Signature verified but no plan data provided');
      return new Response(JSON.stringify({ success: true, ...verifyResult }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getServiceClient(env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });

    // Step 2.5: Validate plan exists via plans_cache (local shadow of auth DB)
    const { data: validPlan, error: planError } = await supabase
      .from('plans_cache')
      .select('id, plan_code, name, is_active, pricing_matrix')
      .eq('id', plan.id)
      .eq('is_active', true)
      .maybeSingle();

    if (planError || !validPlan) {
      console.error('[VerifyPayment] Invalid or inactive plan:', plan.id, planError);
      return new Response(JSON.stringify({
        error: {
          code: 'INVALID_PLAN',
          message: 'Selected plan is not valid or inactive',
        },
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Authoritative price from DB — never trust client-supplied price
    const yearlyPrice = validPlan.pricing_matrix?.all?.yearly;
    if (typeof yearlyPrice !== 'number') {
      console.error('[VerifyPayment] Plan has no yearly price:', plan.id, validPlan.pricing_matrix);
      return new Response(JSON.stringify({
        error: { code: 'INVALID_PLAN', message: 'Selected plan has no valid pricing' },
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const planPrice = yearlyPrice;

    // Calculate subscription dates
    const now = new Date();
    const endDate = new Date(now);
    const durationMonths = parseDurationMonths(plan.duration as string);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Check for existing active subscription via shadow table
    const { data: existingCache } = await supabase
      .from('subscription_cache')
      .select('id, status, plan_id, plan_code')
      .eq('user_id', user.sub)
      .in('status', ['active', 'pending', 'grace_period'])
      .maybeSingle();

    let subscription: Record<string, unknown>;
    let isUpgrade = false;

    if (existingCache) {
      // Upgrade flow — update existing subscription in auth DB
      isUpgrade = true;
      console.log('[VerifyPayment] Upgrading existing subscription:', existingCache.id);

      // Validate upgrade direction via plans_cache pricing
      const { data: currentPlan } = await supabase
        .from('plans_cache')
        .select('plan_code, pricing_matrix')
        .eq('id', existingCache.plan_id)
        .single();

      if (currentPlan) {
        const currentPrice = currentPlan.pricing_matrix?.all?.yearly;
        if (typeof currentPrice !== 'number' || typeof planPrice !== 'number') {
          console.warn('[VerifyPayment] Cannot compare plan pricing:', { currentPrice, planPrice });
          return new Response(JSON.stringify({
            error: { code: 'UPGRADE_FAILED', message: 'Cannot determine plan pricing. Please contact support.' },
          }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (planPrice <= currentPrice) {
          console.warn('[VerifyPayment] Downgrade blocked:', {
            currentPlan: currentPlan.plan_code,
            currentPrice,
            newPrice: planPrice,
          });
          return new Response(JSON.stringify({
            error: {
              code: 'INVALID_UPGRADE',
              message: 'Cannot downgrade or lateral move. Please contact support for plan changes.',
            },
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      try {
        subscription = await ssoUpdateSubscriptionField(env, existingCache.id, {
          plan_id: plan.id,
          plan_code: validPlan.plan_code,
          plan_type: plan.name,
          plan_amount: planPrice,
          billing_cycle: plan.duration,
          razorpay_order_id: body.razorpay_order_id,
          razorpay_payment_id: body.razorpay_payment_id,
          subscription_start_date: now.toISOString(),
          subscription_end_date: endDate.toISOString(),
          auto_renew: true,
          status: 'active',
        });
      } catch (upgradeError: any) {
        console.error('[VerifyPayment] Upgrade failed:', upgradeError.message);

        // Record failed upgrade as an event in auth DB
        try {
          await ssoRecordTransaction(env, {
            user_id: user.sub,
            razorpay_order_id: body.razorpay_order_id as string,
            razorpay_payment_id: body.razorpay_payment_id as string,
            amount: planPrice,
            status: 'failed',
            transaction_type: 'upgrade',
            metadata: {
              original_subscription_id: existingCache.id,
              original_plan_id: existingCache.plan_id,
              target_plan_id: plan.id,
              error: upgradeError.message,
            },
          });
        } catch (logError) {
          console.error('[VerifyPayment] Failed to log upgrade failure:', logError);
        }

        return new Response(JSON.stringify({
          success: true,
          payment_verified: true,
          subscription_upgraded: false,
          ...verifyResult,
          error: {
            code: 'UPGRADE_FAILED',
            message: 'Payment verified but upgrade failed. Support will contact you within 24 hours.',
          },
        }), {
          status: 207,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // New subscription — create in auth DB
      console.log('[VerifyPayment] Creating new subscription for user:', user.sub);

      try {
        subscription = await ssoCreateSubscription(env, {
          user_id: user.sub,
          plan_id: plan.id as string,
          plan_code: validPlan.plan_code,
          plan_type: plan.name as string,
          plan_amount: planPrice,
          billing_cycle: plan.duration as string,
          features: validPlan.base_features || [],
          full_name: (user as any).name || user.email || '',
          email: user.email || '',
          phone: (user as any).phone || undefined,
          razorpay_order_id: body.razorpay_order_id as string,
          razorpay_payment_id: body.razorpay_payment_id as string,
        });
      } catch (createError: any) {
        console.error('[VerifyPayment] Subscription creation failed:', createError.message);

        return new Response(JSON.stringify({
          success: true,
          payment_verified: true,
          subscription_created: false,
          ...verifyResult,
          error: {
            code: 'SUBSCRIPTION_CREATE_FAILED',
            message: 'Payment verified but subscription creation failed. Please contact support.',
            details: createError.message,
          },
        }), {
          status: 207,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Step 3: Record payment transaction in auth DB
    try {
      await ssoRecordTransaction(env, {
        subscription_id: subscription.id as string,
        user_id: user.sub,
        razorpay_payment_id: body.razorpay_payment_id as string,
        razorpay_order_id: body.razorpay_order_id as string,
        amount: planPrice,
        currency: 'INR',
        status: 'completed',
        transaction_type: isUpgrade ? 'upgrade' : 'subscription',
      });
    } catch (txError) {
      console.error('[VerifyPayment] Transaction recording failed (non-critical):', txError);
    }

    // Step 3.5: Sync shadow table in app DB
    let syncedPlanId: string | null = null;
    let syncedSubscriptionId: string | null = null;
    try {
      // Ensure user exists in users_shadow (FK constraint for subscription_cache)
      await syncUserShadow(supabase, user.sub, body.email || (user as any).email);

      const syncData = await ssoSyncSubscription(env, user.sub);
      if (syncData.subscription) {
        await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
        syncedPlanId = syncData.subscription.plan_id ? String(syncData.subscription.plan_id) : null;
        syncedSubscriptionId = syncData.subscription.id ? String(syncData.subscription.id) : null;
      }
    } catch (syncError) {
      console.error('[VerifyPayment] Shadow sync failed (non-critical):', syncError);
    }

    // Step 3.6: Provision AI credits after successful subscription sync
    try {
      const cronSecret = (env as any).CRON_SECRET;
      const paymentId = body.razorpay_payment_id as string;
      const provisionPlanId = syncedPlanId ?? (plan?.id ? String(plan.id) : null);
      const provisionSubId = syncedSubscriptionId ?? (subscription?.id ? String(subscription.id) : null);

      if (!cronSecret) {
        console.error('[VerifyPayment] CRON_SECRET missing — cannot provision credits');
        // non-critical — skip provisioning, payment already succeeded
      } else if (!provisionPlanId || !provisionSubId || !paymentId) {
        console.warn('[VerifyPayment] Missing required data for credit provision:', {
          hasPlanId: !!provisionPlanId,
          hasSubId: !!provisionSubId,
          hasPaymentId: !!paymentId,
        });
      } else {
        const provisionUrl = new URL('/api/credits/provision', new URL(context.request.url).origin);
        const provisionRes = await fetch(provisionUrl.toString(), {
          method: 'POST',
          signal: AbortSignal.timeout(5000),
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': cronSecret,
          },
          body: JSON.stringify({
            userId: user.sub,
            subscriptionId: provisionSubId,
            planId: provisionPlanId,
            eventId: paymentId,
          }),
        });

        if (!provisionRes.ok) {
          const errorText = await provisionRes.text();
          console.error('[VerifyPayment] Credit provisioning failed:', {
            status: provisionRes.status,
            userId: user.sub,
            paymentId,
            error: errorText,
          });
        } else {
          const provisionData = await provisionRes.json() as Record<string, unknown>;
          console.log('[VerifyPayment] Credits provisioned successfully:', {
            userId: user.sub,
            paymentId,
            idempotent: !!provisionData.idempotent,
          });
        }
      }
    } catch (provisionError) {
      console.error('[VerifyPayment] Credit provision error:', {
        userId: user.sub,
        paymentId: body.razorpay_payment_id,
        error: provisionError instanceof Error ? provisionError.message : String(provisionError),
      });
    }

    // Step 4: Generate receipt PDF and upload to R2 (unchanged)
    let receiptUrl: string | null = null;
    let receiptKey: string | null = null;
    try {
      const pagesEnv = env as unknown as PagesEnv;
      const appUrl = pagesEnv.APP_URL;

      if (!appUrl) {
        console.warn('[VerifyPayment] APP_URL not configured — receipt will render without images');
      }

      const { data: learner } = await supabase
        .from('learners')
        .select('name')
        .eq('user_id', user.sub)
        .maybeSingle();

      let logoBytes: Uint8Array | undefined;
      if (appUrl) {
        const logoUrl = `${appUrl}/RareMinds ISO Logo-01.png`;
        logoBytes = await fetchImageBytes(logoUrl);
      }
      const watermarkBytes = logoBytes;

      const receiptData: ReceiptData = {
        transaction: {
          payment_id: body.razorpay_payment_id as string,
          order_id: body.razorpay_order_id as string,
          amount: planPrice,
          currency: 'INR',
          payment_method: 'Card',
          payment_timestamp: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'Success',
        },
        subscription: {
          plan_name: subscription.plan_type as string,
          plan_type: subscription.plan_type as string,
          billing_cycle: subscription.billing_cycle as string,
          subscription_start_date: subscription.subscription_start_date as string,
          subscription_end_date: subscription.subscription_end_date as string,
        },
        user: {
          name: learner?.name || (subscription.full_name as string) || '',
          email: (subscription.email as string) || user.email || '',
          phone: (subscription.phone as string) || undefined,
        },
        company: {
          name: 'Rareminds',
          address: '231, 2nd stage, 13th Cross Road\nHoysala Nagar, Indiranagar\nBengaluru, Karnataka 560001',
          phone: '+91 9902326951',
          email: 'marketing@rareminds.in',
          taxId: 'GSTIN: 29ABCDE1234F1Z5',
        },
        generatedAt: new Date().toLocaleString('en-IN'),
        logoBytes,
        watermarkBytes,
      };

      const pdfBytes = await generateReceiptPDF(receiptData);

      const shortUserId = user.sub.substring(0, 8);
      const sanitizedPmtId = (body.razorpay_payment_id as string).replace(/[^a-zA-Z0-9_-]/g, '');
      const timestamp = Date.now();
      receiptKey = `payment_pdf/user_${shortUserId}/${sanitizedPmtId}_${timestamp}.pdf`;
      const filename = `Receipt-${sanitizedPmtId.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;

      const r2 = new R2Client(pagesEnv);
      receiptUrl = await r2.upload(receiptKey, pdfBytes.buffer as ArrayBuffer, 'application/pdf', {
        'Content-Disposition': `attachment; filename="${filename}"`,
      });

      receiptUrl = await r2.generatePresignedGetUrl(receiptKey, 604800);
      console.log('[VerifyPayment] Receipt uploaded:', receiptUrl);
    } catch (receiptErr) {
      console.error('[VerifyPayment] Receipt generation failed (non-critical):', receiptErr);
    }

    // Step 5: Send payment confirmation email (unchanged)
    try {
      await sendPaymentSuccessEmail(env as unknown as PagesEnv, {
        name: subscription.full_name as string,
        email: (subscription.email as string) || user.email || '',
        phone: (subscription.phone as string) || '',
        amount: planPrice,
        orderId: body.razorpay_order_id as string,
        campaign: subscription.plan_type as string,
        receiptUrl: receiptUrl || undefined,
      });
    } catch (emailErr) {
      console.error('[VerifyPayment] Email failed (non-critical):', emailErr);
    }

    return new Response(JSON.stringify({
      success: true,
      ...verifyResult,
      subscription_created: true,
      receipt_url: receiptUrl,
      receipt_key: receiptKey,
      is_upgrade: isUpgrade,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_name: subscription.plan_type,
        start_date: subscription.subscription_start_date,
        end_date: subscription.subscription_end_date,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[VerifyPayment] Error:', error);
    return rpcErrorResponse(error);
  }
}

function parseDurationMonths(duration: string): number {
  const lower = duration.toLowerCase();
  if (lower.includes('annual') || lower.includes('year')) return 12;
  if (lower.includes('quarter')) return 3;
  if (lower.includes('month')) return 1;
  return 1;
}

async function sendPaymentSuccessEmail(
  env: PagesEnv,
  data: EventConfirmationTemplateData
): Promise<void> {
  const html = generateUserConfirmationHtml(data);
  const subject = getUserConfirmationSubject(data.name);

  const success = await sendEmailSafe(env, {
    to: data.email,
    subject,
    html,
  });

  if (success) {
    console.log('[VerifyPayment] Payment confirmation email sent');
  } else {
    console.error('[VerifyPayment] Email send failed (non-critical)');
  }
}
