/**
 * Get Subscription Handler
 *
 * GET /api/payments/get-subscription
 *
 * Gets the user's active subscription via the payment-worker.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { callPaymentWorker } from '../lib/serviceJwt';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleGetSubscription(context);
});

export async function handleGetSubscription(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as Record<string, string>;

  try {
    // Call payment-worker with Service JWT — pass user_id so worker knows whose subscription
    const response = await callPaymentWorker(
      `/get-subscription?user_id=${encodeURIComponent(user.sub)}&org_id=${encodeURIComponent(user.org_id || '')}`,
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
    console.error('[GetSubscription] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get subscription',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
