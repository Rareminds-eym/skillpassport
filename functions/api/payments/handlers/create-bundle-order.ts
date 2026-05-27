/**
 * Create Bundle Order Handler
 *
 * POST /api/payments/create-bundle-order
 *
 * Accepts a bundle_id and billing_period, looks up the bundle from
 * the database to get the correct price (server-side), then creates
 * a Razorpay order via the payment-worker RPC binding.
 * Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('payments:create-bundle-order');

export async function handleCreateBundleOrder(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv;

  try {
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.bundle_id || typeof body.bundle_id !== 'string') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'bundle_id is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.billing_period || typeof body.billing_period !== 'string') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'billing_period is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceClient(env);

    const { data: bundle, error: lookupError } = await supabase
      .from('bundles')
      .select('id, name, monthly_price, annual_price')
      .eq('id', body.bundle_id)
      .eq('is_active', true)
      .single();

    if (lookupError || !bundle) {
      logger.error('Bundle not found', { bundle_id: body.bundle_id, error: lookupError });
      return new Response(
        JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Bundle not found or inactive' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DB stores prices in rupees (3558.40 = ₹3,558.40); Razorpay expects paise
    const amount = Math.round((body.billing_period === 'annual'
      ? parseFloat(bundle.annual_price)
      : parseFloat(bundle.monthly_price)) * 100);

    if (typeof amount !== 'number' || amount <= 0) {
      logger.error('Invalid bundle price', { bundle_id: body.bundle_id, amount });
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Bundle price is invalid' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const worker = getPaymentWorker(env);
    const order = await worker.createOrder({
      amount,
      currency: (body.currency as string) || undefined,
      notes: {
        bundle_id: body.bundle_id as string,
        bundle_name: bundle.name,
        user_id: user.id,
        type: 'bundle',
      },
    });

    if (!order.key_id) {
      logger.error('Payment worker did not return key_id');
      return new Response(
        JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Payment worker configuration error' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({
      ...order,
      razorpay_key_id: order.key_id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Error creating bundle order', error);
    return rpcErrorResponse(error);
  }
}
