/**
 * Create Addon Order Handler
 *
 * POST /api/payments/create-addon-order
 *
 * Creates a Razorpay order for an addon purchase via the payment-worker RPC binding.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('payments:create-addon-order');

export async function handleCreateAddonOrder(context: AuthenticatedContext): Promise<Response> {
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

    if (!body.addon_id || typeof body.addon_id !== 'string') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'addon_id is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.addon_name || typeof body.addon_name !== 'string') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'addon_name is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call payment-worker via Service Binding RPC
    const worker = getPaymentWorker(env);
    const order = await worker.createOrder({
      amount: body.amount as number,
      currency: (body.currency as string) || undefined,
      notes: {
        addon_id: body.addon_id as string,
        addon_name: body.addon_name as string,
        user_id: user.sub,
        user_email: (body.user_email as string) || user.email || '',
        type: 'addon',
      },
    });

    // Validate that payment worker returned key_id
    if (!order.key_id) {
      logger.error('Payment worker did not return key_id');
      return new Response(
        JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Payment worker configuration error' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return order with key_id from payment worker
    // The payment worker injects key_id to ensure it matches the key used to create the order
    return new Response(JSON.stringify({
      ...order,
      razorpay_key_id: order.key_id, // Expose as razorpay_key_id for frontend
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Error creating addon order', error);
    return rpcErrorResponse(error);
  }
}
