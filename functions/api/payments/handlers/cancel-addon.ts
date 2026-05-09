/**
 * Cancel Addon Handler
 *
 * POST /api/payments/cancel-addon
 *
 * Cancels a user entitlement. Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleCancelAddon(context);
});

export async function handleCancelAddon(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const { entitlementId } = await context.request.json() as { entitlementId: string };

    if (!entitlementId) {
      return new Response(
        JSON.stringify({ success: false, data: null, error: 'entitlementId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('user_entitlements')
      .update({
        status: 'cancelled',
        auto_renew: false,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', entitlementId)
      // Ensure the user actually owns this entitlement
      .eq('user_id', context.data.user.sub)
      .select()
      .single();

    if (error) {
      console.error('[CancelAddon] Supabase error:', error);
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
    console.error('[CancelAddon] Error:', error);
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
