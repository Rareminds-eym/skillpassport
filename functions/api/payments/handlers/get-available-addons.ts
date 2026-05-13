/**
 * Get Available Addons Handler
 *
 * GET /api/payments/get-available-addons
 *
 * Queries Supabase for available addons. Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleGetAvailableAddons(context);
});

export async function handleGetAvailableAddons(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const url = new URL(context.request.url);
  const category = url.searchParams.get('category');
  const role = url.searchParams.get('role');

  try {
    const supabase = getServiceClient(env);

    let query = supabase
      .from('subscription_plan_features')
      .select('id, feature_key, feature_name, category, addon_price_monthly, addon_price_annual, addon_description, target_roles, icon_url, sort_order_addon')
      .eq('is_addon', true)
      .order('sort_order_addon', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (role) {
      query = query.contains('target_roles', [role]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GetAvailableAddons] Supabase error:', error);
      return new Response(
        JSON.stringify({ success: false, data: null, error: error.message }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Deduplicate by feature_key as done in the frontend
    const uniqueAddons = new Map();
    (data || []).forEach(addon => {
      if (!uniqueAddons.has(addon.feature_key)) {
        uniqueAddons.set(addon.feature_key, {
          id: addon.id,
          feature_key: addon.feature_key,
          name: addon.feature_name,
          description: addon.addon_description,
          category: addon.category,
          price_monthly: parseFloat(addon.addon_price_monthly) || 0,
          price_annual: parseFloat(addon.addon_price_annual) || 0,
          target_roles: addon.target_roles || [],
          icon_url: addon.icon_url,
        });
      }
    });

    const resultData = Array.from(uniqueAddons.values());

    return new Response(
      JSON.stringify({ success: true, data: resultData, error: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GetAvailableAddons] Error:', error);
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
