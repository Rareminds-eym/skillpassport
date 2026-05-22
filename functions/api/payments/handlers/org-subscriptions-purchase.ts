/**
 * Org Subscriptions Purchase Handler
 *
 * POST /api/payments/org-subscriptions/purchase
 *
 * Creates a Razorpay order for an organization subscription purchase
 * via the payment-worker RPC binding.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';

export async function handleOrgSubscriptionsPurchase(context: AuthenticatedContext): Promise<Response> {
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

    if (!body.org_id || typeof body.org_id !== 'string') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'org_id is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.seat_count || typeof body.seat_count !== 'number') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'seat_count is required and must be a number' } }),
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
      notes: {
        org_id: body.org_id as string,
        plan_name: (body.plan_name as string) || '',
        plan_id: (body.plan_id as string) || '',
        seat_count: String(body.seat_count),
        user_id: user.sub,
        type: 'org_subscription',
      },
    });

    // Return order with Razorpay key for frontend checkout initialization
    return new Response(JSON.stringify({ ...order, key: env.RAZORPAY_KEY_ID }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[OrgSubscriptionsPurchase] Error:', error);
    return rpcErrorResponse(error);
  }
}
