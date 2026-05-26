/**
 * Get Addon By Feature Key Handler
 *
 * GET /api/payments/get-addon-by-feature-key?featureKey=...
 *
 * Queries Supabase for an addon by feature key. Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
export async function handleGetAddonByFeatureKey(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SSO_SERVICE: Fetcher };
  const url = new URL(context.request.url);
  const featureKey = url.searchParams.get('featureKey');

  if (!featureKey) {
    return new Response(
      JSON.stringify({ success: false, data: null, error: 'featureKey is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const ssoUrl = new URL(`http://sso-worker/api/addon-catalog/${encodeURIComponent(featureKey)}`);
    const ssoResponse = await env.SSO_SERVICE.fetch(new Request(ssoUrl.toString(), {
      method: 'GET',
    }));

    if (!ssoResponse.ok) {
      if (ssoResponse.status === 404) {
        return new Response(
          JSON.stringify({ success: true, data: null, error: null }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const errText = await ssoResponse.text();
      console.error('[GetAddonByFeatureKey] SSO Worker error:', ssoResponse.status, errText);
      return new Response(
        JSON.stringify({ success: false, data: null, error: `SSO Worker error: ${ssoResponse.status}` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
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
