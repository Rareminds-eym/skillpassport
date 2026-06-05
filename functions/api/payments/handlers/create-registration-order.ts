/**
 * Create Registration Order Handler
 *
 * POST /api/payments/create-registration-order
 *
 * Creates a Razorpay order for learner/corporate registration.
 * Public endpoint - no authentication required (for registration flow).
 * Automatically generates registrationId and stores in pre_registrations table.
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import { createLogger } from '../../../lib/logger';
import { apiSuccess, apiError } from '../../../lib/response';

const logger = createLogger('payments:create-registration-order');

export const onRequestPost: PagesFunction = async (context) => {
  return handleCreateRegistrationOrder(context);
};

export async function handleCreateRegistrationOrder(context: any): Promise<Response> {
  // No user authentication required for registration
  const env = context.env as unknown as PaymentWorkerEnv & {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  };

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

    if (!body.userEmail || !body.userName || !body.userPhone) {
      return apiError(400, 'VALIDATION_ERROR', 'userEmail, userName, and userPhone are required', context.request);
    }

    // Create Supabase client
    const supabase = getServiceClient(env);

    // Create pre_registration record first
    const { data: preReg, error: insertError } = await supabase
      .from('pre_registrations')
      .insert({
        full_name: body.userName as string,
        email: (body.userEmail as string).toLowerCase(),
        phone: body.userPhone as string,
        amount: (body.amount as number) / 100, // Convert paise to rupees
        campaign: body.campaign as string || 'skill-passport',
        role_type: 'pre_registration',
        payment_status: 'pending',
        payment_history: [],
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('Database insert error', insertError);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to create registration record', context.request);
    }

    const registrationId = preReg.id;

    logger.info('Created pre_registration record', { registrationId });

    // Call payment-worker via Service Binding RPC
    const worker = getPaymentWorker(env);
    const order = await worker.createOrder({
      amount: body.amount as number,
      currency: (body.currency as string) || 'INR',
      notes: {
        registration_id: registrationId,
        plan_name: (body.planName as string) || '',
        user_email: (body.userEmail as string) || '',
        user_name: (body.userName as string) || '',
        user_phone: (body.userPhone as string) || '',
        campaign: (body.campaign as string) || '',
        origin: (body.origin as string) || '',
        user_id: (body.userId as string) || '',
        type: 'registration',
      },
    });

    // Update pre_registration with razorpay_order_id
    const { error: updateError } = await supabase
      .from('pre_registrations')
      .update({ 
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    if (updateError) {
      logger.error('Failed to update order_id', updateError);
    }

    logger.info('Order created', { orderId: order.id, registrationId });

    // Validate that payment worker returned key_id
    if (!order.key_id) {
      logger.error('Payment worker did not return key_id');
      return apiError(500, 'INTERNAL_ERROR', 'Payment worker configuration error', context.request);
    }

    // Return order with key_id from payment worker and registrationId
    return apiSuccess({ ...order, razorpay_key_id: order.key_id, registrationId }, context.request, 200);
  } catch (error) {
    logger.error('Error creating registration order', error);
    return rpcErrorResponse(error, context.request);
  }
}
