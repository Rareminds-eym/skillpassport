/**
 * Get Available Addons Handler
 *
 * GET /api/payments/get-available-addons
 *
 * Queries Supabase for available addons. Bypasses RLS. Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { ssoFetch } from '../../../lib/sso-client';
import { apiSuccess, apiError } from '../../../lib/response';
export async function handleGetAvailableAddons(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SSO_SERVICE: Fetcher };
  const url = new URL(context.request.url);
  const category = url.searchParams.get('category');
  const role = url.searchParams.get('role');

  try {
    const ssoUrl = new URL('http://sso-worker/api/addon-catalog');
    if (category) ssoUrl.searchParams.set('category', category);
    if (role) ssoUrl.searchParams.set('role', role);

    const ssoResponse = await ssoFetch(env as any, new Request(ssoUrl.toString(), {
      method: 'GET',
    }));

    if (!ssoResponse.ok) {
      const errText = await ssoResponse.text();
      console.error('[GetAvailableAddons] SSO Worker error:', ssoResponse.status, errText);
      return apiError(200, 'ERROR', `SSO Worker error: ${ssoResponse.status}`, context.request);
    }

    const { addons } = await ssoResponse.json() as { addons: any[] };

    // Format for the frontend
    const resultData = addons.map(addon => ({
      id: addon.id,
      feature_key: addon.feature_key,
      feature_name: addon.feature_name,
      name: addon.feature_name,
      addon_description: addon.description,
      description: addon.description,
      category: addon.category,
      addon_price_monthly: parseFloat(addon.price_monthly) ?? 0,
      price_monthly: parseFloat(addon.price_monthly) ?? 0,
      addon_price_annual: parseFloat(addon.price_annual) ?? 0,
      price_annual: parseFloat(addon.price_annual) ?? 0,
      target_roles: addon.target_roles || [],
      icon_url: addon.icon,
    }));

    return apiSuccess(resultData, context.request, 200);
  } catch (error) {
    console.error('[GetAvailableAddons] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
