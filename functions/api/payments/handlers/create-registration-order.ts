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
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../../../lib/logger';

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

    if (!body.userEmail || !body.userName || !body.userPhone) {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'userEmail, userName, and userPhone are required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

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
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to create registration record',
            details: insertError.message 
          } 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Payment worker configuration error' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return order with key_id from payment worker and registrationId
    return new Response(
      JSON.stringify({ 
        ...order, 
        razorpay_key_id: order.key_id,
        registrationId: registrationId 
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Error creating registration order', error);
    return rpcErrorResponse(error);
  }
}
