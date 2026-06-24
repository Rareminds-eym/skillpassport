/**
 * Verify Addon Payment Handler
 *
 * POST /api/payments/verify-addon-payment
 *
 * Verifies a Razorpay payment signature via the payment-worker RPC binding,
 * then creates an addon purchase record in Supabase.
 * Requires SSO authentication.
 *
 * Flow:
 * 1. Worker verifies HMAC signature via RPC (cryptographic guarantee)
 * 2. Pages Function creates addon purchase record in DB (worker has no DB access)
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import { ssoRecordTransaction, ssoRecordAddonPurchase } from '../../../lib/sso-client';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleVerifyAddonPayment(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher; SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    // Validate required fields for Razorpay verification
    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return apiError(400, 'VALIDATION_ERROR', 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required', context.request);
    }

    // Validate addon details
    if (!body.feature_key) {
      return apiError(400, 'VALIDATION_ERROR', 'feature_key is required', context.request);
    }

    // Step 1: Call payment-worker via RPC to verify HMAC signature
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

    // Parameter Tampering Prevention: Ensure the item they are requesting matches the item they created the order for
    if (payment.notes?.feature_key && payment.notes.feature_key !== body.feature_key) {
      return apiError(400, 'VALIDATION_ERROR', 'Feature key mismatch with original order', context.request);
    }

    if (!body.billing_period || typeof body.billing_period !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'billing_period is required', context.request);
    }

    // payment.amount is in paise (from authoritative Razorpay API); DB columns expect rupees
    const priceAtPurchase = payment.amount / 100;
    const billingPeriod = body.billing_period as string;

    // Step 2: Record purchase in Auth DB via SSO Worker RPC
    try {
      await ssoRecordAddonPurchase(env, {
        user_id: user.id,
        feature_key: body.feature_key as string,
        billing_period: billingPeriod,
        price_at_purchase: priceAtPurchase,
        razorpay_order_id: body.razorpay_order_id as string,
        razorpay_payment_id: body.razorpay_payment_id as string,
        razorpay_signature: body.razorpay_signature as string,
      });
    } catch (rpcError: any) {
      if (rpcError.message?.includes('duplicate key') || rpcError.message?.includes('23505') || rpcError.status === 409) {
        console.log('[VerifyAddonPayment] Addon purchase already recorded by webhook (duplicate caught). Continuing to ensure local entitlement exists.');
      } else {
        console.error('[VerifyAddonPayment] SSO Worker failed to record purchase:', rpcError.message);
        return apiError(500, 'SSO_ERROR', 'Failed to record addon purchase in auth DB', context.request);
      }
    }

    // Step 3: Grant App DB entitlement locally for immediate access
    const supabase = getServiceClient(env);
    const endDate = new Date();
    if (billingPeriod === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);

    const { data: entitlement, error: entError } = await supabase.from('user_entitlements').upsert({
      user_id: user.id,
      feature_key: body.feature_key as string,
      status: 'active',
      billing_period: billingPeriod,
      price_at_purchase: priceAtPurchase,
      razorpay_subscription_id: `${body.razorpay_order_id}_${body.feature_key}`,
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString()
    }, { onConflict: 'razorpay_subscription_id' }).select().single();

    if (entError) {
      console.error('[VerifyAddonPayment] Failed to create user entitlement:', entError);
      return apiError(500, 'DATABASE_ERROR', 'Failed to create user entitlement', context.request);
    }

    // Record transaction in auth DB (non-blocking)
    try {
      await ssoRecordTransaction(env, {
        user_id: user.id,
        razorpay_payment_id: body.razorpay_payment_id as string,
        razorpay_order_id: body.razorpay_order_id as string,
        razorpay_signature: body.razorpay_signature as string,
        amount: priceAtPurchase,
        currency: (body.currency as string) || 'INR',
        status: 'completed',
        transaction_type: 'addon',
        payment_method: payment.method,
        metadata: { feature_key: body.feature_key },
      });
    } catch (txError) {
      console.error('[VerifyAddonPayment] Transaction recording in auth DB failed:', txError);
    }

    return apiSuccess({ ...verifyResult, purchase_created: true, purchase: entitlement ? { id: entitlement.id, feature_key: entitlement.feature_key, status: entitlement.status } : null }, context.request);
  } catch (error) {
    console.error('[VerifyAddonPayment] Error:', error);
    return rpcErrorResponse(error, context.request);
  }
}
