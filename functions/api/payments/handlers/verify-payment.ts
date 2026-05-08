/**
 * Verify Payment Handler
 *
 * POST /api/payments/verify-payment
 *
 * Verifies a Razorpay payment and creates a subscription via the payment-worker.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { callPaymentWorker } from '../lib/serviceJwt';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleVerifyPayment(context);
});

export async function handleVerifyPayment(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as Record<string, string>;

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

    // Validate required fields for Razorpay verification
    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_INPUT',
            message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enforce user context from SSO — always use verified identity, never trust frontend
    const enhancedBody = {
      ...body,
      user_id: user.sub,
      user_email: user.email,
      org_id: user.org_id,
    };

    // Call payment-worker with Service JWT
    const response = await callPaymentWorker(
      '/verify-payment',
      {
        method: 'POST',
        body: JSON.stringify(enhancedBody),
      },
      env
    );

    // Return the response from the worker
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[VerifyPayment] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to verify payment',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
