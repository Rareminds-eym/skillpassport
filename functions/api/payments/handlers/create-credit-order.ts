/**
 * POST /api/payments/create-credit-order
 *
 * Creates a Razorpay order for a direct AI credit top-up purchase.
 * Validates the package server-side — never trusts client-supplied price.
 * Requires SSO authentication.
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import { resolvePackage } from '../lib/creditPackages';

export async function handleCreateCreditOrder(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env  = context.env as unknown as PaymentWorkerEnv;

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

  const { packageId, amount } = body;

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
    const worker  = getPaymentWorker(env);
    const receipt = `cr_${user.sub.slice(0, 8)}_${Date.now()}`.slice(0, 40);

    const order = await worker.createOrder({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        user_id:    user.sub,
        user_email: user.email || '',
        order_type: 'credit_purchase',
        package_id: pkg.id,
        credits:    String(pkg.credits),
      },
    });

    if (!order.key_id) {
      return json({ error: { code: 'INTERNAL_ERROR', message: 'Payment worker configuration error' } }, 500);
    }

    return json({
      ...order,
      razorpay_key_id: order.key_id,
      package: { id: pkg.id, credits: pkg.credits, price_inr: pkg.price_inr, label: pkg.label },
    });
  } catch (error) {
    console.error('[CreateCreditOrder] Error:', error);
    return rpcErrorResponse(error);
  }
}
