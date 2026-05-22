/**
 * Get User Payments Handler
 *
 * GET /api/payments/get-user-payments
 *
 * Fetches all payment transactions for the authenticated user from the
 * auth DB via the SSO worker. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../../lib/response';
import { ssoGetUserTransactions } from '../../../lib/sso-client';

function extractAuthToken(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No auth token found');
  return authHeader.slice(7);
}

export async function handleGetUserPayments(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const env = context.env as { SSO_SERVICE: Fetcher; SERVICE_AUTH_SECRET: string };
  const userId = context.data.user.sub;

  try {
    const authToken = extractAuthToken(context.request);
    const transactions = await ssoGetUserTransactions(env, authToken, userId);

    return apiSuccess(transactions || [], context.request, { startTime });
  } catch (error) {
    console.error('[GetUserPayments] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}
