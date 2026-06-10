/**
 * Get User Payments Handler
 *
 * GET /api/payments/get-user-payments
 *
 * Fetches all payment transactions for the authenticated user from the
 * auth DB via the SSO worker. Requires SSO authentication.
 */

import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../../lib/response';
import { ssoGetUserTransactions } from '../../../lib/sso-client';

export async function handleGetUserPayments(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const env = context.env as { SSO_SERVICE: Fetcher };
  const user = getContextUser(context);
  const userId = user.id;

  try {
    const transactions = await ssoGetUserTransactions(env, userId);

    return apiSuccess(transactions || [], context.request, { startTime });
  } catch (error) {
    console.error('[GetUserPayments] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}
