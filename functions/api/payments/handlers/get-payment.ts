/**
 * Get Payment Handler
 *
 * GET /api/payments/payment/:id
 *
 * Gets payment details via the payment-worker RPC binding.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const paymentId = path.split('/').pop();

  if (!paymentId) {
    return new Response(
      JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Payment ID is required' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handleGetPayment(context, paymentId);
});

export async function handleGetPayment(context: AuthenticatedContext, paymentId: string): Promise<Response> {
  const env = context.env as unknown as PaymentWorkerEnv;

  try {
    // Call payment-worker via RPC — worker validates ID format and fetches from Razorpay
    const worker = getPaymentWorker(env);
    const payment = await worker.getPayment(paymentId);

    return new Response(JSON.stringify({ success: true, payment }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GetPayment] Error:', error);
    return rpcErrorResponse(error);
  }
}
