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
import { ssoCreateSubscription, ssoUpdateSubscriptionField } from '../../../lib/sso-client';
import { syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';
import { apiSuccess, apiError } from '../../../lib/response';
import { requireSelfServePlan, assertPlanPurchaseScope, subscriptionForUpgrade, catalogPlanErrorResponse } from '../lib/salesPlan';
import { completePlanSelection, isSubscriptionCurrent } from '../../../shared/lib/org-subscription';

const logger = createLogger('payments:create-order');
const COLLEGE_LEARNER_PROMO_CODE = 'RAREMINDS2026';
const COLLEGE_LEARNER_PROMO_STARTER_AMOUNT_ADDON = 501;
const COLLEGE_LEARNER_PROMO_STARTER_PLAN_CODES = ['skill_starter'];
const COLLEGE_LEARNER_PROMO_STARTER_PLAN_NAMES = ['skill starter'];
const COLLEGE_LEARNER_DISABLED_PLAN_CODES = ['discover', 'career_builder', 'career_accelerator'];

const normalizePromoCode = (code: unknown): string =>
  String(code || '').trim().toUpperCase();

async function isCollegeLearnerRestrictedPlan(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  userEmail: string | undefined,
  planId: unknown,
): Promise<boolean> {
  if (!planId) return false;

  let userQuery = supabase
    .from('users')
    .select('role, metadata');

  if (userEmail) {
    userQuery = userQuery.eq('email', userEmail);
  } else {
    userQuery = userQuery.eq('id', userId);
  }

  const [{ data: userRow }, { data: planRow }] = await Promise.all([
    userQuery.maybeSingle(),
    supabase
      .from('plans_cache')
      .select('plan_code, business_type')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  const metadata = (userRow?.metadata || {}) as Record<string, unknown>;
  const referralCode = normalizePromoCode(metadata.referralCode || metadata.referral_code);
  const planCode = String(planRow?.plan_code || '').toLowerCase();

  return (
    userRow?.role === 'learner' &&
    planRow?.business_type === 'b2c' &&
    referralCode === COLLEGE_LEARNER_PROMO_CODE &&
    COLLEGE_LEARNER_DISABLED_PLAN_CODES.includes(planCode)
  );
}

async function isCollegeLearnerPromoStarterPlan(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  userEmail: string | undefined,
  plan: { plan_code?: string | null; name?: string | null; business_type?: string | null },
  requestReferralCode?: unknown,
): Promise<boolean> {
  let userQuery = supabase
    .from('users')
    .select('role, metadata');

  if (userEmail) {
    userQuery = userQuery.eq('email', userEmail);
  } else {
    userQuery = userQuery.eq('id', userId);
  }

  const { data: userRow } = await userQuery.maybeSingle();
  const metadata = (userRow?.metadata || {}) as Record<string, unknown>;
  const referralCode = normalizePromoCode(requestReferralCode || metadata.referralCode || metadata.referral_code);
  const planCode = String(plan.plan_code || '').toLowerCase();
  const planName = String(plan.name || '').trim().toLowerCase();

  return (
    userRow?.role === 'learner' &&
    plan.business_type === 'b2c' &&
    referralCode === COLLEGE_LEARNER_PROMO_CODE &&
    (
      COLLEGE_LEARNER_PROMO_STARTER_PLAN_CODES.includes(planCode) ||
      COLLEGE_LEARNER_PROMO_STARTER_PLAN_NAMES.includes(planName)
    )
  );
}

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


    const supabase = getServiceClient(env);
    const catalogPlan = await requireSelfServePlan(supabase, { plan_id: body.planId });
    const scope = await assertPlanPurchaseScope(supabase, catalogPlan, user);
    if (body.amount === 0) {
      const config = catalogPlan.entity_config?.[scope.organizationType || 'all'] || catalogPlan.entity_config?.all || {};
      const pricing = catalogPlan.pricing_matrix?.[scope.organizationType || 'all'] || catalogPlan.pricing_matrix?.all;
      const billingCycle = config.duration || 'yearly';
      const price = billingCycle === 'monthly' ? pricing?.monthly : pricing?.yearly;
      if (price !== 0) return apiError(400, 'PRICE_MISMATCH', 'The selected plan is not free.', context.request);
      const isOrganization = catalogPlan.business_type === 'b2b';
      let existingQuery = supabase.from('subscription_cache').select('*')
        .eq('user_id', user.id).eq('is_organization_subscription', isOrganization)
        .in('status', ['active', 'pending', 'paused', 'grace_period']);
      if (scope.organizationId) existingQuery = existingQuery.eq('organization_id', scope.organizationId);
      const { data: subscriptions, error: existingError } = await existingQuery;
      if (existingError) return apiError(503, 'SUBSCRIPTION_UNAVAILABLE', 'Unable to verify your subscription.', context.request);
      const { data: profile, error: profileError } = await supabase.from('users').select('metadata').eq('id', user.id).maybeSingle();
      if (profileError || !profile) return apiError(503, 'SUBSCRIPTION_UNAVAILABLE', 'Unable to verify your plan selection. Please retry.', context.request);
      const rows = subscriptions || [];
      const expired = (sub: typeof rows[number]) => sub.status !== 'pending' && Boolean(sub.subscription_end_date)
        && Number.isFinite(Date.parse(sub.subscription_end_date))
        && !isSubscriptionCurrent(sub) && Date.parse(sub.subscription_end_date) <= Date.now();
      const replaceableDefault = (sub: typeof rows[number]) => !isOrganization
        && profile.metadata?.subscription_selection_required === true
        && sub.status === 'active' && sub.plan_amount != null && Number(sub.plan_amount) === 0;
      const existing = rows.find(sub => sub.plan_id === catalogPlan.id && sub.status === 'active' && isSubscriptionCurrent(sub));
      const conflict = rows.find(sub => sub.id !== existing?.id && !expired(sub) && !replaceableDefault(sub));
      if (conflict) {
        const planName = conflict.plan_name || conflict.plan_type || 'another plan';
        const message = conflict.status === 'pending'
          ? `Your subscription to ${planName} is still being activated. Please retry shortly before selecting another plan.`
          : `You already have a ${conflict.status} subscription to ${planName}. Open My Subscription to manage it before switching to ${catalogPlan.name}.`;
        return apiError(409, 'SUBSCRIPTION_CONFLICT', message, context.request);
      }
      // Retire only expired contracts or unselected zero-cost defaults. Paid coverage is preserved.
      for (const sub of rows.filter(sub => sub.id !== existing?.id && (expired(sub) || replaceableDefault(sub)))) {
        const retired = await ssoUpdateSubscriptionField(env, sub.id, { status: 'expired' });
        await syncSubscriptionCache(supabase, retired);
      }
      const subscription = existing || await ssoCreateSubscription(env, {
        user_id: user.id, email: user.email, full_name: typeof body.userName === 'string' ? body.userName : '',
        plan_id: catalogPlan.id, plan_code: catalogPlan.plan_code, plan_type: catalogPlan.name,
        plan_amount: 0, billing_cycle: billingCycle, features: catalogPlan.base_features || [],
        organization_id: scope.organizationId, organization_type: scope.organizationType,
        is_organization_subscription: isOrganization,
      });
      await syncUserShadow(supabase, user.id, user.email);
      await syncSubscriptionCache(supabase, subscription, catalogPlan);
      await completePlanSelection(supabase, user.id, catalogPlan.id);
      return apiSuccess({ isFreemium: true, data: {
        id: subscription.id, userId: user.id, planId: catalogPlan.id,
        planCode: catalogPlan.plan_code, planName: catalogPlan.name, status: subscription.status,
        startDate: subscription.subscription_start_date, endDate: subscription.subscription_end_date,
        autoRenew: subscription.auto_renew,
      } }, context.request);
    }

    // Reject incompatible active coverage before creating another payable order.
    const current = await subscriptionForUpgrade(supabase, user.id, catalogPlan, scope.organizationId);
    if (current && (current.status === 'pending' || isSubscriptionCurrent(current))) {
      if (current.status === 'pending') return apiError(409, 'SUBSCRIPTION_PENDING', 'Your existing subscription is still activating. Please retry; do not pay again.', context.request);
      const selectedPrice = Number(body.amount) / 100;
      if (current.plan_id === catalogPlan.id || (current.plan_amount != null && selectedPrice <= Number(current.plan_amount))) {
        return apiError(409, 'SUBSCRIPTION_CONFLICT', 'You already have this plan or a higher-priced active plan. Open My Subscription to manage it; no new payment is required.', context.request);
      }
    }

    // Validate amount against DB plan price (industrial-grade: never trust client)
    if (body.planId) {
      const supabase = getServiceClient(env);
      if (await isCollegeLearnerRestrictedPlan(supabase, user.id, user.email, body.planId)) {
        return apiError(403, 'PLAN_NOT_AVAILABLE', 'This plan is not available for this referral code.', context.request);
      }

      const { data: dbPlan } = await supabase
        .from('plans_cache')
        .select('plan_code, name, business_type, pricing_matrix')
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
      const allowPromoStarterAmount = await isCollegeLearnerPromoStarterPlan(supabase, user.id, user.email, dbPlan, body.referralCode);

      if (pricingMatrix) {
        for (const key in pricingMatrix) {
          const price = pricingMatrix[key]?.yearly;
          if (typeof price === 'number') {
            const expectedPaise = Math.round(price * 100);
            const promoExpectedPaise = Math.round((price + COLLEGE_LEARNER_PROMO_STARTER_AMOUNT_ADDON) * 100);
            if (clientAmount === expectedPaise || (allowPromoStarterAmount && clientAmount === promoExpectedPaise)) {
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
        org_id: scope.organizationId || '',
        organization_type: scope.organizationType || '',
        plan_id: (body.planId as string) || '',
        plan_name: catalogPlan.name,
        referral_code: (body.referralCode as string) || '',
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
    if (error instanceof Error && (/duplicate key|23505/i.test(error.message)
      || ('status' in error && error.status === 409))) {
      return apiError(409, 'SUBSCRIPTION_CONFLICT', 'Your subscription changed while selecting this plan. Refresh the page to check its status before trying again.', context.request);
    }
    return catalogPlanErrorResponse(error, context.request) || rpcErrorResponse(error, context.request);
  }
}
