/**
 * Update Event Payment Status Handler
 *
 * POST /api/payments/update-event-payment-status
 *
 * Updates the payment status of an event registration in Supabase.
 * Determines the target table based on the plan name.
 * Requires SSO authentication.
 */


import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

/**
 * Map plan names to their corresponding registration tables.
 */
const PLAN_TABLE_MAP: Record<string, string> = {
  event: 'event_registrations',
  workshop: 'workshop_registrations',
  webinar: 'webinar_registrations',
  bootcamp: 'bootcamp_registrations',
};

export async function handleUpdateEventPaymentStatus(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as unknown as PaymentWorkerEnv & { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const user = getContextUser(context);

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    const registrationId = body.registrationId as string;
    const orderId = body.orderId as string;
    const paymentId = body.paymentId as string;
    const status = body.status as string;
    const errorMessage = body.error as string | undefined;
    const planName = body.planName as string | undefined;

    if (!registrationId || !status) {
      return apiError(400, 'VALIDATION_ERROR', 'registrationId and status are required', context.request);
    }

    // Verify Razorpay signature if payment is marked as completed
    if (status === 'completed') {
      const razorpaySignature = body.razorpay_signature as string;
      if (!razorpaySignature || !orderId || !paymentId) {
        return apiError(400, 'VALIDATION_ERROR', 'razorpay_signature, orderId, and paymentId are required for completed status', context.request);
      }

      const worker = getPaymentWorker(env);
      try {
        await worker.verifyPaymentSignature(orderId, paymentId, razorpaySignature);
      } catch (verifyError) {
        console.error('[UpdateEventPaymentStatus] Signature verification failed:', verifyError);
        return apiError(400, 'VALIDATION_ERROR', 'Invalid payment signature', context.request);
      }
    }

    // Determine target table from planName
    const tableName = (planName && PLAN_TABLE_MAP[planName.toLowerCase()])
      || 'event_registrations';

    const supabase = getServiceClient(env);

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      payment_status: status,
      updated_at: new Date().toISOString(),
    };

    if (orderId) {
      updatePayload.razorpay_order_id = orderId;
    }
    if (paymentId) {
      updatePayload.razorpay_payment_id = paymentId;
    }
    if (errorMessage) {
      updatePayload.payment_error = errorMessage;
    }

    const { error: updateError } = await supabase
      .from(tableName)
      .update(updatePayload)
      .eq('id', registrationId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[UpdateEventPaymentStatus] Update error:', updateError);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to update event payment status', context.request);
    }

    return apiSuccess({ updated: true }, context.request, 200);
  } catch (error) {
    console.error('[UpdateEventPaymentStatus] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to update event payment status', context.request);
  }
}
