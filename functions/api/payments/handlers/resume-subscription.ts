/**
 * Resume Subscription Handler
 *
 * POST /api/payments/resume-subscription
 *
 * Resumes a user's paused subscription by updating its status back to active.
 * Validates that the subscription belongs to the authenticated user and is currently paused.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { invalidateUserSubscriptionCache } from '../../../shared/lib/cache';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleResumeSubscription(context);
});

export async function handleResumeSubscription(context: AuthenticatedContext): Promise<Response> {
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

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'subscription_id is required' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceClient(env);

    // Validate subscription belongs to user and is paused
    const { data: existing, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.sub)
      .maybeSingle();

    if (fetchError) {
      console.error('[ResumeSubscription] Fetch error:', fetchError);
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

    if (existing.status !== 'paused') {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'Only paused subscriptions can be resumed' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update subscription status to active, clear paused_at
    const { data: updated, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        paused_at: null,
      })
      .eq('id', subscriptionId)
      .eq('user_id', user.sub)
      .select()
      .single();

    if (updateError) {
      console.error('[ResumeSubscription] Update error:', updateError);
      return new Response(
        JSON.stringify({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to resume subscription' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Invalidate subscription cache for this user
    const cacheKV = (env as any).CACHE_KV as KVNamespace | undefined;
    await invalidateUserSubscriptionCache(cacheKV, user.sub);

    return new Response(
      JSON.stringify({ success: true, subscription: updated }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ResumeSubscription] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to resume subscription',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
