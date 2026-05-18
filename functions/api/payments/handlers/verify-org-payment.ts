/**
 * Verify Org Payment Handler
 *
 * POST /api/payments/verify-org-payment
 *
 * Verifies a Razorpay payment signature via the payment-worker RPC binding,
 * then creates an organization subscription in the auth DB via SSO worker
 * and syncs the shadow table in the app DB.
 *
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import {
  ssoCreateSubscription,
  ssoRecordTransaction,
  ssoSyncSubscription,
} from '../../../lib/sso-client';
import { syncSubscriptionCache } from '../../../lib/sync-shadow';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleVerifyOrgPayment(context);
});

function extractAuthToken(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No auth token found');
  }
  return authHeader.slice(7);
}

export async function handleVerifyOrgPayment(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher };

  try {
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_INPUT',
            message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.org_id || typeof body.org_id !== 'string') {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'org_id is required' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.plan_name || typeof body.plan_name !== 'string') {
      return new Response(
        JSON.stringify({
          error: { code: 'INVALID_INPUT', message: 'plan_name is required' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Verify Razorpay HMAC signature via payment-worker RPC (unchanged)
    const worker = getPaymentWorker(env);
    const verifyResult = await worker.verifyPaymentSignature(
      body.razorpay_order_id as string,
      body.razorpay_payment_id as string,
      body.razorpay_signature as string
    );

    // Step 2: Signature valid — create org subscription in auth DB
    const supabase = getServiceClient(env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });
    const authToken = extractAuthToken(context.request);

    const seatCount = typeof body.seat_count === 'number' ? body.seat_count : 1;
    const planAmount = typeof body.amount === 'number' ? body.amount : 0;
    const billingCycle = (body.billing_cycle as string) || 'monthly';

    const now = new Date();
    const endDate = new Date(now);
    const durationMonths = parseDurationMonths(billingCycle);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    let subscription: Record<string, unknown>;
    try {
      subscription = await ssoCreateSubscription(env, authToken, {
        user_id: user.sub,
        plan_id: (body.plan_id as string) || '',
        plan_code: (body.plan_code as string) || body.plan_name as string,
        plan_type: body.plan_name as string,
        plan_amount: planAmount / 100,
        billing_cycle: billingCycle,
        features: [],
        full_name: (user as any).name || user.email || '',
        email: user.email || '',
        phone: (user as any).phone || undefined,
        razorpay_order_id: body.razorpay_order_id as string,
        razorpay_payment_id: body.razorpay_payment_id as string,
        organization_id: body.org_id as string,
        organization_type: (body.org_type as string) || undefined,
        seat_count: seatCount,
        is_organization_subscription: true,
        is_bulk_purchase: true,
        purchased_by: user.sub,
      });
    } catch (createError: any) {
      console.error('[VerifyOrgPayment] Subscription creation failed:', createError.message);
      return new Response(JSON.stringify({
        success: true,
        ...verifyResult,
        subscription_created: false,
        error: {
          code: 'SUBSCRIPTION_CREATE_FAILED',
          message: 'Payment verified but org subscription creation failed. Please contact support.',
          details: createError.message,
        },
      }), {
        status: 207,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Record transaction in auth DB
    try {
      await ssoRecordTransaction(env, authToken, {
        subscription_id: subscription.id as string,
        user_id: user.sub,
        razorpay_payment_id: body.razorpay_payment_id as string,
        razorpay_order_id: body.razorpay_order_id as string,
        amount: planAmount / 100,
        currency: (body.currency as string) || 'INR',
        status: 'success',
        transaction_type: 'subscription',
        organization_id: body.org_id as string,
        is_bulk_purchase: true,
        seat_count: seatCount,
      });
    } catch (txError) {
      console.error('[VerifyOrgPayment] Transaction recording failed (non-critical):', txError);
    }

    // Step 4: Sync shadow table in app DB
    try {
      const syncData = await ssoSyncSubscription(env, authToken, user.sub);
      if (syncData.subscription) {
        await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
      }
    } catch (syncError) {
      console.error('[VerifyOrgPayment] Shadow sync failed (non-critical):', syncError);
    }

    return new Response(JSON.stringify({
      success: true,
      ...verifyResult,
      subscription_created: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_name: subscription.plan_type,
        org_id: subscription.organization_id,
        seat_count: subscription.seat_count,
        start_date: subscription.subscription_start_date,
        end_date: subscription.subscription_end_date,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[VerifyOrgPayment] Error:', error);
    return rpcErrorResponse(error);
  }
}

function parseDurationMonths(duration: string): number {
  const lower = duration.toLowerCase();
  if (lower.includes('annual') || lower.includes('year')) return 12;
  if (lower.includes('quarter')) return 3;
  if (lower.includes('month')) return 1;
  return 1;
}
