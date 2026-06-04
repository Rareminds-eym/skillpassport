/**
 * Get Addon By Feature Key Handler
 *
 * GET /api/payments/get-addon-by-feature-key?featureKey=...
 *
 * Queries Supabase for an addon by feature key. Bypasses RLS. Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { ssoFetch } from '../../../lib/sso-client';
import { apiSuccess, apiError } from '../../../lib/response';
export async function handleGetAddonByFeatureKey(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SSO_SERVICE: Fetcher };
  const url = new URL(context.request.url);
  const featureKey = url.searchParams.get('featureKey');

  if (!featureKey) {
    return apiError(400, 'VALIDATION_ERROR', 'featureKey is required', context.request);
  }

  try {
    const ssoUrl = new URL(`http://sso-worker/api/addon-catalog/${encodeURIComponent(featureKey)}`);
    const ssoResponse = await ssoFetch(env as any, new Request(ssoUrl.toString(), {
      method: 'GET',
    }));

    if (!ssoResponse.ok) {
      if (ssoResponse.status === 404) {
        return apiSuccess(null, context.request, 200);
      }
      const errText = await ssoResponse.text();
      console.error('[GetAddonByFeatureKey] SSO Worker error:', ssoResponse.status, errText);
      return apiError(200, 'ERROR', `SSO Worker error: ${ssoResponse.status}`, context.request);
    }

    const addon = await ssoResponse.json() as any;

    // Transform to expected format
    const transformedData = {
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
      icon_url: addon.icon,
    };

    return apiSuccess(transformedData, context.request, 200);
  } catch (error) {
    console.error('[GetAddonByFeatureKey] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
