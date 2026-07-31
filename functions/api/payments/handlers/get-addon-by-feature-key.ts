/**
 * Get Addon By Feature Key Handler
 *
 * GET /api/payments/get-addon-by-feature-key?featureKey=...
 *
 * Queries Supabase for an addon by feature key. Bypasses RLS. Requires SSO authentication.
 */


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiError, apiSuccess } from '../../../lib/response';
import { ssoGetAddonByFeatureKey } from '../../../lib/sso-client';
export async function handleGetAddonByFeatureKey(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SSO_SERVICE: Fetcher };
  const url = new URL(context.request.url);
  const featureKey = url.searchParams.get('featureKey');

  if (!featureKey) {
    return apiError(400, 'VALIDATION_ERROR', 'featureKey is required', context.request);
  }

  try {
    let addon: any;
    try {
      addon = await ssoGetAddonByFeatureKey(env as any, featureKey);
    } catch (err: any) {
      if (err.message?.includes('Not found')) {
        return apiSuccess(null, context.request, 200);
      }
      console.error('[GetAddonByFeatureKey] SSO Worker error:', err);
      return apiError(200, 'ERROR', `SSO Worker error: ${err.message}`, context.request);
    }

    // Transform to expected format
    const transformedData = {
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
      icon_url: addon.icon,
    };

    return apiSuccess(transformedData, context.request, 200);
  } catch (error) {
    console.error('[GetAddonByFeatureKey] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
