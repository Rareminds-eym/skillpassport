/**
 * Toggle Addon Auto Renew Handler
 *
 * POST /api/payments/toggle-addon-autorenew
 *
 * Toggles auto renew for an addon. Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleToggleAddonAutorenew(context);
});

export async function handleToggleAddonAutorenew(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const { entitlementId, autoRenew } = await context.request.json() as { entitlementId: string, autoRenew: boolean };

    if (!entitlementId || typeof autoRenew !== 'boolean') {
      return new Response(
        JSON.stringify({ success: false, data: null, error: 'entitlementId and autoRenew are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('user_entitlements')
      .update({
        auto_renew: autoRenew,
        updated_at: new Date().toISOString()
      })
      .eq('id', entitlementId)
      .eq('user_id', context.data.user.sub) // Secure check
      .select()
      .single();

    if (error) {
      console.error('[ToggleAddonAutorenew] Supabase error:', error);
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ success: false, data: null, error: 'ENTITLEMENT_NOT_FOUND' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, data: null, error: error.message }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data, error: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ToggleAddonAutorenew] Error:', error);
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
