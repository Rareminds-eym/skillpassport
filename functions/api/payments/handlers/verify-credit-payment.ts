/**
 * POST /api/payments/verify-credit-payment
 *
 * Verifies a Razorpay payment signature for a direct AI credit top-up purchase,
 * then atomically adds credits via add_ai_credits(type='purchase').
 * Requires SSO authentication.
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import { resolvePackage } from '../lib/creditPackages';
import { addCredits } from '../../credits/purchase';

interface Env extends PaymentWorkerEnv {
  SSO_SERVICE?: { recordTransaction: (data: unknown) => Promise<unknown> };
}

export async function handleVerifyCreditPayment(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env  = context.env as unknown as Env;

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, 400);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId, amount } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return json({ error: { code: 'INVALID_INPUT', message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required' } }, 400);
  }
  if (!packageId || typeof packageId !== 'string') {
    return json({ error: { code: 'INVALID_INPUT', message: 'packageId is required' } }, 400);
  }
  if (amount === undefined || typeof amount !== 'number') {
    return json({ error: { code: 'INVALID_INPUT', message: 'amount (paise) is required' } }, 400);
  }

  const supabase = getServiceClient(env);
  const pkg = await resolvePackage(supabase, packageId);

  if (!pkg) {
    return json({ error: { code: 'INVALID_PACKAGE', message: `Credit package '${packageId}' not found or inactive.` } }, 400);
  }

  if (amount !== Math.round(pkg.price_inr * 100)) {
    return json({ error: { code: 'PRICE_MISMATCH', message: 'Package price does not match. Please refresh and try again.' } }, 400);
  }

  try {
    // Step 1: Verify HMAC signature via PAYMENT_WORKER binding
    const worker = getPaymentWorker(env);
    const verifyResult = await worker.verifyPaymentSignature(
      razorpay_order_id   as string,
      razorpay_payment_id as string,
      razorpay_signature  as string
    );

    // Step 2: Add credits atomically — idempotent by razorpay_payment_id
    const creditResult = await addCredits(supabase, {
      userId:    user.sub,
      amount:    pkg.credits,
      eventId:   razorpay_payment_id as string,
      packageId: pkg.id,
      priceInr:  pkg.price_inr,
      label:     pkg.label,
    });

    // Step 3: Record in auth DB (non-blocking, best-effort)
    if (env.SSO_SERVICE) {
      env.SSO_SERVICE.recordTransaction({
        user_id:             user.sub,
        razorpay_payment_id: razorpay_payment_id as string,
        razorpay_order_id:   razorpay_order_id   as string,
        amount:              pkg.price_inr,
        currency:            'INR',
        status:              'completed',
        transaction_type:    'credit_purchase',
        metadata:            { package_id: pkg.id, credits: pkg.credits, label: pkg.label },
      }).catch((err: unknown) => {
        console.error('[VerifyCreditPayment] SSO transaction record failed (non-critical):', err);
      });
    }

    return json({
      success:        true,
      verified:       verifyResult.verified,
      credits_added:  creditResult.credits_added,
      balance_after:  creditResult.balance_after,
      transaction_id: creditResult.transaction_id,
      idempotent:     creditResult.idempotent,
      package: { id: pkg.id, credits: pkg.credits, price_inr: pkg.price_inr, label: pkg.label },
    });
  } catch (error) {
    console.error('[VerifyCreditPayment] Error:', error);
    return rpcErrorResponse(error);
  }
}
