/**
 * Has Feature Access Handler
 *
 * GET /api/payments/has-feature-access?featureKey=...
 *
 * Checks if a user has access to a feature through their plan or add-ons.
 * Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleHasFeatureAccess(context);
});

export async function handleHasFeatureAccess(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const url = new URL(context.request.url);
  const featureKey = url.searchParams.get('featureKey');

  if (!featureKey) {
    return new Response(
      JSON.stringify({ success: false, data: null, error: 'featureKey is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = getServiceClient(env);
    const userId = user.sub;

    // First, check if user has a subscription plan that includes this feature
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_id, status, subscription_end_date')
      .eq('user_id', userId)
      .in('status', ['active', 'paused', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subError && subscription?.plan_id) {
      if (subscription.status === 'cancelled') {
        const endDate = new Date(subscription.subscription_end_date);
        const now = new Date();
        if (endDate >= now) {
          const { data: planFeature, error: featureError } = await supabase
            .from('subscription_plan_features')
            .select('is_included')
            .eq('plan_id', subscription.plan_id)
            .eq('feature_key', featureKey)
            .maybeSingle();

          if (!featureError && planFeature?.is_included) {
            return new Response(
              JSON.stringify({ success: true, data: { hasAccess: true, accessSource: 'plan' } }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      } else {
        const { data: planFeature, error: featureError } = await supabase
          .from('subscription_plan_features')
          .select('is_included')
          .eq('plan_id', subscription.plan_id)
          .eq('feature_key', featureKey)
          .maybeSingle();

        if (!featureError && planFeature?.is_included) {
          return new Response(
            JSON.stringify({ success: true, data: { hasAccess: true, accessSource: 'plan' } }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Check for active add-on entitlement
    const { data: entitlement, error: entError } = await supabase
      .from('user_entitlements')
      .select('id, bundle_id, status, end_date')
      .eq('user_id', userId)
      .eq('feature_key', featureKey)
      .in('status', ['active', 'grace_period', 'cancelled'])
      .gte('end_date', new Date().toISOString())
      .maybeSingle();

    if (!entError && entitlement) {
      const accessSource = entitlement.bundle_id ? 'bundle' : 'addon';
      return new Response(
        JSON.stringify({ success: true, data: { hasAccess: true, accessSource } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: { hasAccess: false, accessSource: null } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[HasFeatureAccess] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
