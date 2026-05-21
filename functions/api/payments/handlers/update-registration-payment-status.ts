/**
 * Update Registration Payment Status Handler
 *
 * POST /api/payments/update-registration-payment-status
 *
 * Updates the payment status in pre_registrations table after payment completion.
 * Public endpoint - no authentication required (called after Razorpay payment).
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import { createClient } from '@supabase/supabase-js';

export const onRequestPost: PagesFunction = async (context) => {
  return handleUpdateRegistrationPaymentStatus(context);
};

export async function handleUpdateRegistrationPaymentStatus(context: any): Promise<Response> {
  const env = context.env as {
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
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const registrationId = body.registrationId as string;
    const orderId = body.orderId as string;
    const paymentId = body.paymentId as string;
    const status = body.status as string; // 'completed' or 'failed'
    const errorMessage = body.error as string | undefined;

    if (!registrationId || !status) {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'registrationId and status are required' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Get current record to append to payment_history
    const { data: currentRecord, error: fetchError } = await supabase
      .from('pre_registrations')
      .select('payment_history')
      .eq('id', registrationId)
      .single();

    if (fetchError) {
      console.error('[UpdateRegistrationPaymentStatus] Fetch error:', fetchError);
      return new Response(
        JSON.stringify({
          error: { code: 'NOT_FOUND', message: 'Registration not found' },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build payment history entry
    const paymentHistoryEntry = {
      timestamp: new Date().toISOString(),
      status: status,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId || null,
      error: errorMessage || null,
    };

    // Append to existing payment_history
    const updatedPaymentHistory = [
      ...(currentRecord.payment_history || []),
      paymentHistoryEntry,
    ];

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      payment_status: status,
      updated_at: new Date().toISOString(),
      payment_history: updatedPaymentHistory,
    };

    if (orderId) {
      updatePayload.razorpay_order_id = orderId;
    }
    if (paymentId) {
      updatePayload.razorpay_payment_id = paymentId;
    }

    // Update the record
    const { error: updateError } = await supabase
      .from('pre_registrations')
      .update(updatePayload)
      .eq('id', registrationId);

    if (updateError) {
      console.error('[UpdateRegistrationPaymentStatus] Update error:', updateError);
      return new Response(
        JSON.stringify({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to update registration payment status' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[UpdateRegistrationPaymentStatus] Updated registration ${registrationId} to status: ${status}`);

    return new Response(
      JSON.stringify({ success: true, updated: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[UpdateRegistrationPaymentStatus] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update registration payment status',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
