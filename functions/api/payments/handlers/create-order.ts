/**
 * Create Order Handler
 *
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order via the payment-worker RPC binding.
 * Requires SSO authentication.
 */

import { withAuth, getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { createLogger } from '../../../lib/logger';
import { getServiceClient } from '../../../lib/supabase';
import { ssoCreateFreemiumSubscription, ssoSyncSubscription } from '../../../lib/sso-client';
import { syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';
import { apiSuccess, apiError } from '../../../lib/response';

const logger = createLogger('payments:create-order');

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleCreateOrder(context);
});

export async function handleCreateOrder(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher; SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    // Validate required fields
    if (body.amount === undefined || typeof body.amount !== 'number') {
      return apiError(400, 'VALIDATION_ERROR', 'amount is required and must be a number', context.request);
    }


    // Check if it's a freemium or zero-cost plan
    const isFreemium = body.amount === 0 || body.planId === 'freemium' || body.planName?.toString().toLowerCase() === 'freemium';

    if (isFreemium) {
      // Direct freemium subscription creation logic
      const supabase = getServiceClient(env);

      // Ensure user exists in shadow table
      await syncUserShadow(supabase, user.id, (body.userEmail as string) || user.email);

      // Create subscription in auth DB via SSO worker RPC
      let subscription: Record<string, unknown>;
      try {
        subscription = await ssoCreateFreemiumSubscription(env, {
          user_id: user.id,
          email: (body.userEmail as string) || user.email,
          full_name: (body.userName as string) || (user as any).name || 'Freemium User',
        });
      } catch (ssoError: any) {
        // Handle missing SSO_SERVICE binding (local dev or misconfiguration)
        if (ssoError.message?.includes('SSO_SERVICE binding is not configured')) {
          logger.error('SSO_SERVICE binding not available:', ssoError.message);
          return apiError(503, 'ERROR', 'Subscription service is temporarily unavailable. Please try again later.', context.request);
        }
        if (ssoError.message?.includes('23505') || ssoError.message?.includes('duplicate')) {
           return apiError(409, 'CONFLICT', 'User already has an active subscription', context.request);
        }
        throw ssoError;
      }

      // Sync shadow table
      try {
        const syncData = await ssoSyncSubscription(env, user.id);
        if (syncData.subscription) {
          await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
        }
      } catch (syncError) {
        console.error('[CreateOrder] Shadow sync failed:', syncError);
      }

      // Return simulated success response structure expected by frontend for freemium
      return apiSuccess({
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
      }, context.request);
    }

   


    // Validate amount against DB plan price (industrial-grade: never trust client)
    if (body.planId) {
      const supabase = getServiceClient(env);
      const { data: dbPlan } = await supabase
        .from('plans_cache')
        .select('pricing_matrix')
        .eq('id', body.planId)
        .eq('is_active', true)
        .maybeSingle();

      if (!dbPlan) {
        logger.warn('Plan not found in plans_cache', { planId: body.planId });
        return apiError(404, 'NOT_FOUND', 'Plan not found or inactive', context.request);
      }

      const pricingMatrix = dbPlan.pricing_matrix as Record<string, any>;
      const clientAmount = body.amount as number;
      let isValidPrice = false;

      if (pricingMatrix) {
        for (const key in pricingMatrix) {
          const price = pricingMatrix[key]?.yearly;
          if (typeof price === 'number') {
            const expectedPaise = Math.round(price * 100);
            if (clientAmount === expectedPaise) {
              isValidPrice = true;
              break;
            }
          }
        }
      }

      if (!isValidPrice) {
        logger.warn('Price mismatch or no valid pricing found', { clientAmount, planId: body.planId, pricingMatrix });
        return apiError(400, 'VALIDATION_ERROR', 'Plan price does not match. Please refresh and try again.', context.request);
      }
    }

    // Call payment-worker via Service Binding RPC
    const worker = getPaymentWorker(env);
    const order = await worker.createOrder({
      amount: body.amount as number,
      currency: (body.currency as string) || undefined,
      receipt: (body.receipt as string) || undefined,
      notes: {
        ...(body.notes as Record<string, string> || {}),
        user_id: user.id,
        user_email: user.email || '',
        org_id: user.org_id || '',
        plan_id: (body.planId as string) || '',
        plan_name: (body.planName as string) || '',
        type: 'subscription',
      },
    });

    // Validate that payment worker returned key_id
    if (!order.key_id) {
      logger.error('Payment worker did not return key_id');
      return apiError(500, 'INTERNAL_ERROR', 'Payment worker configuration error', context.request);
    }

    // Return order with key_id from payment worker
    // The payment worker injects key_id to ensure it matches the key used to create the order
    return apiSuccess({ ...order, razorpay_key_id: order.key_id }, context.request);
  } catch (error) {
    logger.error('Error creating order', error);
    return rpcErrorResponse(error, context.request);
  }
}
