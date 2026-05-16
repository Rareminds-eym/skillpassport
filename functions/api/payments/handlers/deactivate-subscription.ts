/**
 * Deactivate Subscription Handler
 *
 * POST /api/payments/deactivate-subscription
 *
 * Cancels a user's subscription by updating its status in Supabase.
 * Validates that the subscription belongs to the authenticated user.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
// Cache invalidation removed - KV dependency eliminated

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleDeactivateSubscription(context);
});

export async function handleDeactivateSubscription(context: AuthenticatedContext): Promise<Response> {
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
    const cancellationReason = (body.cancellation_reason as string) || null;

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'subscription_id is required' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceClient(env);

    // Validate subscription belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.sub)
      .maybeSingle();

    if (fetchError) {
      console.error('[DeactivateSubscription] Fetch error:', fetchError);
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

    // Update subscription status to cancelled
    const { data: updated, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellationReason,
      })
      .eq('id', subscriptionId)
      .eq('user_id', user.sub)
      .select()
      .single();

    if (updateError) {
      console.error('[DeactivateSubscription] Update error:', updateError);
      return new Response(
        JSON.stringify({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to deactivate subscription' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Cache invalidation removed - KV dependency eliminated
    // Client-side queries will refetch data as needed

    return new Response(
      JSON.stringify({ success: true, subscription: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[DeactivateSubscription] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to deactivate subscription',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
