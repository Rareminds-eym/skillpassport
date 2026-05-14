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
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import { invalidateUserSubscriptionCache } from '../../../shared/lib/cache';

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

    // If user has an existing subscription, update it (upgrade flow)
    if (existingSubscription) {
      isUpgrade = true;
      console.log('[VerifyPayment] Upgrading existing subscription:', existingSubscription.id);

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

      subscription = updatedSub;
      subError = updateError;
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
      
      // Log error with context
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: user.sub,
        errorType: isUpgrade ? 'UPGRADE_FAILED' : 'SUBSCRIPTION_CREATION_FAILED',
        errorMessage: `Payment verified but subscription ${isUpgrade ? 'upgrade' : 'creation'} failed`,
        context: {
          planCode: plan.plan_code || plan.name,
          endpoint: '/api/payments/verify-payment',
          statusCode: 207,
          razorpay_order_id: body.razorpay_order_id,
          razorpay_payment_id: body.razorpay_payment_id,
          dbError: subError.message,
        },
      }));
      
      // Signature is verified but subscription operation failed — return partial success (207)
      return new Response(JSON.stringify({
        success: true,
        ...verifyResult,
        subscription_created: false,
        error: {
          code: isUpgrade ? 'SUBSCRIPTION_UPGRADE_FAILED' : 'SUBSCRIPTION_CREATE_FAILED',
          message: `Payment verified but subscription ${isUpgrade ? 'upgrade' : 'creation'} failed. Please contact support.`,
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

    // Invalidate subscription cache for this user
    const cacheKV = (env as any).CACHE_KV as KVNamespace | undefined;
    await invalidateUserSubscriptionCache(cacheKV, user.sub);

    // Return combined result
    return new Response(JSON.stringify({
      success: true,
      ...verifyResult,
      subscription_created: true,
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
