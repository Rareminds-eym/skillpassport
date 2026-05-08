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

// Validate Razorpay subscription ID format to prevent path traversal
const RAZORPAY_SUBSCRIPTION_ID_RE = /^sub_[A-Za-z0-9]{14,}$/;

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

  // Validate subscription ID format before calling worker
  if (!subscriptionId || !RAZORPAY_SUBSCRIPTION_ID_RE.test(subscriptionId)) {
    return new Response(
      JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Invalid subscription ID — must match format sub_XXXXXXXXXXXXXX' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body (optional cancel_at_cycle_end flag)
    // NOTE: The worker v2 currently ignores cancel_at_cycle_end and hardcodes
    // cancel_at_cycle_end: 0 (immediate cancel). This is a known limitation.
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
    // Note: worker ignores cancel_at_cycle_end and user_id — it only uses subscriptionId
    const response = await callPaymentWorker(
      `/subscription/${subscriptionId}/cancel`,
      {
        method: 'POST',
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
