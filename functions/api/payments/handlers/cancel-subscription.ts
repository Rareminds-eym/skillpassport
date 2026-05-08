/**
 * Cancel Subscription Handler
 *
 * POST /api/payments/subscription/:id/cancel
 *
 * Cancels a Razorpay subscription via the payment-worker.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { callPaymentWorker } from '../lib/serviceJwt';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const match = path.match(/\/subscription\/([^/]+)\/cancel/);
  const subscriptionId = match ? match[1] : null;

  if (!subscriptionId) {
    return new Response(
      JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Subscription ID is required' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handleCancelSubscription(context, subscriptionId);
});

export async function handleCancelSubscription(context: AuthenticatedContext, subscriptionId: string): Promise<Response> {
  const user = context.data.user;
  const env = context.env as Record<string, string>;

  try {
    // Parse request body (optional cancel_at_cycle_end flag)
    let cancelAtCycleEnd = true;
    try {
      const body = (await context.request.json()) as Record<string, unknown>;
      if (typeof body.cancel_at_cycle_end === 'boolean') {
        cancelAtCycleEnd = body.cancel_at_cycle_end;
      }
    } catch {
      // No body or invalid JSON, use default
    }

    // Call payment-worker with Service JWT
    const response = await callPaymentWorker(
      `/subscription/${subscriptionId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({
          cancel_at_cycle_end: cancelAtCycleEnd,
          user_id: user.sub,
          org_id: user.org_id,
        }),
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
    console.error('[CancelSubscription] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to cancel subscription',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
