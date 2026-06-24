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
import { createLogger } from '../../../lib/logger';
import { apiError, apiSuccess } from '../../../lib/response';
import { getServiceClient } from '../../../lib/supabase';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';

const logger = createLogger('payments:create-bundle-order');

export async function handleCreateBundleOrder(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv;

  try {
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    if (!body.bundle_id || typeof body.bundle_id !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'bundle_id is required', context.request);
    }

    if (!body.billing_period || typeof body.billing_period !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'billing_period is required', context.request);
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
      return apiError(404, 'NOT_FOUND', 'Bundle not found or inactive', context.request);
    }

    // DB stores prices in rupees (3558.40 = ₹3,558.40); Razorpay expects paise
    const amount = Math.round((body.billing_period === 'annual'
      ? safeParseFloat(bundle.annual_price, 0)
      : safeParseFloat(bundle.monthly_price, 0)) * 100);

    if (typeof amount !== 'number' || amount <= 0) {
      logger.error('Invalid bundle price', { bundle_id: body.bundle_id, amount });
      return apiError(400, 'VALIDATION_ERROR', 'Bundle price is invalid', context.request);
    }

    const worker = getPaymentWorker(env);
    const order = await worker.createOrder({
      amount,
      currency: (body.currency as string) || undefined,
      notes: {
        bundle_id: body.bundle_id as string,
        bundle_name: bundle.name,
        user_id: user.id,
        billing_period: body.billing_period as string,
        type: 'bundle',
      },
    });

    if (!order.key_id) {
      logger.error('Payment worker did not return key_id');
      return apiError(500, 'INTERNAL_ERROR', 'Payment worker configuration error', context.request);
    }

    return apiSuccess({ ...order, razorpay_key_id: order.key_id }, context.request);
  } catch (error) {
    logger.error('Error creating bundle order', error);
    return rpcErrorResponse(error, context.request);
  }
}
