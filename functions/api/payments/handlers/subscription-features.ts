/**
 * Subscription Features Handler
 *
 * GET /api/payments/subscription-features
 *
 * Queries Supabase directly for subscription features.
 * Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleSubscriptionFeatures(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('subscription_features')
      .select('*');

    if (error) {
      console.error('[SubscriptionFeatures] Supabase error:', error);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch subscription features', context.request);
    }

    return apiSuccess({ features: data }, context.request, 200);
  } catch (error) {
    console.error('[SubscriptionFeatures] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to fetch subscription features', context.request);
  }
}
