/**
 * Get Payment Handler
 *
 * GET /api/payments/payment/:id
 *
 * Gets payment details via the payment-worker.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { callPaymentWorker } from '../lib/serviceJwt';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const paymentId = path.split('/').pop();

  if (!paymentId) {
    return new Response(
      JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Payment ID is required' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handleGetPayment(context, paymentId);
});

export async function handleGetPayment(context: AuthenticatedContext, paymentId: string): Promise<Response> {
  const env = context.env as Record<string, string>;

  try {
    // Call payment-worker with Service JWT
    const response = await callPaymentWorker(
      `/payment/${paymentId}`,
      {
        method: 'GET',
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
    console.error('[GetPayment] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get payment',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
