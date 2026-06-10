/**
 * Get Subscription Handler
 *
 * GET /api/payments/get-subscription
 *
 * Queries Supabase directly for the user's active or paused subscription.
 * Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleGetSubscription(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('subscription_cache')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[GetSubscription] Supabase error:', error);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch subscription', context.request);
    }

    return apiSuccess({ subscription: data }, context.request, 200);
  } catch (error) {
    console.error('[GetSubscription] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to get subscription', context.request);
  }
}
