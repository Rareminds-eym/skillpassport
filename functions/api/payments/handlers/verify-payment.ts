/**
 * Verify Payment Handler
 *
 * POST /api/payments/verify-payment
 *
 * Verifies a Razorpay payment signature via the payment-worker RPC binding,
 * then creates a subscription and payment transaction in Supabase.
 * Requires SSO authentication.
 *
 * Flow:
 * 1. Worker verifies HMAC signature via RPC (cryptographic guarantee)
 * 2. Pages Function creates subscription in DB (worker has no DB access)
 * 3. Pages Function logs payment transaction
 * 4. Pages Function generates receipt PDF and uploads to R2
 * 5. Pages Function sends payment confirmation email
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
// Cache invalidation removed - KV dependency eliminated

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleVerifyPayment(context);
});

export async function handleVerifyPayment(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as unknown as PaymentWorkerEnv;

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields for Razorpay verification
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

    // Step 1: Call payment-worker via RPC to verify HMAC signature
    const worker = getPaymentWorker(env);
    const verifyResult = await worker.verifyPaymentSignature(
      body.razorpay_order_id as string,
      body.razorpay_payment_id as string,
      body.razorpay_signature as string
    );

    // Step 2: Signature is valid — create or update subscription in Supabase
    // The worker only verifies the signature; it has no database access.
    const plan = body.plan as Record<string, unknown> | undefined;
    if (!plan || !plan.id || !plan.name || !plan.price || !plan.duration) {
      // Signature verified but no plan data — return verification result without subscription
      console.warn('[VerifyPayment] Signature verified but no plan data provided — subscription not created');
      return new Response(JSON.stringify({ success: true, ...verifyResult }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getServiceClient(env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });

    // Step 2.5: Validate plan exists and is active (server-side validation)
    const { data: validPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, plan_code, name, is_active')
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

    // Calculate subscription dates
    const now = new Date();
    const endDate = new Date(now);
    const durationMonths = parseDurationMonths(plan.duration as string);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Check if user has an existing active subscription (including Freemium)
    const { data: existingSubscription, error: existingError } = await supabase
      .from('subscriptions')
      .select('id, status, plan_id, subscription_plans(plan_code)')
      .eq('user_id', user.sub)
      .eq('status', 'active')
      .maybeSingle();

    if (existingError) {
      console.error('[VerifyPayment] Error checking existing subscription:', existingError);
    }

    let subscription;
    let subError;
    let isUpgrade = false;
    let originalSubscriptionState: any = null;

    // If user has an existing subscription, update it (upgrade flow)
    if (existingSubscription) {
      isUpgrade = true;
      console.log('[VerifyPayment] Upgrading existing subscription:', existingSubscription.id);

      // Store original subscription state for rollback
      originalSubscriptionState = { ...existingSubscription };

      // Validate upgrade direction - fetch current plan details
      const { data: currentPlan, error: currentPlanError } = await supabase
        .from('subscription_plans')
        .select('plan_code, pricing_matrix, plan_amount')
        .eq('id', existingSubscription.plan_id)
        .single();

      if (!currentPlanError && currentPlan) {
        // Get pricing from pricing_matrix or fallback to plan_amount
        const currentPrice = currentPlan.pricing_matrix?.annual || currentPlan.plan_amount || 0;
        const newPrice = parseFloat(String(plan.price));

        // Prevent downgrades or lateral moves (must be a genuine upgrade)
        if (newPrice <= currentPrice) {
          console.warn('[VerifyPayment] Invalid upgrade attempt - downgrade or lateral move blocked:', {
            currentPlan: currentPlan.plan_code,
            currentPrice,
            newPrice,
            userId: user.sub,
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
        const { data: updatedSub, error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_type: plan.name,
            plan_amount: parseFloat(String(plan.price)),
            billing_cycle: plan.duration,
            razorpay_order_id: body.razorpay_order_id,
            razorpay_payment_id: body.razorpay_payment_id,
            subscription_start_date: now.toISOString(),
            subscription_end_date: endDate.toISOString(),
            plan_id: plan.id,
            auto_renew: true,
            updated_at: now.toISOString(),
          })
          .eq('id', existingSubscription.id)
          .select()
          .single();

        if (updateError) throw updateError;

        subscription = updatedSub;
        subError = null;
      } catch (error) {
        // Upgrade failed - log for manual intervention
        subError = error;

        // Log failed upgrade to database
        const { data: failedUpgradeLog } = await supabase
          .from('failed_upgrades')
          .insert({
            user_id: user.sub,
            subscription_id: existingSubscription.id,
            razorpay_order_id: body.razorpay_order_id as string,
            razorpay_payment_id: body.razorpay_payment_id as string,
            original_plan_id: existingSubscription.plan_id,
            target_plan_id: plan.id as string,
            amount_paid: parseFloat(String(plan.price)),
            error_message: error instanceof Error ? error.message : String(error),
            error_details: {
              timestamp: new Date().toISOString(),
              endpoint: '/api/payments/verify-payment',
              originalState: originalSubscriptionState,
              targetPlan: plan,
            },
            resolution_status: 'pending',
          })
          .select('id')
          .single();

        const supportTicketId = failedUpgradeLog?.id || 'MANUAL_REVIEW_REQUIRED';

        console.error('[VerifyPayment] Upgrade failed - logged for manual intervention:', {
          userId: user.sub,
          subscriptionId: existingSubscription.id,
          supportTicketId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      // No existing subscription, create new one
      console.log('[VerifyPayment] Creating new subscription for user:', user.sub);

      const { data: newSub, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.sub,
          full_name: (user as unknown as Record<string, unknown>).name as string || user.email || '',
          email: user.email || '',
          phone: (user as unknown as Record<string, unknown>).phone as string || null,
          plan_type: plan.name,
          plan_amount: parseFloat(String(plan.price)),
          billing_cycle: plan.duration,
          razorpay_order_id: body.razorpay_order_id,
          razorpay_payment_id: body.razorpay_payment_id,
          status: 'active',
          auto_renew: true,
          subscription_start_date: now.toISOString(),
          subscription_end_date: endDate.toISOString(),
          plan_id: plan.id,
          is_organization_subscription: false,
          seat_count: 1,
        })
        .select()
        .single();

      subscription = newSub;
      subError = insertError;
    }

    if (subError) {
      console.error('[VerifyPayment] Failed to create/update subscription:', subError);

      // For upgrades, we've already logged to failed_upgrades table
      // For new subscriptions, log error with context
      if (!isUpgrade) {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          userId: user.sub,
          errorType: 'SUBSCRIPTION_CREATION_FAILED',
          errorMessage: 'Payment verified but subscription creation failed',
          context: {
            planCode: plan.plan_code || plan.name,
            endpoint: '/api/payments/verify-payment',
            statusCode: 207,
            razorpay_order_id: body.razorpay_order_id,
            razorpay_payment_id: body.razorpay_payment_id,
            dbError: subError.message,
          },
        }));
      }

      // Signature is verified but subscription operation failed — return partial success (207)
      return new Response(JSON.stringify({
        success: true,
        payment_verified: true,
        subscription_created: false,
        subscription_upgraded: isUpgrade ? false : undefined,
        ...verifyResult,
        error: {
          code: isUpgrade ? 'UPGRADE_FAILED' : 'SUBSCRIPTION_CREATE_FAILED',
          message: isUpgrade
            ? 'Payment verified but upgrade failed. Support will contact you within 24 hours.'
            : 'Payment verified but subscription creation failed. Please contact support.',
          support_ticket_id: isUpgrade && originalSubscriptionState
            ? 'Check failed_upgrades table'
            : undefined,
          details: subError.message,
        },
      }), {
        status: 207, // Multi-Status: partial success
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Log payment transaction
    await supabase
      .from('payment_transactions')
      .insert({
        subscription_id: subscription.id,
        user_id: user.sub,
        razorpay_payment_id: body.razorpay_payment_id,
        razorpay_order_id: body.razorpay_order_id,
        amount: parseFloat(String(plan.price)),
        currency: 'INR',
        status: 'completed',
        transaction_type: isUpgrade ? 'upgrade' : 'subscription',
        is_bulk_purchase: false,
        seat_count: 1,
      });

    // Step 4: Generate receipt PDF server-side and upload to R2
    // Non-blocking — a receipt failure must never fail the payment response.
    let receiptUrl: string | null = null;
    let receiptKey: string | null = null;
    try {
      const pagesEnv = env as unknown as PagesEnv;
      const appUrl = pagesEnv.APP_URL;

      if (!appUrl) {
        console.warn('[VerifyPayment] APP_URL not configured in environment — receipt will render without images');
      }

      // Fetch the learner's real name from the learners table
      const { data: learner } = await supabase
        .from('learners')
        .select('name')
        .eq('user_id', user.sub)
        .maybeSingle();

      let logoBytes: Uint8Array | undefined;
      if (appUrl) {
        const logoUrl = `${appUrl}/RareMinds ISO Logo-01.png`;
        console.log('[VerifyPayment] Fetching logo from:', logoUrl);
        logoBytes = await fetchImageBytes(logoUrl);
        if (!logoBytes) {
          console.warn('[VerifyPayment] Failed to fetch logo image from:', logoUrl);
        }
      }
      const watermarkBytes = logoBytes;

      const receiptData: ReceiptData = {
        transaction: {
          payment_id: body.razorpay_payment_id as string,
          order_id: body.razorpay_order_id as string,
          amount: parseFloat(String(plan.price)),
          currency: 'INR',
          payment_method: 'Card',
          payment_timestamp: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: 'Success',
        },
        subscription: {
          plan_name: subscription.plan_type,
          plan_type: subscription.plan_type,
          billing_cycle: subscription.billing_cycle,
          subscription_start_date: subscription.subscription_start_date,
          subscription_end_date: subscription.subscription_end_date,
        },
        user: {
          name: learner?.name || subscription.full_name || '',
          email: subscription.email || user.email || '',
          phone: subscription.phone || undefined,
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

      // Build R2 key: payment_pdf/user_{userId8}/{paymentId}_{timestamp}.pdf
      const shortUserId = user.sub.substring(0, 8);
      const sanitizedPmtId = (body.razorpay_payment_id as string).replace(/[^a-zA-Z0-9_-]/g, '');
      const timestamp = Date.now();
      receiptKey = `payment_pdf/user_${shortUserId}/${sanitizedPmtId}_${timestamp}.pdf`;
      const filename = `Receipt-${sanitizedPmtId.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;

      const r2 = new R2Client(pagesEnv);
      receiptUrl = await r2.upload(receiptKey, pdfBytes.buffer as ArrayBuffer, 'application/pdf', {
        'Content-Disposition': `attachment; filename="${filename}"`,
      });

      // Generate a presigned URL for secure access (valid for 7 days)
      receiptUrl = await r2.generatePresignedGetUrl(receiptKey, 604800); // 7 days = 604800 seconds

      console.log('[VerifyPayment] Receipt uploaded:', receiptUrl);
    } catch (receiptErr) {
      // Receipt generation is non-critical — log and continue
      console.error('[VerifyPayment] Receipt generation failed (non-critical):', receiptErr);
    }

    // Step 5: Send payment confirmation email
    // Non-blocking — email failure must never fail the payment response
    try {
      await sendPaymentSuccessEmail(env as unknown as PagesEnv, {
        name: subscription.full_name,
        email: subscription.email,
        phone: subscription.phone || '',
        amount: parseFloat(String(plan.price)),
        orderId: body.razorpay_order_id as string,
        campaign: subscription.plan_type,
        receiptUrl: receiptUrl || undefined, // Pass the R2 receipt URL
      });
      console.log('[VerifyPayment] Payment confirmation email sent successfully');
    } catch (emailErr) {
      // Email sending is non-critical — log and continue
      console.error('[VerifyPayment] Failed to send payment confirmation email (non-critical):', emailErr);
    }

    // Cache invalidation removed - KV dependency eliminated
    // Client-side queries will refetch data as needed

    // Return combined result
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

/**
 * Parse a duration string like "monthly", "annual", "yearly" into months
 */
function parseDurationMonths(duration: string): number {
  const lower = duration.toLowerCase();
  if (lower.includes('annual') || lower.includes('year')) return 12;
  if (lower.includes('quarter')) return 3;
  if (lower.includes('month')) return 1;
  return 1;
}

/**
 * Send payment success email via email worker
 */
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
    console.log('[VerifyPayment] Payment confirmation email sent successfully');
  } else {
    console.error('[VerifyPayment] Failed to send payment confirmation email (non-critical)');
  }
}
