/**
 * Subscription Plan Handler
 *
 * GET /api/payments/subscription-plan?plan_id=xxx
 *
 * Queries Supabase directly for a single subscription plan by ID.
 * Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleSubscriptionPlan(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const url = new URL(context.request.url);
    const planId = url.searchParams.get('plan_id');

    if (!planId) {
      return apiError(400, 'VALIDATION_ERROR', 'plan_id query parameter is required', context.request);
    }

    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('plans_cache')
      .select('*')
      .eq('id', planId)
      .maybeSingle();

    if (error) {
      console.error('[SubscriptionPlan] Supabase error:', error);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch subscription plan', context.request);
    }

    if (!data) {
      return apiError(404, 'NOT_FOUND', `Subscription plan with id '${planId}' not found`, context.request);
    }

    return apiSuccess({ plan: data }, context.request, 200);
  } catch (error) {
    console.error('[SubscriptionPlan] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to fetch subscription plan', context.request);
  }
}
