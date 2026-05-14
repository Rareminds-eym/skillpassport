/**
 * Cancel Subscription Handler
 *
 * POST /api/payments/subscription/:id/cancel
 *
 * Cancels a Razorpay subscription via the payment-worker RPC binding.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { invalidateUserSubscriptionCache } from '../../../shared/lib/cache';

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
  const env = context.env as unknown as PaymentWorkerEnv;
  const user = context.data.user;

  try {
    // Verify ownership: subscription must belong to the authenticated user
    const { getServiceClient } = await import('../../../lib/supabase');
    const supabase = getServiceClient(env as any);
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('id', subscriptionId)
      .eq('user_id', user.sub)
      .maybeSingle();

    if (!sub) {
      return new Response(
        JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Subscription not found or access denied' } }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call payment-worker via RPC — worker validates ID format and calls Razorpay
    const worker = getPaymentWorker(env);
    const subscription = await worker.cancelSubscription(subscriptionId);

    // Invalidate subscription cache for this user
    const cacheKV = (env as any).CACHE_KV as KVNamespace | undefined;
    await invalidateUserSubscriptionCache(cacheKV, user.sub);

    return new Response(JSON.stringify({ success: true, subscription }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CancelSubscription] Error:', error);
    return rpcErrorResponse(error);
  }
}
