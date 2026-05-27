/**
 * Create Addon Order Handler
 *
 * POST /api/payments/create-addon-order
 *
 * Accepts a feature_key and billing_period, looks up the addon from
 * the SSO Auth DB (via SSO worker) to get the correct price (server-side),
 * then creates a Razorpay order via the payment-worker RPC binding.
 * Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { createLogger } from '../../../lib/logger';
import { ssoFetch } from '../../../lib/sso-client';

const logger = createLogger('payments:create-addon-order');

export async function handleCreateAddonOrder(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher };

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

    if (!body.feature_key || typeof body.feature_key !== 'string') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'feature_key is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.billing_period || typeof body.billing_period !== 'string') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'billing_period is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Look up addon from SSO Auth DB to get server-side price
    const ssoUrl = new URL(`http://sso-worker/api/addon-catalog/${encodeURIComponent(body.feature_key as string)}`);
    const ssoResponse = await ssoFetch(env as any, new Request(ssoUrl.toString(), { method: 'GET' }));

    if (!ssoResponse.ok) {
      logger.error('Addon lookup failed', { feature_key: body.feature_key, status: ssoResponse.status });
      return new Response(
        JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Addon not found or inactive' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const addon = await ssoResponse.json() as Record<string, any>;

    // DB stores prices in rupees (1999.00 = ₹1,999); Razorpay expects paise
    const amount = Math.round((body.billing_period === 'annual'
      ? parseFloat(addon.price_annual)
      : parseFloat(addon.price_monthly)) * 100);

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      logger.error('Invalid addon price', { feature_key: body.feature_key, amount });
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Addon price is invalid' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const worker = getPaymentWorker(env);
    const order = await worker.createOrder({
      amount,
      currency: (body.currency as string) || undefined,
      notes: {
        addon_id: addon.id,
        addon_name: addon.feature_name,
        user_id: user.id,
        user_email: (body.user_email as string) || user.email || '',
        type: 'addon',
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
    logger.error('Error creating addon order', error);
    return rpcErrorResponse(error);
  }
}
