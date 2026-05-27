/**
 * Cancel Subscription Handler
 *
 * POST /api/payments/subscription/:id/cancel
 *
 * Cancels a Razorpay subscription via the payment-worker RPC binding,
 * then updates subscription status through the SSO worker (auth DB)
 * and syncs the local shadow table.
 * Requires SSO authentication.
 */

import { withAuth, getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { ssoUpdateSubscriptionStatus, ssoSyncSubscription } from '../../../lib/sso-client';
import { syncSubscriptionCache } from '../../../lib/sync-shadow';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const match = path.match(/\/subscription\/([^/]+)\/cancel/);
  const subscriptionId = match ? match[1] : null;

  if (!subscriptionId) {
    return new Response(
      JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Subscription ID is required' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handleCancelSubscription(context, subscriptionId);
});

export async function handleCancelSubscription(context: AuthenticatedContext, subscriptionId: string): Promise<Response> {
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher };
  const user = getContextUser(context);

  try {
    // Verify ownership: subscription must belong to the authenticated user
    const { getServiceClient } = await import('../../../lib/supabase');
    const supabase = getServiceClient(env as any);
    const { data: sub } = await supabase
      .from('subscription_cache')
      .select('id')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub) {
      return new Response(
        JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Subscription not found or access denied' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call payment-worker via RPC — worker validates ID format and calls Razorpay
    const worker = getPaymentWorker(env);
    await worker.cancelSubscription(subscriptionId);

    // Write status change through SSO worker (auth DB is source of truth)
    const ssoResult = await ssoUpdateSubscriptionStatus(env, subscriptionId, {
      status: 'cancelled',
      cancelled_by: user.id,
    });

    // Sync shadow table (non-blocking on failure)
    try {
      const syncResult = await ssoSyncSubscription(env, user.id);
      if (syncResult.subscription) {
        await syncSubscriptionCache(supabase, syncResult.subscription, syncResult.plan);
      }
    } catch (syncError) {
      console.error('[CancelSubscription] Shadow sync failed (non-blocking):', syncError);
    }

    return new Response(JSON.stringify({ success: true, subscription: ssoResult }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CancelSubscription] Error:', error);
    return rpcErrorResponse(error);
  }
}
