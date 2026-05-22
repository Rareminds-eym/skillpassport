/**
 * Get User Subscriptions Handler
 *
 * GET /api/payments/get-user-subscriptions
 *
 * Fetches the user's subscription history. Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

export async function handleGetUserSubscriptions(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const userId = context.data.user.sub;
  const url = new URL(context.request.url);
  const includeAll = url.searchParams.get('includeAll') === 'true';

  try {
    const supabase = getServiceClient(env);
    const selectFields = includeAll
      ? '*'
      : 'id,created_at,subscription_start_date,subscription_end_date,plan_amount,status,plan_type,billing_cycle,razorpay_payment_id';

    const { data, error } = await supabase
      .from('subscription_cache')
      .select(selectFields)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return apiDbError(error, context.request, { startTime });
    }

    return apiSuccess(data || [], context.request, { startTime });
  } catch (error) {
    console.error('[GetUserSubscriptions] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}
