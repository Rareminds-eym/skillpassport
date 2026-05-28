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
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleGetSubscriptionPayments(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SSO_SERVICE: Fetcher };
  const user = getContextUser(context);
  const userId = user.id;
  const url = new URL(context.request.url);
  const subscriptionId = url.searchParams.get('subscriptionId');

  if (!subscriptionId) {
    return apiError(400, 'VALIDATION_ERROR', 'subscriptionId is required', context.request);
  }

  try {
    const transactions = await ssoGetUserTransactions(env, userId, subscriptionId);

    return apiSuccess(transactions, context.request, 200);
  } catch (error) {
    console.error('[GetSubscriptionPayments] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
