/**
 * Get Subscription Payments Handler
 *
 * GET /api/payments/get-subscription-payments?subscriptionId=...
 *
 * Fetches the payments for a specific subscription. Bypasses RLS. Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleGetSubscriptionPayments(context);
});

export async function handleGetSubscriptionPayments(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const userId = context.data.user.sub;
  const url = new URL(context.request.url);
  const subscriptionId = url.searchParams.get('subscriptionId');

  if (!subscriptionId) {
    return new Response(
      JSON.stringify({ success: false, data: null, error: 'subscriptionId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      // Secure check: only return if the transaction belongs to the current user
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GetSubscriptionPayments] Supabase error:', error);
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
    console.error('[GetSubscriptionPayments] Error:', error);
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
