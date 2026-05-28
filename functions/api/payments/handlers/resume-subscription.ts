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


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { ssoUpdateSubscriptionStatus, ssoSyncSubscription } from '../../../lib/sso-client';
import { syncSubscriptionCache } from '../../../lib/sync-shadow';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleResumeSubscription(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; SSO_SERVICE: Fetcher };

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    const subscriptionId = body.subscription_id as string;

    if (!subscriptionId) {
      return apiError(400, 'VALIDATION_ERROR', 'subscription_id is required', context.request);
    }

    const supabase = getServiceClient(env);

    // Validate subscription belongs to user and is paused (read from shadow table)
    const { data: existing, error: fetchError } = await supabase
      .from('subscription_cache')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[ResumeSubscription] Fetch error:', fetchError);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to verify subscription ownership', context.request);
    }

    if (!existing) {
      return apiError(404, 'NOT_FOUND', 'Subscription not found or does not belong to user', context.request);
    }

    if (existing.status !== 'paused') {
      return apiError(400, 'VALIDATION_ERROR', 'Only paused subscriptions can be resumed', context.request);
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
      const syncResult = await ssoSyncSubscription(env, user.id);
      if (syncResult.subscription) {
        await syncSubscriptionCache(supabase, syncResult.subscription, syncResult.plan);
      }
    } catch (syncError) {
      console.error('[ResumeSubscription] Shadow sync failed (non-blocking):', syncError);
    }

    return apiSuccess({ subscription: ssoResult }, context.request, 200);
  } catch (error) {
    console.error('[ResumeSubscription] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to resume subscription', context.request);
  }
}
