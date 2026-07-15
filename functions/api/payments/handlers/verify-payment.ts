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


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { sendEmailSafe } from '../../../lib/email-service';
import { apiError, apiSuccess } from '../../../lib/response';
import {
  ssoCreateSubscription,
  ssoRecordTransaction,
  ssoSyncSubscription,
  ssoUpdateSubscriptionField,
} from '../../../lib/sso-client';
import { getServiceClient } from '../../../lib/supabase';
import { syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';
import type { PagesEnv } from '../../../lib/types';
import { APP_URL } from '../../email/types';
import { generateUserConfirmationHtml, getUserConfirmationSubject } from '../../email/services/templates';
import type { EventConfirmationTemplateData } from '../../email/types';
import { fetchImageBytes, generateReceiptPDF, type ReceiptData } from '../../storage/utils/pdf-generator';
import { R2Client } from '../../storage/utils/r2-client';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';

export async function handleVerifyPayment(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher };

  try {
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return apiError(400, 'VALIDATION_ERROR', 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required', context.request);
    }

    // Step 1: Verify Razorpay HMAC signature via payment-worker RPC (unchanged)
    const worker = getPaymentWorker(env);
    const verifyResult = await worker.verifyPaymentSignature(
      body.razorpay_order_id as string,
      body.razorpay_payment_id as string,
      body.razorpay_signature as string
    );

    // Step 1.5: Verify payment was actually captured (Amount Spoofing Prevention)
    const payment = await worker.getPayment(body.razorpay_payment_id as string);
    if (payment.status !== 'captured' || payment.order_id !== body.razorpay_order_id) {
      return apiError(400, 'VALIDATION_ERROR', 'Payment not captured or order ID mismatch', context.request);
    }

    // Step 2: Signature valid — prepare subscription data
    const plan = body.plan as Record<string, unknown> | undefined;
    if (!plan || !plan.id || !plan.name || !plan.price || !plan.duration) {
      console.warn('[VerifyPayment] Signature verified but no plan data provided');
      return apiSuccess(verifyResult, context.request);
    }

    const supabase = getServiceClient(env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });

    // Step 2.5: Validate plan exists via plans_cache (local shadow of auth DB)
    const { data: validPlan, error: planError } = await supabase
      .from('plans_cache')
      .select('id, plan_code, name, is_active, pricing_matrix, base_features')
      .eq('id', plan.id)
      .eq('is_active', true)
      .maybeSingle();

    if (planError || !validPlan) {
      console.error('[VerifyPayment] Invalid or inactive plan:', plan.id, planError);
      return apiError(400, 'VALIDATION_ERROR', 'Selected plan is not valid or inactive', context.request);
    }

    // Step 2.5: Validate currency (SECURITY: prevent multi-currency fraud)
    if (payment.currency !== 'INR') {
      console.error('[VerifyPayment] Currency mismatch:', {
        expected: 'INR',
        actual: payment.currency,
        paymentId: payment.id,
        orderId: razorpay_order_id
      });
      return apiError(400, 'VALIDATION_ERROR', 'Invalid payment currency. Only INR is supported.', context.request);
    }

    // Authoritative price from DB — never trust client-supplied price
    const pricingMatrix = validPlan.pricing_matrix as Record<string, { yearly?: number; monthly?: number; currency: string }>;
    const clientPrice = plan.price as number;
    let planPrice: number | undefined;

    // SECURITY FIX: Check both yearly and monthly pricing based on plan duration
    const planDuration = plan.duration as string;
    const isYearly = planDuration.toLowerCase().includes('year') || planDuration.toLowerCase().includes('annual');
    const cycleKey = isYearly ? 'yearly' : 'monthly';

    if (pricingMatrix) {
      for (const key in pricingMatrix) {
        const price = pricingMatrix[key]?.[cycleKey];
        if (typeof price === 'number' && price === clientPrice) {
          planPrice = price;
          break;
        }
      }
    }

    if (typeof planPrice !== 'number') {
      console.error('[VerifyPayment] Plan price mismatch or no pricing found for cycle:', {
        planId: plan.id,
        clientPrice,
        cycle: cycleKey,
        duration: planDuration,
        pricingMatrix
      });
      return apiError(400, 'VALIDATION_ERROR', `Selected plan has no valid ${cycleKey} pricing matching the request`, context.request);
    }

    // Step 2.6: Cross-verify authoritative Razorpay captured amount
    const expectedPaise = Math.round(planPrice * 100);
    if (payment.amount !== expectedPaise) {
      console.error('[VerifyPayment] Amount mismatch:', { captured: payment.amount, expected: expectedPaise, planId: plan.id });
      return apiError(400, 'VALIDATION_ERROR', `Amount mismatch: captured ${payment.amount} paise, expected ${expectedPaise}`, context.request);
    }

    // Calculate subscription dates
    const now = new Date();
    const endDate = new Date(now);
    const durationMonths = parseDurationMonths(plan.duration as string);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Check for existing active subscription via shadow table
    const { data: existingCache } = await supabase
      .from('subscription_cache')
      .select('id, status, plan_id, plan_code, plan_amount')
      .eq('user_id', user.id)
      .in('status', ['active', 'pending', 'grace_period'])
      .maybeSingle();

    let subscription: Record<string, unknown>;
    let isUpgrade = false;

    if (existingCache) {
      // Upgrade flow — update existing subscription in auth DB
      isUpgrade = true;
      console.log('[VerifyPayment] Upgrading existing subscription:', existingCache.id);

      // Validate upgrade direction via current plan amount
      const currentPrice = existingCache.plan_amount;

      const { data: currentPlan } = await supabase
        .from('plans_cache')
        .select('plan_code')
        .eq('id', existingCache.plan_id)
        .single();

      if (currentPlan) {
        if (typeof currentPrice !== 'number' || typeof planPrice !== 'number') {
          console.warn('[VerifyPayment] Cannot compare plan pricing:', { currentPrice, planPrice });
          return apiError(400, 'VALIDATION_ERROR', 'Cannot determine plan pricing. Please contact support.', context.request);
        }

        if (planPrice <= currentPrice) {
          console.warn('[VerifyPayment] Downgrade blocked:', {
            currentPlan: currentPlan.plan_code,
            currentPrice,
            newPrice: planPrice,
          });
          return apiError(400, 'VALIDATION_ERROR', 'Cannot downgrade or lateral move. Please contact support for plan changes.', context.request);
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
      } catch (upgradeError: unknown) {
        const upgradeErrorMessage = upgradeError instanceof Error ? upgradeError.message : String(upgradeError);
        const upgradeErrorStatus = (upgradeError as { status?: number })?.status;

        if (upgradeErrorMessage.includes('duplicate key') || upgradeErrorMessage.includes('23505') || upgradeErrorStatus === 409) {
          console.log('[VerifyPayment] Subscription already updated by webhook (duplicate caught). Syncing shadow cache before return.');

          try {
            await syncUserShadow(supabase, user.id, (typeof body.email === 'string' ? body.email : undefined) || user.email);
            const syncData = await ssoSyncSubscription(env, user.id);
            if (syncData.subscription) {
              await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
            }
          } catch (syncError) {
            console.error('[VerifyPayment] Shadow sync failed during upgrade duplicate handling:', syncError);
          }

          return apiSuccess({
            payment_verified: true,
            subscription_upgraded: true,
            already_fulfilled: true,
            ...verifyResult,
          }, context.request);
        }

        console.error('[VerifyPayment] Upgrade failed:', upgradeErrorMessage);

        // Record failed upgrade as an event in auth DB
        try {
          await ssoRecordTransaction(env, {
            user_id: user.id,
            razorpay_order_id: body.razorpay_order_id as string,
            razorpay_payment_id: body.razorpay_payment_id as string,
            razorpay_signature: body.razorpay_signature as string,
            amount: planPrice,
            status: 'failed',
            transaction_type: 'upgrade',
            payment_method: payment.method,
            failure_reason: upgradeErrorMessage,
            metadata: {
              original_subscription_id: existingCache.id,
              original_plan_id: existingCache.plan_id,
              target_plan_id: plan.id,
              error: upgradeErrorMessage,
            },
          });
        } catch (logError) {
          console.error('[VerifyPayment] Failed to log upgrade failure:', logError);
        }

        return apiSuccess({
          payment_verified: true,
          subscription_upgraded: false,
          ...verifyResult,
          error: {
            code: 'UPGRADE_FAILED',
            message: 'Payment verified but upgrade failed. Support will contact you within 24 hours.',
          },
        }, context.request, 207);
      }
    } else {
      // New subscription — create in auth DB
      console.log('[VerifyPayment] Creating new subscription for user:', user.id);

      // learners.name is the source of truth for the subscription's full_name
      // (subscriptions.full_name is used for Sales Dashboard name search, so it
      // must hold the real name, not the email).
      const { data: learnerForSubscription } = await supabase
        .from('learners')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();

      try {
        subscription = await ssoCreateSubscription(env, {
          user_id: user.id,
          plan_id: plan.id as string,
          plan_code: validPlan.plan_code,
          plan_type: plan.name as string,
          plan_amount: planPrice,
          billing_cycle: plan.duration as string,
          features: validPlan.base_features || [],
          full_name: learnerForSubscription?.name || user.email || '',
          email: user.email || '',
          razorpay_order_id: body.razorpay_order_id as string,
          razorpay_payment_id: body.razorpay_payment_id as string,
        });
      } catch (createError: unknown) {
        const createErrorMessage = createError instanceof Error ? createError.message : String(createError);
        const createErrorStatus = (createError as { status?: number })?.status;

        // Handle race condition: Webhook or other synchronous flow already created the subscription
        if (createErrorMessage.includes('duplicate key') || createErrorMessage.includes('23505') || createErrorStatus === 409) {
          console.log('[VerifyPayment] Subscription already created (duplicate caught). Order fulfilled asynchronously. Syncing shadow cache before return.');

          try {
            await syncUserShadow(supabase, user.id, (typeof body.email === 'string' ? body.email : undefined) || user.email);
            const syncData = await ssoSyncSubscription(env, user.id);
            if (syncData.subscription) {
              await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
            }
          } catch (syncError) {
            console.error('[VerifyPayment] Shadow sync failed during duplicate handling:', syncError);
          }

          return apiSuccess({
            payment_verified: true,
            subscription_created: true,
            already_fulfilled: true,
            ...verifyResult,
          }, context.request);
        }

        console.error('[VerifyPayment] Subscription creation failed:', createErrorMessage);

        return apiSuccess({
          payment_verified: true,
          subscription_created: false,
          ...verifyResult,
          error: {
            code: 'SUBSCRIPTION_CREATE_FAILED',
            message: 'Payment verified but subscription creation failed. Please contact support.',
            details: createErrorMessage,
          },
        }, context.request, 207);
      }
    }

    // Step 3: Record payment transaction in auth DB
    try {
      await ssoRecordTransaction(env, {
        subscription_id: subscription.id as string,
        user_id: user.id,
        razorpay_payment_id: body.razorpay_payment_id as string,
        razorpay_order_id: body.razorpay_order_id as string,
        razorpay_signature: body.razorpay_signature as string,
        amount: planPrice,
        currency: 'INR',
        status: 'completed',
        transaction_type: isUpgrade ? 'upgrade' : 'subscription',
        payment_method: payment.method,
      });
    } catch (txError: unknown) {
      const txErrorMessage = txError instanceof Error ? txError.message : String(txError);
      const txErrorStatus = (txError as { status?: number })?.status;

      if (txErrorMessage.includes('duplicate key') || txErrorMessage.includes('23505') || txErrorStatus === 409) {
        console.log('[VerifyPayment] Transaction already recorded (duplicate caught). Skipping further duplicate handling.');
      } else {
        console.error('[VerifyPayment] Transaction recording failed (non-critical):', txError);
      }
    }

    // Step 3.5: Sync shadow table in app DB
    try {
      // Ensure user exists in users_shadow (FK constraint for subscription_cache)
      await syncUserShadow(supabase, user.id, (typeof body.email === 'string' ? body.email : undefined) || user.email);

      const syncData = await ssoSyncSubscription(env, user.id);
      if (syncData.subscription) {
        await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
      }
    } catch (syncError) {
      console.error('[VerifyPayment] Shadow sync failed (non-critical):', syncError);
    }

    // users.phone is the source of truth for phone numbers (subscriptions.phone
    // no longer exists); fetched once here and reused for the email step below.
    const { data: userRecordForContact } = await supabase
      .from('users')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle();
    const contactPhone = userRecordForContact?.phone || undefined;

    // Step 4: Generate receipt PDF and upload to R2 (unchanged)
    let receiptUrl: string | null = null;
    let receiptKey: string | null = null;
    try {
      const pagesEnv = env as unknown as PagesEnv;

      const { data: learner } = await supabase
        .from('learners')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();

      const logoUrl = `${APP_URL}/RareMinds ISO Logo-01.png`;
      const logoBytes: Uint8Array | undefined = await fetchImageBytes(logoUrl);
      const watermarkBytes = logoBytes;

      const receiptData: ReceiptData = {
        transaction: {
          payment_id: body.razorpay_payment_id as string,
          order_id: body.razorpay_order_id as string,
          amount: planPrice,
          currency: 'INR',
          payment_method: payment.method || 'Card',
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
          phone: contactPhone,
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

      const shortUserId = user.id.substring(0, 8);
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
        phone: contactPhone || '',
        amount: planPrice,
        orderId: body.razorpay_order_id as string,
        campaign: subscription.plan_type as string,
        receiptUrl: receiptUrl || undefined,
      });
    } catch (emailErr) {
      console.error('[VerifyPayment] Email failed (non-critical):', emailErr);
    }

    return apiSuccess({
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
    }, context.request);
  } catch (error) {
    console.error('[VerifyPayment] Error:', error);
    return rpcErrorResponse(error, context.request);
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
