/**
 * Has Feature Access Handler
 *
 * GET /api/payments/has-feature-access?featureKey=...
 *
 * Checks if a user has access to a feature through their plan or add-ons.
 * Bypasses RLS. Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleHasFeatureAccess(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const url = new URL(context.request.url);
  const featureKey = url.searchParams.get('featureKey');

  if (!featureKey) {
    return apiError(400, 'VALIDATION_ERROR', 'featureKey is required', context.request);
  }

  try {
    const supabase = getServiceClient(env);
    const userId = user.id;

    // First, check if user has a subscription plan that includes this feature
    const { data: subscription, error: subError } = await supabase
      .from('subscription_cache')
      .select('plan_id, status, subscription_end_date, features')
      .eq('user_id', userId)
      .in('status', ['active', 'paused', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subError && subscription?.plan_id) {
      const planFeatures = Array.isArray(subscription.features) ? subscription.features : [];
      if (subscription.status === 'cancelled') {
        const endDate = new Date(subscription.subscription_end_date);
        const now = new Date();
        if (endDate >= now && planFeatures.includes(featureKey)) {
          return apiSuccess({ hasAccess: true, accessSource: 'plan' }, context.request, 200);
        }
      } else if (planFeatures.includes(featureKey)) {
        return apiSuccess({ hasAccess: true, accessSource: 'plan' }, context.request, 200);
      }
    }

    // Check for active add-on entitlement
    const { data: entitlements, error: entError } = await supabase
      .from('user_entitlements')
      .select('id, bundle_id, status, end_date')
      .eq('user_id', userId)
      .eq('feature_key', featureKey)
      .in('status', ['active', 'grace_period', 'cancelled'])
      .gte('end_date', new Date().toISOString())
      .limit(1);

    if (!entError && entitlements && entitlements.length > 0) {
      const entitlement = entitlements[0];
      const accessSource = entitlement.bundle_id ? 'bundle' : 'addon';
      return apiSuccess({ hasAccess: true, accessSource }, context.request, 200);
    }

    return apiSuccess({ hasAccess: false, accessSource: null }, context.request, 200);
  } catch (error) {
    console.error('[HasFeatureAccess] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
