/**
 * Resume Subscription Handler
 *
 * POST /api/payments/resume-subscription
 *
 * Resumes a user's paused subscription by updating its status through the SSO worker
 * (auth DB is source of truth) and syncing the local shadow table.
 * Validates that the subscription belongs to the authenticated user and is currently paused.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { ssoUpdateSubscriptionStatus, ssoSyncSubscription } from '../../../lib/sso-client';
import { syncSubscriptionCache } from '../../../lib/sync-shadow';

export async function handleResumeSubscription(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; SSO_SERVICE: Fetcher };

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

    // Validate subscription belongs to user and is paused (read from shadow table)
    const { data: existing, error: fetchError } = await supabase
      .from('subscription_cache')
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

    // Write status change through SSO worker (auth DB is source of truth)
    const ssoResult = await ssoUpdateSubscriptionStatus(env, subscriptionId, {
      status: 'active',
    });

    // Sync shadow table (non-blocking on failure)
    try {
      const syncResult = await ssoSyncSubscription(env, user.sub);
      if (syncResult.subscription) {
        await syncSubscriptionCache(supabase, syncResult.subscription, syncResult.plan);
      }
    } catch (syncError) {
      console.error('[ResumeSubscription] Shadow sync failed (non-blocking):', syncError);
    }

    return new Response(
      JSON.stringify({ success: true, subscription: ssoResult }),
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
