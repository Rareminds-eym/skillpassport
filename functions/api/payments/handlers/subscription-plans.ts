/**
 * Subscription Plans Handler
 *
 * GET /api/payments/subscription-plans
 *
 * Queries Supabase directly for all active subscription plans.
 * Transforms the raw DB schema into the shape the frontend expects.
 * Does NOT require SSO authentication — this is public catalog data.
 */


import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';
import { getAuthInstance } from '../../../lib/auth';

const COLLEGE_LEARNER_PROMO_CODE = 'RAREMINDS2026';
const COLLEGE_LEARNER_ALLOWED_PLAN_CODE = 'skill_starter';
const COLLEGE_LEARNER_DISABLED_PLAN_CODES = ['discover', 'career_builder', 'career_accelerator'];

const normalizePromoCode = (code: unknown): string =>
  String(code || '').trim().toUpperCase();

const getPlanCode = (plan: Record<string, unknown>): string => {
  const explicitCode = plan.plan_code || plan.planCode || plan.code;
  const fallbackCode = plan.display_name || plan.name;

  return String(explicitCode || fallbackCode || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

/**
 * Transform a raw subscription_plans row into the shape the frontend PlanCard expects.
 *
 * DB schema:
 *   - pricing_matrix: { "all": { "monthly": 499, "yearly": 4999, "currency": "INR" } }
 *   - entity_config: { "all": { "tagline": "...", "is_recommended": true, ... } }
 *   - base_features: ["feature_key_1", "feature_key_2", ...]
 *
 * Frontend expects:
 *   - plan.price (number — monthly price)
 *   - plan.yearlyPrice (number)
 *   - plan.currency (string)
 *   - plan.tagline (string)
 *   - plan.recommended (boolean)
 *   - plan.features (array of feature objects or strings)
 *   - plan.ideal_for (string)
 *   - plan.description (string)
 *   - plan.max_users (number)
 */
function transformPlan(raw: Record<string, unknown>, entityType: string): Record<string, unknown> {
  const pricingMatrix = (raw.pricing_matrix as Record<string, Record<string, unknown>>) || {};
  const entityConfig = (raw.entity_config as Record<string, Record<string, unknown>>) || {};

  // Resolve pricing for the requested entity type, fallback to 'all'
  const pricing = pricingMatrix[entityType] || pricingMatrix['all'] || {};
  // Resolve config for the requested entity type, fallback to 'all'
  const config = entityConfig[entityType] || entityConfig['all'] || {};

  // Transform base_features from string keys to feature objects
  const baseFeatures = (raw.base_features as string[]) || [];
  const features = baseFeatures.map((key: string) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    feature_key: key,
  }));

  return {
    id: raw.id,
    name: raw.name,
    plan_code: raw.plan_code,
    business_type: raw.business_type,
    // Flat pricing fields the frontend expects
    // Note: paid plans are yearly-only. monthly = yearly for backward compat.
    price: pricing.yearly ?? pricing.monthly ?? 0,
    yearlyPrice: pricing.yearly ?? 0,
    currency: (pricing.currency as string) || 'INR',
    duration: (config.duration as string) ?? 'yearly',
    // Config fields
    tagline: (config.tagline as string) || '',
    recommended: (config.is_recommended as boolean) || false,
    ideal_for: (config.ideal_for as string) || '',
    description: (config.description as string) || '',
    max_users: (config.max_users as number) ?? 1,
    positioning: (config.positioning as string) || '',
    color: (config.color as string) || '',
    display_name: (config.display_name as string) || raw.name,
    // Features
    features,
    base_features: baseFeatures,
    // Preserve raw fields for any component that needs them
    pricing_matrix: raw.pricing_matrix,
    entity_config: raw.entity_config,
    display_order: raw.display_order,
  };
}

async function getOptionalUserIdentity(
  request: Request,
  env: Record<string, unknown>,
): Promise<{ id: string | null; email: string | null }> {
  const authorization = request.headers.get('Authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token || !env.SSO_SERVICE || typeof env.SSO_SERVICE !== 'object') {
    return { id: null, email: null };
  }

  try {
    const auth = getAuthInstance(env);
    let identity = { id: null, email: null } as { id: string | null; email: string | null };
    const response = await auth.authenticate((_req, authedContext) => {
      identity = {
        id: authedContext.user.sub || null,
        email: authedContext.user.email || null,
      };
      return new Response(null, { status: 204 });
    })(request);

    if (response.status === 401 || response.status === 403) {
      return { id: null, email: null };
    }

    return {
      id: identity.id,
      email: identity.email,
    };
  } catch {
    return { id: null, email: null };
  }
}

