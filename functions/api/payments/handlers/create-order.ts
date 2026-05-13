/**
 * Create Order Handler
 *
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order via the payment-worker RPC binding.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleCreateOrder(context);
});

export async function handleCreateOrder(context: AuthenticatedContext): Promise<Response> {
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

    // Validate required fields
    if (!body.amount || typeof body.amount !== 'number') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'amount is required and must be a number' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ensure RAZORPAY_KEY_ID is available for frontend checkout
    if (!env.RAZORPAY_KEY_ID) {
      return new Response(
        JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'RAZORPAY_KEY_ID is not configured' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call payment-worker via Service Binding RPC
    const worker = getPaymentWorker(env);
    const order = await worker.createOrder({
      amount: body.amount as number,
      currency: (body.currency as string) || undefined,
      receipt: (body.receipt as string) || undefined,
      notes: {
        ...(body.notes as Record<string, string> || {}),
        user_id: user.sub,
        user_email: user.email || '',
        org_id: user.org_id || '',
      },
    });

    // Return flattened order with Razorpay key for frontend checkout initialization
    // The key is returned by the payment-worker to ensure it perfectly matches the key used to create the order.
    return new Response(JSON.stringify({ ...order, key: (order as any).key_id || env.RAZORPAY_KEY_ID }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CreateOrder] Error:', error);
    return rpcErrorResponse(error);
  }
}
