/**
 * Check Subscription Access Handler
 *
 * GET /api/payments/check-subscription-access
 *
 * Checks if the user has subscription access via the payment-worker.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { callPaymentWorker } from '../lib/serviceJwt';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleCheckSubscriptionAccess(context);
});

export async function handleCheckSubscriptionAccess(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as Record<string, string>;

  try {
    // Call payment-worker with Service JWT — pass user_id so worker knows whose access to check
    const response = await callPaymentWorker(
      `/check-subscription-access?user_id=${encodeURIComponent(user.sub)}&org_id=${encodeURIComponent(user.org_id || '')}`,
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
    console.error('[CheckSubscriptionAccess] Error:', error);
    // Return no access on error
    return new Response(
      JSON.stringify({
        success: false,
        hasAccess: false,
        accessReason: 'error',
        subscription: null,
        showWarning: false,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
