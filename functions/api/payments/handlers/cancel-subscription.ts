/**
 * Cancel Subscription Handler
 *
 * POST /api/payments/subscription/:id/cancel
 *
 * Cancels a Razorpay subscription via the payment-worker RPC binding.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const match = path.match(/\/subscription\/([^/]+)\/cancel/);
  const subscriptionId = match ? match[1] : null;

  if (!subscriptionId) {
    return new Response(
      JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Subscription ID is required' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handleCancelSubscription(context, subscriptionId);
});

export async function handleCancelSubscription(context: AuthenticatedContext, subscriptionId: string): Promise<Response> {
  const env = context.env as unknown as PaymentWorkerEnv;

  try {
    // Call payment-worker via RPC — worker validates ID format and calls Razorpay
    const worker = getPaymentWorker(env);
    const subscription = await worker.cancelSubscription(subscriptionId);

    return new Response(JSON.stringify({ success: true, subscription }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CancelSubscription] Error:', error);
    return rpcErrorResponse(error);
  }
}
