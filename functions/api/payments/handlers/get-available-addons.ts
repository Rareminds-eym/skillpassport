/**
 * Get Available Addons Handler
 *
 * GET /api/payments/get-available-addons
 *
 * Queries Supabase for available addons. Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { ssoFetch } from '../../../lib/sso-client';
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
      return new Response(
        JSON.stringify({ success: false, data: null, error: `SSO Worker error: ${ssoResponse.status}` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
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
