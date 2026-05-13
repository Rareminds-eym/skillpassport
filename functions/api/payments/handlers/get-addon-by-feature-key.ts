/**
 * Get Addon By Feature Key Handler
 *
 * GET /api/payments/get-addon-by-feature-key?featureKey=...
 *
 * Queries Supabase for an addon by feature key. Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleGetAddonByFeatureKey(context);
});

export async function handleGetAddonByFeatureKey(context: AuthenticatedContext): Promise<Response> {
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

    const { data, error } = await supabase
      .from('subscription_plan_features')
      .select('id, feature_key, feature_name, category, addon_price_monthly, addon_price_annual, addon_description, icon_url')
      .eq('feature_key', featureKey)
      .eq('is_addon', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[GetAddonByFeatureKey] Supabase error:', error);
      return new Response(
        JSON.stringify({ success: false, data: null, error: error.message }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: true, data: null, error: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform to expected format
    const transformedData = {
      id: data.id,
      feature_key: data.feature_key,
      name: data.feature_name,
      description: data.addon_description,
      category: data.category,
      price_monthly: parseFloat(data.addon_price_monthly) || 199,
      price_annual: parseFloat(data.addon_price_annual) || 1990,
      icon_url: data.icon_url,
    };

    return new Response(
      JSON.stringify({ success: true, data: transformedData, error: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GetAddonByFeatureKey] Error:', error);
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
