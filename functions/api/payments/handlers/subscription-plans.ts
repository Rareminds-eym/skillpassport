/**
 * Subscription Plans Handler
 *
 * GET /api/payments/subscription-plans
 *
 * Queries Supabase directly for all active subscription plans.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleSubscriptionPlans(context);
});

export async function handleSubscriptionPlans(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[SubscriptionPlans] Supabase error:', error);
      return new Response(
        JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch subscription plans',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, plans: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SubscriptionPlans] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch subscription plans',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
