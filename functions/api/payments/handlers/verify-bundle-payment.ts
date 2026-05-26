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

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import { ssoRecordTransaction } from '../../../lib/sso-client';

export async function handleVerifyBundlePayment(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher; SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

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

    // Validate bundle details
    if (!body.bundle_id) {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'bundle_id is required' },
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

    if (!body.billing_period || typeof body.billing_period !== 'string') {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'billing_period is required' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const priceAtPurchase = typeof body.amount === 'number' ? body.amount / 100 : 0;
    const billingPeriod = body.billing_period as string;

    // Step 2: Record purchase in Auth DB via SSO Worker RPC
    try {
      await env.SSO_SERVICE.recordBundlePurchase({
        user_id: user.sub,
        bundle_id: body.bundle_id as string,
        billing_period: billingPeriod,
        price_at_purchase: priceAtPurchase,
        razorpay_order_id: body.razorpay_order_id as string,
        razorpay_payment_id: body.razorpay_payment_id as string,
        razorpay_signature: body.razorpay_signature as string,
      });
    } catch (rpcError: any) {
      console.error('[VerifyBundlePayment] SSO Worker failed to record purchase:', rpcError.message);
    }

    // Step 3: Grant App DB entitlement locally for immediate access
    const supabase = getServiceClient(env);
    const endDate = new Date();
    if (billingPeriod === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);

    const { data: entitlement, error: entError } = await supabase.from('user_entitlements').insert({
      user_id: user.sub,
      bundle_id: body.bundle_id as string,
      status: 'active',
      billing_period: billingPeriod,
      price_at_purchase: priceAtPurchase,
      razorpay_subscription_id: body.razorpay_order_id as string,
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString()
    }).select().single();

    if (entError) {
      console.error('[VerifyBundlePayment] Failed to create user entitlement:', entError);
    }

    // Record transaction in auth DB (non-blocking)
    try {
      await ssoRecordTransaction(env, {
        user_id: user.sub,
        razorpay_payment_id: body.razorpay_payment_id as string,
        razorpay_order_id: body.razorpay_order_id as string,
        amount: priceAtPurchase,
        currency: (body.currency as string) || 'INR',
        status: 'success',
        transaction_type: 'bundle',
        metadata: { bundle_id: body.bundle_id },
      });
    } catch (txError) {
      console.error('[VerifyBundlePayment] Transaction recording in auth DB failed:', txError);
    }

    return new Response(JSON.stringify({
      success: true,
      ...verifyResult,
      purchase_created: true,
      purchase: entitlement ? {
        id: entitlement.id,
        bundle_id: entitlement.bundle_id,
        status: entitlement.status,
      } : null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[VerifyBundlePayment] Error:', error);
    return rpcErrorResponse(error);
  }
}
