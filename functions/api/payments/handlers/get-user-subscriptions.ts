/**
 * Get User Subscriptions Handler
 *
 * GET /api/payments/get-user-subscriptions
 *
 * Fetches the user's subscription history. Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleGetUserSubscriptions(context);
});

export async function handleGetUserSubscriptions(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const userId = context.data.user.sub;
  const url = new URL(context.request.url);
  const includeAll = url.searchParams.get('includeAll') === 'true';

  try {
    const supabase = getServiceClient(env);
    const selectFields = includeAll
      ? '*'
      : 'id,created_at,subscription_start_date,subscription_end_date,plan_amount,status,plan_type,billing_cycle,razorpay_payment_id';

    const { data, error } = await supabase
      .from('subscriptions')
      .select(selectFields)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[GetUserSubscriptions] Supabase error:', error);
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
    console.error('[GetUserSubscriptions] Error:', error);
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
