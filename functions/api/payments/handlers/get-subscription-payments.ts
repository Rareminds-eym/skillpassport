/**
 * Get Subscription Payments Handler
 *
 * GET /api/payments/get-subscription-payments?subscriptionId=...
 *
 * Fetches the payments for a specific subscription from the auth DB
 * via the SSO worker. Requires SSO authentication.
 */

import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { ssoGetUserTransactions } from '../../../lib/sso-client';

export async function handleGetSubscriptionPayments(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SSO_SERVICE: Fetcher };
  const user = getContextUser(context);
  const userId = user.id;
  const url = new URL(context.request.url);
  const subscriptionId = url.searchParams.get('subscriptionId');

  if (!subscriptionId) {
    return new Response(
      JSON.stringify({ success: false, data: null, error: 'subscriptionId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const transactions = await ssoGetUserTransactions(env, userId, subscriptionId);

    return new Response(
      JSON.stringify({ success: true, data: transactions, error: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GetSubscriptionPayments] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
