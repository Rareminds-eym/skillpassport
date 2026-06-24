/**
 * Verify Bundle Payment Handler
 *
 * POST /api/payments/verify-bundle-payment
 *
 * Verifies a Razorpay payment signature via the payment-worker RPC binding,
 * then creates a bundle purchase record in Supabase.
 * Requires SSO authentication.
 *
 * Flow:
 * 1. Worker verifies HMAC signature via RPC (cryptographic guarantee)
 * 2. Pages Function creates bundle purchase record in DB (worker has no DB access)
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import { ssoRecordTransaction, ssoRecordBundlePurchase } from '../../../lib/sso-client';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleVerifyBundlePayment(context: AuthenticatedContext): Promise<Response> {
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

    // Validate bundle details
    if (!body.bundle_id) {
      return apiError(400, 'VALIDATION_ERROR', 'bundle_id is required', context.request);
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

    // Parameter Tampering Prevention
    if (payment.notes?.bundle_id && payment.notes.bundle_id !== body.bundle_id) {
      return apiError(400, 'VALIDATION_ERROR', 'Bundle ID mismatch with original order', context.request);
    }

    if (!body.billing_period || typeof body.billing_period !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'billing_period is required', context.request);
    }

    const priceAtPurchase = payment.amount / 100;
    const billingPeriod = body.billing_period as string;

    // Step 2: Record purchase in Auth DB via SSO Worker RPC
    try {
      await ssoRecordBundlePurchase(env, {
        user_id: user.id,
        bundle_id: body.bundle_id as string,
        billing_period: billingPeriod,
        price_at_purchase: priceAtPurchase,
        razorpay_order_id: body.razorpay_order_id as string,
        razorpay_payment_id: body.razorpay_payment_id as string,
        razorpay_signature: body.razorpay_signature as string,
      });
    } catch (rpcError: any) {
      if (rpcError.message?.includes('duplicate key') || rpcError.message?.includes('23505') || rpcError.status === 409) {
        console.log('[VerifyBundlePayment] Bundle purchase already recorded by webhook (duplicate caught). Continuing to ensure local entitlements exist.');
      } else {
        console.error('[VerifyBundlePayment] SSO Worker failed to record purchase:', rpcError.message);
        return apiError(500, 'SSO_ERROR', 'Failed to record bundle purchase in auth DB', context.request);
      }
    }

    // Step 3: Grant App DB entitlement locally for immediate access
    const supabase = getServiceClient(env);
    const endDate = new Date();
    if (billingPeriod === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);

    // Fetch bundle features to explode into individual entitlements
    const { data: features } = await supabase
      .from('bundle_features')
      .select('feature_key')
      .eq('bundle_id', body.bundle_id as string);

    let entitlementToReturn = null;
    let entError = null;

    if (features && features.length > 0) {
      const entitlementsToInsert = features.map(f => ({
        user_id: user.id,
        feature_key: f.feature_key,
        bundle_id: body.bundle_id as string,
        status: 'active',
        billing_period: billingPeriod,
        price_at_purchase: priceAtPurchase,
        razorpay_subscription_id: `${body.razorpay_order_id}_${f.feature_key}`,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString()
      }));

      // Use upsert on razorpay_subscription_id unique constraint for idempotency
      const { data: inserted, error } = await supabase
        .from('user_entitlements')
        .upsert(entitlementsToInsert, { onConflict: 'razorpay_subscription_id' })
        .select();
        
      entError = error;
      if (inserted && inserted.length > 0) {
        entitlementToReturn = inserted[0];
      }
    } else {
      console.warn('[VerifyBundlePayment] Bundle has no features defined', { bundle_id: body.bundle_id });
    }

    if (entError) {
      console.error('[VerifyBundlePayment] Failed to create user entitlements:', entError);
      return apiError(500, 'DATABASE_ERROR', 'Failed to create user entitlements', context.request);
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
        transaction_type: 'bundle',
        payment_method: payment.method,
        metadata: { bundle_id: body.bundle_id },
      });
    } catch (txError) {
      console.error('[VerifyBundlePayment] Transaction recording in auth DB failed:', txError);
    }

    return apiSuccess({ ...verifyResult, purchase_created: true, purchase: entitlementToReturn ? { id: entitlementToReturn.id, bundle_id: entitlementToReturn.bundle_id, status: entitlementToReturn.status } : null }, context.request);
  } catch (error) {
    console.error('[VerifyBundlePayment] Error:', error);
    return rpcErrorResponse(error, context.request);
  }
}
