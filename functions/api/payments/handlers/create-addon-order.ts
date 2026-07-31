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
import { createLogger } from '../../../lib/logger';
import { apiError, apiSuccess } from '../../../lib/response';
import { ssoGetAddonByFeatureKey } from '../../../lib/sso-client';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';

const logger = createLogger('payments:create-addon-order');

export async function handleCreateAddonOrder(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher };

  try {
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    if (!body.feature_key || typeof body.feature_key !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'feature_key is required', context.request);
    }

    if (!body.billing_period || typeof body.billing_period !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'billing_period is required', context.request);
    }

    // Look up addon from SSO Auth DB to get server-side price using True RPC
    let addon: Record<string, any>;
    try {
      addon = await ssoGetAddonByFeatureKey(env as any, body.feature_key as string);
    } catch (err: any) {
      logger.error('Addon lookup failed', { feature_key: body.feature_key, error: err });
      return apiError(404, 'NOT_FOUND', 'Addon not found or inactive', context.request);
    }

    // DB stores prices in rupees (1999.00 = ₹1,999); Razorpay expects paise
    const amount = Math.round((body.billing_period === 'annual'
      ? safeParseFloat(addon.price_annual, 0)
      : safeParseFloat(addon.price_monthly, 0)) * 100);

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      logger.error('Invalid addon price', { feature_key: body.feature_key, amount });
      return apiError(400, 'VALIDATION_ERROR', 'Addon price is invalid', context.request);
    }

    const worker = getPaymentWorker(env);
    const order = await worker.createOrder({
      amount,
      currency: (body.currency as string) || undefined,
      notes: {
        feature_key: body.feature_key as string,
        addon_id: addon.id,
        addon_name: addon.feature_name,
        user_id: user.id,
        user_email: (body.user_email as string) || user.email || '',
        billing_period: body.billing_period as string,
        type: 'addon',
      },
    });

    if (!order.key_id) {
      logger.error('Payment worker did not return key_id');
      return apiError(500, 'INTERNAL_ERROR', 'Payment worker configuration error', context.request);
    }

    return apiSuccess({ ...order, razorpay_key_id: order.key_id }, context.request);
  } catch (error) {
    logger.error('Error creating addon order', error);
    return rpcErrorResponse(error, context.request);
  }
}
