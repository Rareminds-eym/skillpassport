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

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleVerifyBundlePayment(context);
});

export async function handleVerifyBundlePayment(context: AuthenticatedContext): Promise<Response> {
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

    // Validate bundle details
    if (!body.bundle_id || !body.bundle_name) {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'bundle_id and bundle_name are required' },
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

    // Step 2: Signature is valid — create bundle purchase record in Supabase
    const supabase = getServiceClient(env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });

    const { data: purchase, error: purchaseError } = await supabase
      .from('bundle_purchases')
      .insert({
        user_id: user.sub,
        bundle_id: body.bundle_id,
        bundle_name: body.bundle_name,
        amount: body.amount || null,
        currency: (body.currency as string) || 'INR',
        razorpay_order_id: body.razorpay_order_id,
        razorpay_payment_id: body.razorpay_payment_id,
        status: 'completed',
        email: user.email || '',
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('[VerifyBundlePayment] Failed to create bundle purchase:', purchaseError);
      // Signature is verified but purchase creation failed — return partial success (207)
      return new Response(JSON.stringify({
        success: true,
        ...verifyResult,
        purchase_created: false,
        error: {
          code: 'PURCHASE_CREATE_FAILED',
          message: 'Payment verified but bundle purchase record creation failed. Please contact support.',
          details: purchaseError.message,
        },
      }), {
        status: 207,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return combined result
    return new Response(JSON.stringify({
      success: true,
      ...verifyResult,
      purchase_created: true,
      purchase: {
        id: purchase.id,
        bundle_id: purchase.bundle_id,
        bundle_name: purchase.bundle_name,
        status: purchase.status,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[VerifyBundlePayment] Error:', error);
    return rpcErrorResponse(error);
  }
}
