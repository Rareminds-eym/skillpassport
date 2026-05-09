/**
 * Update Event Payment Status Handler
 *
 * POST /api/payments/update-event-payment-status
 *
 * Updates the payment status of an event registration in Supabase.
 * Determines the target table based on the plan name.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

/**
 * Map plan names to their corresponding registration tables.
 */
const PLAN_TABLE_MAP: Record<string, string> = {
  event: 'event_registrations',
  workshop: 'workshop_registrations',
  webinar: 'webinar_registrations',
  bootcamp: 'bootcamp_registrations',
};

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleUpdateEventPaymentStatus(context);
});

export async function handleUpdateEventPaymentStatus(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const registrationId = body.registrationId as string;
    const orderId = body.orderId as string;
    const paymentId = body.paymentId as string;
    const status = body.status as string;
    const errorMessage = body.error as string | undefined;
    const planName = body.planName as string | undefined;

    if (!registrationId || !status) {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'registrationId and status are required' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
      .eq('id', registrationId);

    if (updateError) {
      console.error('[UpdateEventPaymentStatus] Update error:', updateError);
      return new Response(
        JSON.stringify({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to update event payment status' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, updated: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[UpdateEventPaymentStatus] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update event payment status',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
