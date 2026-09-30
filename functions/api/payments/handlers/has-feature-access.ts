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
import { checkServerFeatureAccess } from '../../../shared/lib/server-feature-gating';

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

    // 1. Check plan access via canonical shared server-side resolver
    // (handles personal plans, org seat licenses, and org-wide fallbacks)
    const planResult = await checkServerFeatureAccess(supabase, userId, featureKey);
    if (planResult.hasAccess) {
      return apiSuccess({ hasAccess: true, accessSource: 'plan' }, context.request, 200);
    }

    // 2. Check purchased add-on / bundle entitlement (selects bundle_id to
    // preserve the bundle vs standalone add-on distinction)
    const nowIso = new Date().toISOString();
    const { data: addonEntitlement } = await supabase
      .from('user_entitlements')
      .select('id, end_date, status, bundle_id')
      .eq('user_id', userId)
      .eq('feature_key', featureKey)
      .in('status', ['active', 'grace_period', 'cancelled'])
      .or(`end_date.gte.${nowIso},end_date.is.null`)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (addonEntitlement) {
      return apiSuccess({ hasAccess: true, accessSource: addonEntitlement.bundle_id ? 'bundle' : 'addon' }, context.request, 200);
    }

    return apiSuccess({ hasAccess: false, accessSource: null }, context.request, 200);
  } catch (error) {
    console.error('[HasFeatureAccess] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