async function getStoredReferralCode(
  supabase: ReturnType<typeof getServiceClient>,
  identity: { id: string | null; email: string | null },
): Promise<string> {
  if (!identity.id && !identity.email) return '';

  let query = supabase
    .from('users')
    .select('metadata');

  if (identity.email) {
    query = query.eq('email', identity.email);
  } else {
    query = query.eq('id', identity.id);
  }

  const { data } = await query.maybeSingle();

  const metadata = (data?.metadata || {}) as Record<string, unknown>;
  return normalizePromoCode(metadata.referralCode || metadata.referral_code);
}

function applyCollegeLearnerPromoRules(plans: Record<string, unknown>[]): Record<string, unknown>[] {
  return plans
    .map((plan) => {
      const planCode = getPlanCode(plan);
      const isDisabled =
        planCode !== COLLEGE_LEARNER_ALLOWED_PLAN_CODE &&
        COLLEGE_LEARNER_DISABLED_PLAN_CODES.includes(planCode);

      return {
        ...plan,
        recommended: isDisabled ? false : plan.recommended,
        hidePrice: isDisabled,
        isDisabled,
        availabilityLabel: isDisabled ? 'Not available' : undefined,
        actionLabel: isDisabled ? 'Get Started' : undefined,
      };
    });
}

export async function handleSubscriptionPlans(context: { request: Request; env: Record<string, unknown> }): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const url = new URL(context.request.url);
    const businessType = url.searchParams.get('businessType') || 'b2c';
    const entityType = url.searchParams.get('entityType') || 'all';
    const roleType = url.searchParams.get('roleType') || 'all';
    const referralCodeFromQuery = normalizePromoCode(
      url.searchParams.get('referralCode') ||
      url.searchParams.get('referral_code') ||
      url.searchParams.get('promo') ||
      url.searchParams.get('promoCode') ||
      url.searchParams.get('code')
    );

    const supabase = getServiceClient(env);

    let query = supabase
      .from('plans_cache')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Filter by business type if provided (b2b or b2c)
    if (businessType) {
      query = query.eq('business_type', businessType);
    }

    // Filter by entity type if provided (school, college, university)
    // 'all' means no entity filter — return plans applicable to all entities
    if (entityType && entityType !== 'all') {
      query = query.overlaps('applicable_entities', [entityType, 'all']);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SubscriptionPlans] Supabase error:', error);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch subscription plans', context.request);
    }

    // Transform raw DB rows into the shape the frontend expects
    let plans = (data || []).map((row: Record<string, unknown>) => transformPlan(row, entityType));

    // Enrich with detailed features from subscription_plan_features (legacy table).
    // This is a graceful fallback — plans_cache.base_features is the primary source.
    // After Phase 10 cleanup drops the legacy table, this block silently no-ops.
    const planIds = plans.map((p: Record<string, unknown>) => p.id);
    if (planIds.length > 0) {
      try {
        const { data: featuresData } = await supabase
          .from('subscription_plan_features')
          .select('*')
          .in('plan_id', planIds)
          .order('display_order', { ascending: true });

        // Attach detailed features to each plan
        if (featuresData && featuresData.length > 0) {
          const featuresByPlan: Record<string, unknown[]> = {};
          for (const f of featuresData) {
            const planId = f.plan_id as string;
            if (!featuresByPlan[planId]) featuresByPlan[planId] = [];
            featuresByPlan[planId].push(f);
          }

          for (const plan of plans) {
            const detailedFeatures = featuresByPlan[plan.id as string];
            if (detailedFeatures) {
              (plan as Record<string, unknown>).detailedFeatures = detailedFeatures;
              (plan as Record<string, unknown>).features = detailedFeatures.map((f: unknown) => {
                const feat = f as Record<string, unknown>;
                return {
                  name: feat.feature_name,
                  feature_key: feat.feature_key,
                  value: feat.feature_value,
                  category: feat.category,
                  is_included: feat.is_included,
                  is_addon: feat.is_addon,
                };
              });
            }
          }
        }
      } catch (featureErr) {
        // Non-critical: subscription_plan_features may not exist after Phase 10 cleanup
        console.warn('[SubscriptionPlans] subscription_plan_features query failed (non-critical):', featureErr);
      }
    }

    const userIdentity = await getOptionalUserIdentity(context.request, context.env);
    const storedReferralCode = await getStoredReferralCode(supabase, userIdentity);
    const referralCode = storedReferralCode || referralCodeFromQuery;

    if (
      businessType === 'b2c' &&
      roleType === 'learner' &&
      referralCode === COLLEGE_LEARNER_PROMO_CODE
    ) {
      plans = applyCollegeLearnerPromoRules(plans);
    }

    return apiSuccess({ plans }, context.request, 200);
  } catch (error) {
    console.error('[SubscriptionPlans] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to fetch subscription plans', context.request);
  }
}
