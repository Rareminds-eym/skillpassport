/**
 * Pause Subscription Handler
 *
 * POST /api/payments/pause-subscription
 *
 * Pauses a user's active subscription by updating its status in Supabase.
 * Extends the subscription end date by the pause duration.
 * Validates that the subscription belongs to the authenticated user and is currently active.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handlePauseSubscription(context);
});

export async function handlePauseSubscription(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const subscriptionId = body.subscription_id as string;
    const pauseMonths = Math.min(3, Math.max(1, Number(body.pause_months) || 1));

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'subscription_id is required' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceClient(env);

    // Validate subscription belongs to user and is active
    const { data: existing, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.sub)
      .maybeSingle();

    if (fetchError) {
      console.error('[PauseSubscription] Fetch error:', fetchError);
      return new Response(
        JSON.stringify({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to verify subscription ownership' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!existing) {
      return new Response(
        JSON.stringify({
          error: { code: 'NOT_FOUND', message: 'Subscription not found or does not belong to user' },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existing.status !== 'active') {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'Only active subscriptions can be paused' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extend subscription end date by pause_months
    const currentEndDate = existing.subscription_end_date
      ? new Date(existing.subscription_end_date)
      : new Date();
    currentEndDate.setMonth(currentEndDate.getMonth() + pauseMonths);

    // Update subscription status to paused
    const { data: updated, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
        subscription_end_date: currentEndDate.toISOString(),
      })
      .eq('id', subscriptionId)
      .eq('user_id', user.sub)
      .select()
      .single();

    if (updateError) {
      console.error('[PauseSubscription] Update error:', updateError);
      return new Response(
        JSON.stringify({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to pause subscription' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, subscription: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PauseSubscription] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to pause subscription',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
