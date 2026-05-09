/**
 * Get User Entitlements Handler
 *
 * GET /api/payments/get-user-entitlements
 *
 * Queries Supabase for the user's entitlements bypassing RLS.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleGetUserEntitlements(context);
});

export async function handleGetUserEntitlements(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', user.sub)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GetUserEntitlements] Supabase error:', error);
      return new Response(
        JSON.stringify({ success: false, data: null, error: error.message }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data || [], error: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GetUserEntitlements] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch user entitlements',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
