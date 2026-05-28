/**
 * Org Subscriptions Purchase Handler
 *
 * POST /api/payments/org-subscriptions/purchase
 *
 * Creates a Razorpay order for an organization subscription purchase
 * via the payment-worker RPC binding.
 * Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { createLogger } from '../../../lib/logger';
import { apiSuccess, apiError } from '../../../lib/response';

const logger = createLogger('payments:org-subscriptions-purchase');

export async function handleOrgSubscriptionsPurchase(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv;

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    // Validate required fields
    if (!body.amount || typeof body.amount !== 'number') {
      return apiError(400, 'VALIDATION_ERROR', 'amount is required and must be a number', context.request);
    }

    if (!body.org_id || typeof body.org_id !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'org_id is required', context.request);
    }

    if (!body.seat_count || typeof body.seat_count !== 'number') {
      return apiError(400, 'VALIDATION_ERROR', 'seat_count is required and must be a number', context.request);
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
        user_id: user.id,
        type: 'org_subscription',
      },
    });

    // Validate that payment worker returned key_id
    if (!order.key_id) {
      logger.error('Payment worker did not return key_id');
      return apiError(500, 'INTERNAL_ERROR', 'Payment worker configuration error', context.request);
    }

    // Return order with key_id from payment worker
    return apiSuccess({ ...order, razorpay_key_id: order.key_id }, context.request);
  } catch (error) {
    logger.error('Error creating org subscription order', error);
    return rpcErrorResponse(error, context.request);
  }
}
