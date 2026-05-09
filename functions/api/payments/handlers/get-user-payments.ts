/**
 * Get User Payments Handler
 *
 * GET /api/payments/get-user-payments
 *
 * Fetches all payments for the authenticated user. Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleGetUserPayments(context);
});

export async function handleGetUserPayments(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const userId = context.data.user.sub;

  try {
    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return apiDbError(error, context.request, { startTime });
    }

    return apiSuccess(data || [], context.request, { startTime });
  } catch (error) {
    console.error('[GetUserPayments] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}
