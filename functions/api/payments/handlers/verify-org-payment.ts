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


import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getPaymentWorker, rpcErrorResponse, type PaymentWorkerEnv } from '../lib/paymentBinding';
import { getServiceClient } from '../../../lib/supabase';
import {
  ssoCreateSubscription,
  ssoRecordTransaction,
  ssoSyncSubscription,
} from '../../../lib/sso-client';
import { syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleVerifyOrgPayment(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as unknown as PaymentWorkerEnv & { SSO_SERVICE: Fetcher };

  try {
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return apiError(400, 'VALIDATION_ERROR', 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required', context.request);
    }

    if (!body.org_id || typeof body.org_id !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'org_id is required', context.request);
    }

    if (!body.plan_name || typeof body.plan_name !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'plan_name is required', context.request);
    }

    const supabase = getServiceClient(env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });

    // Guard: Verify user is an admin or owner of the organization
    const { data: membership } = await supabase
      .from('license_assignments')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('organization_id', body.org_id as string)
      .limit(1)
      .maybeSingle();

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return apiError(403, 'FORBIDDEN', 'Not authorized for this organization', context.request);
    }

    // Step 1: Verify Razorpay HMAC signature via payment-worker RPC (unchanged)
    const worker = getPaymentWorker(env);
    const verifyResult = await worker.verifyPaymentSignature(
      body.razorpay_order_id as string,
      body.razorpay_payment_id as string,
      body.razorpay_signature as string
    );

    // Step 1.5: Verify payment was actually captured (Amount Spoofing Prevention)
    const payment = await worker.getPayment(body.razorpay_payment_id as string);
    if (payment.status !== 'captured' || payment.order_id !== body.razorpay_order_id) {
      return apiError(400, 'VALIDATION_ERROR', 'Payment not captured or order ID mismatch', context.request);
    }

    // Parameter Tampering Prevention
    if (payment.notes?.org_id && payment.notes.org_id !== body.org_id) {
      return apiError(400, 'VALIDATION_ERROR', 'Org ID mismatch with original order', context.request);
    }
    if (payment.notes?.seat_count && payment.notes.seat_count !== String(body.seat_count || 1)) {
      return apiError(400, 'VALIDATION_ERROR', 'Seat count mismatch with original order', context.request);
    }

    // Step 2: Signature valid — create org subscription in auth DB
    
    if (!body.billing_cycle || typeof body.billing_cycle !== 'string') {
      return apiError(400, 'VALIDATION_ERROR', 'billing_cycle is required', context.request);
    }

    const seatCount = typeof body.seat_count === 'number' ? body.seat_count : 1;
    const planAmount = payment.amount;
    const billingCycle = body.billing_cycle as string;

    const now = new Date();
    const endDate = new Date(now);
    const durationMonths = parseDurationMonths(billingCycle);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    let subscription: Record<string, unknown>;
    try {
      subscription = await ssoCreateSubscription(env, {
        user_id: user.id,
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
        purchased_by: user.id,
      });
    } catch (createError: any) {
      if (createError.message?.includes('duplicate key') || createError.message?.includes('23505') || createError.status === 409) {
        console.log('[VerifyOrgPayment] Org subscription already created by webhook (duplicate caught).');
        return apiSuccess({ ...verifyResult, subscription_created: true, already_fulfilled: true }, context.request);
      }
      console.error('[VerifyOrgPayment] Subscription creation failed:', createError.message);
      return apiSuccess({
        ...verifyResult,
        subscription_created: false,
        error: {
          code: 'SUBSCRIPTION_CREATE_FAILED',
          message: 'Payment verified but org subscription creation failed. Please contact support.',
          details: createError.message,
        },
      }, context.request, 207);
    }

    // Step 3: Record transaction in auth DB
    try {
      await ssoRecordTransaction(env, {
        subscription_id: subscription.id as string,
        user_id: user.id,
        razorpay_payment_id: body.razorpay_payment_id as string,
        razorpay_order_id: body.razorpay_order_id as string,
        razorpay_signature: body.razorpay_signature as string,
        amount: planAmount / 100,
        currency: (body.currency as string) || 'INR',
        payment_method: payment.method,
        status: 'completed',
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
      // Ensure user exists in users_shadow (FK constraint for subscription_cache)
      await syncUserShadow(supabase, user.id, (user as any).email);

      const syncData = await ssoSyncSubscription(env, user.id);
      if (syncData.subscription) {
        await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
      }
    } catch (syncError) {
      console.error('[VerifyOrgPayment] Shadow sync failed (non-critical):', syncError);
    }

    return apiSuccess({
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
    }, context.request);
  } catch (error) {
    console.error('[VerifyOrgPayment] Error:', error);
    return rpcErrorResponse(error, context.request);
  }
}

function parseDurationMonths(duration: string): number {
  const lower = duration.toLowerCase();
  if (lower.includes('annual') || lower.includes('year')) return 12;
  if (lower.includes('quarter')) return 3;
  if (lower.includes('month')) return 1;
  return 1;
}
