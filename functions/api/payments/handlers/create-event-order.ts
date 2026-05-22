/**
 * Create Event Order Handler
 *
 * POST /api/payments/create-event-order
 *
 * Creates a Razorpay order for an event registration via the payment-worker RPC binding.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';

export async function handleCreateEventOrder(context: AuthenticatedContext): Promise<Response> {
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

    if (!body.registrationId || typeof body.registrationId !== 'string') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'registrationId is required' } }),
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
        registration_id: body.registrationId as string,
        plan_name: (body.planName as string) || '',
        user_email: (body.userEmail as string) || user.email || '',
        user_name: (body.userName as string) || '',
        user_phone: (body.userPhone as string) || '',
        campaign: (body.campaign as string) || '',
        origin: (body.origin as string) || '',
        user_id: user.sub,
        type: 'event',
      },
    });

    // Return order with Razorpay key and registrationId for frontend checkout initialization
    return new Response(JSON.stringify({ ...order, key: env.RAZORPAY_KEY_ID, registrationId: body.registrationId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CreateEventOrder] Error:', error);
    return rpcErrorResponse(error);
  }
}
