/**
 * Get Subscription Payments Handler
 *
 * GET /api/payments/get-subscription-payments?subscriptionId=...
 *
 * Fetches the payments for a specific subscription from the auth DB
 * via the SSO worker. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { ssoGetUserTransactions } from '../../../lib/sso-client';

function extractAuthToken(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No auth token found');
  return authHeader.slice(7);
}

export async function handleGetSubscriptionPayments(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SSO_SERVICE: Fetcher; SERVICE_AUTH_SECRET: string };
  const userId = context.data.user.sub;
  const url = new URL(context.request.url);
  const subscriptionId = url.searchParams.get('subscriptionId');

  if (!subscriptionId) {
    return new Response(
      JSON.stringify({ success: false, data: null, error: 'subscriptionId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authToken = extractAuthToken(context.request);
    const transactions = await ssoGetUserTransactions(env, authToken, userId, subscriptionId);

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
