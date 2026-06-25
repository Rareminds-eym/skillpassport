/**
 * Get Available Addons Handler
 *
 * GET /api/payments/get-available-addons
 *
 * Queries Supabase for available addons. Bypasses RLS. Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiError, apiSuccess } from '../../../lib/response';
import { ssoListAddonCatalog } from '../../../lib/sso-client';
export async function handleGetAvailableAddons(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SSO_SERVICE: Fetcher };
  const url = new URL(context.request.url);
  const category = url.searchParams.get('category');
  const role = url.searchParams.get('role');

  try {
    let addonsData: any;
    try {
      addonsData = await ssoListAddonCatalog(env as any);
    } catch (err: any) {
      console.error('[GetAvailableAddons] SSO Worker error:', err);
      return apiError(200, 'ERROR', `SSO Worker error: ${err.message}`, context.request);
    }

    let addons = (addonsData.addons || []) as any[];

    if (category) addons = addons.filter(a => a.category === category);
    if (role) addons = addons.filter(a => a.target_roles?.includes(role));

    // Format for the frontend
    const resultData = addons.map(addon => ({
      id: addon.id,
      feature_key: addon.feature_key,
      feature_name: addon.feature_name,
      name: addon.feature_name,
      addon_description: addon.description,
      description: addon.description,
      category: addon.category,
      addon_price_monthly: safeParseFloat(addon.price_monthly, 0),
      price_monthly: safeParseFloat(addon.price_monthly, 0),
      addon_price_annual: safeParseFloat(addon.price_annual, 0),
      price_annual: safeParseFloat(addon.price_annual, 0),
      target_roles: addon.target_roles || [],
      icon_url: addon.icon,
    }));

    return apiSuccess(resultData, context.request, 200);
  } catch (error) {
    console.error('[GetAvailableAddons] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
