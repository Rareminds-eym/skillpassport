/**
 * Create Order Handler
 *
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order via the payment-worker RPC binding.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { createLogger } from '../../../lib/logger';
import { getServiceClient } from '../../../lib/supabase';
import { ssoCreateFreemiumSubscription, ssoSyncSubscription } from '../../../lib/sso-client';
import { syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';

const logger = createLogger('payments:create-order');

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleCreateOrder(context);
});

export async function handleCreateOrder(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const user = context.data.user;
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher; SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (body.amount === undefined || typeof body.amount !== 'number') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'amount is required and must be a number' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }


    // Check if it's a freemium or zero-cost plan
    const isFreemium = body.amount === 0 || body.planId === 'freemium' || body.planName?.toString().toLowerCase() === 'freemium';

    if (isFreemium) {
      // Direct freemium subscription creation logic
      const supabase = getServiceClient(env);

      // Ensure user exists in shadow table
      await syncUserShadow(supabase, user.sub, (body.userEmail as string) || user.email);

      // Create subscription in auth DB via SSO worker RPC
      let subscription: Record<string, unknown>;
      try {
        subscription = await ssoCreateFreemiumSubscription(env, {
          user_id: user.sub,
          email: (body.userEmail as string) || user.email,
          full_name: (body.userName as string) || (user as any).name || 'Freemium User',
        });
      } catch (ssoError: any) {
        if (ssoError.message?.includes('23505') || ssoError.message?.includes('duplicate')) {
           return new Response(JSON.stringify({ error: { code: 'SUBSCRIPTION_EXISTS', message: 'User already has an active subscription' } }), { status: 409 });
        }
        throw ssoError;
      }

      // Sync shadow table
      try {
        const syncData = await ssoSyncSubscription(env, user.sub);
        if (syncData.subscription) {
          await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
        }
      } catch (syncError) {
        console.error('[CreateOrder] Shadow sync failed:', syncError);
      }

      // Return simulated success response structure expected by frontend for freemium
      return new Response(JSON.stringify({ 
        success: true,
        isFreemium: true,
        data: {
          id: subscription.id,
          userId: subscription.user_id,
          planId: subscription.plan_id,
          planCode: subscription.plan_code || 'freemium',
          planName: 'Freemium',
          status: subscription.status,
          startDate: subscription.subscription_start_date,
          endDate: subscription.subscription_end_date,
          autoRenew: subscription.auto_renew,
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

   


    // Call payment-worker via Service Binding RPC
    const worker = getPaymentWorker(env);
    const order = await worker.createOrder({
      amount: body.amount as number,
      currency: (body.currency as string) || undefined,
      receipt: (body.receipt as string) || undefined,
      notes: {
        ...(body.notes as Record<string, string> || {}),
        user_id: user.sub,
        user_email: user.email || '',
        org_id: user.org_id || '',
      },
    });

    // Validate that payment worker returned key_id
    if (!order.key_id) {
      logger.error('Payment worker did not return key_id');
      return new Response(
        JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Payment worker configuration error' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return order with key_id from payment worker
    // The payment worker injects key_id to ensure it matches the key used to create the order
    return new Response(JSON.stringify({
      ...order,
      razorpay_key_id: order.key_id, // Expose as razorpay_key_id for frontend
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Error creating order', error);
    return rpcErrorResponse(error);
  }
}
