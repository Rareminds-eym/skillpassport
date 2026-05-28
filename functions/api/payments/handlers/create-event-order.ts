/**
 * Create Event Order Handler
 *
 * POST /api/payments/create-event-order
 *
 * Creates a Razorpay order for an event registration via the payment-worker RPC binding.
 * Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { createLogger } from '../../../lib/logger';
import { apiSuccess, apiError } from '../../../lib/response';

const logger = createLogger('payments:create-event-order');

export async function handleCreateEventOrder(context: AuthenticatedContext): Promise<Response> {
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

    if (!body.registrationId || typeof body.registrationId !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'registrationId is required', context.request);
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
        user_id: user.id,
        type: 'event',
      },
    });

    // Validate that payment worker returned key_id
    if (!order.key_id) {
      logger.error('Payment worker did not return key_id');
      return apiError(500, 'INTERNAL_ERROR', 'Payment worker configuration error', context.request);
    }

    // Return order with key_id from payment worker and registrationId
    return apiSuccess({ ...order, razorpay_key_id: order.key_id, registrationId: body.registrationId }, context.request);
  } catch (error) {
    logger.error('Error creating event order', error);
    return rpcErrorResponse(error, context.request);
  }
}
