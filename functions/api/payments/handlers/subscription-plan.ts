/**
 * Subscription Plan Handler
 *
 * GET /api/payments/subscription-plan?plan_id=xxx
 *
 * Queries Supabase directly for a single subscription plan by ID.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export async function handleSubscriptionPlan(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const url = new URL(context.request.url);
    const planId = url.searchParams.get('plan_id');

    if (!planId) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_INPUT',
            message: 'plan_id query parameter is required',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('plans_cache')
      .select('*')
      .eq('id', planId)
      .maybeSingle();

    if (error) {
      console.error('[SubscriptionPlan] Supabase error:', error);
      return new Response(
        JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch subscription plan',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: `Subscription plan with id '${planId}' not found`,
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, plan: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SubscriptionPlan] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch subscription plan',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
