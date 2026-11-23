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
import { isSalesOnlyPlan } from '../lib/salesPlan';
import { confirmPromoRedemption, isDidacAllowedPlan, isSupportedPromoRole } from '../lib/promoCode';

const normalizePromoCode = (code: unknown): string =>
  String(code || '').trim().toUpperCase();

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
export function transformPlan(raw: Record<string, unknown>, entityType: string): Record<string, unknown> {
  const pricingMatrix = (raw.pricing_matrix as Record<string, Record<string, unknown>>) || {};
  const entityConfig = (raw.entity_config as Record<string, Record<string, unknown>>) || {};

  // Resolve pricing for the requested entity type, fallback to 'all'
  const pricing = pricingMatrix[entityType] || pricingMatrix['all'] || {};
  // Resolve config for the requested entity type, fallback to 'all'
  const config = { ...entityConfig['all'], ...entityConfig[entityType] };
  const contactSales = isSalesOnlyPlan(raw);

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
    price: contactSales ? null : pricing.yearly ?? pricing.monthly ?? 0,
    yearlyPrice: contactSales ? null : pricing.yearly ?? 0,
    contactSales,
    salesEmail: (typeof config.sales_email === 'string' && config.sales_email.trim() && config.sales_email.trim() !== 'sales@skillpassport.in')
      ? config.sales_email.trim()
      : 'marketing@rareminds.in',
    salesPhone: (typeof config.sales_phone === 'string' && config.sales_phone.trim())
      ? config.sales_phone.trim()
      : '+91 9902326951',
    salesHighlights: Array.isArray(config.sales_highlights) ? config.sales_highlights.filter(value => typeof value === 'string') : [],
    priceLabel: typeof config.price_label === 'string' ? config.price_label : '',
    termsNote: typeof config.terms_note === 'string' ? config.terms_note : '',
    currency: (pricing.currency as string) || 'INR',
    duration: (config.duration as string) ?? 'yearly',
    // Config fields
    tagline: (config.tagline as string) || '',
    recommended: (config.is_recommended as boolean) || false,
    ideal_for: (config.ideal_for as string) || '',
    description: (config.description as string) || '',
    max_users: contactSales ? null : (config.max_users as number) ?? 1,
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

async function getStoredReferralCodeAndRole(
  supabase: ReturnType<typeof getServiceClient>,
  identity: { id: string | null; email: string | null },
): Promise<{ referralCode: string; role: string | null }> {
  if (!identity.id && !identity.email) return { referralCode: '', role: null };

  let query = supabase
    .from('users')
    .select('metadata, role');

  if (identity.email) {
    query = query.eq('email', identity.email);
  } else {
    query = query.eq('id', identity.id);
  }

  const { data } = await query.maybeSingle();

  const metadata = (data?.metadata || {}) as Record<string, unknown>;
  return {
    referralCode: normalizePromoCode(metadata.referralCode || metadata.referral_code),
    role: (data?.role as string) || null,
  };
}

// priceAdjustment comes from the caller's already-confirmed promo_codes row
// (see confirmPromoRedemption) — applied here so the frontend can trust this
// response for BOTH gating and price display, with no client-side
// re-derivation of either (see SubscriptionPlans.jsx, Phase 3). Every plan
// other than the one role-specific eligible plan (isDidacAllowedPlan) is
// disabled — this is a generalization of the original learner-only rule,
// under which the three non-"skill_starter" learner plans were likewise
// always disabled together (i.e. "disabled" was already exactly "every
// other visible plan").
function applyDidacPromoRules(
  plans: Record<string, unknown>[],
  role: string,
  priceAdjustment: number,
): Record<string, unknown>[] {
  return plans
    .map((plan) => {
      const isAllowedPlan = isDidacAllowedPlan(role, plan as { plan_code?: unknown; name?: unknown });

      if (isAllowedPlan) {
        return {
          ...plan,
          price: typeof plan.price === 'number' ? plan.price + priceAdjustment : plan.price,
          yearlyPrice: typeof plan.yearlyPrice === 'number' ? plan.yearlyPrice + priceAdjustment : plan.yearlyPrice,
          hidePrice: false,
          isDisabled: false,
        };
      }

      return {
        ...plan,
        recommended: false,
        hidePrice: true,
        isDisabled: true,
        availabilityLabel: 'Not available',
        actionLabel: 'Get Started',
      };
    });
}

export async function handleSubscriptionPlans(context: { request: Request; env: Record<string, unknown> }): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const url = new URL(context.request.url);
    const businessType = url.searchParams.get('businessType') || 'b2c';
    const entityType = url.searchParams.get('entityType') || 'all';
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
    const { referralCode: storedReferralCode, role: storedRole } = await getStoredReferralCodeAndRole(supabase, userIdentity);
    const referralCode = storedReferralCode || referralCodeFromQuery;

    // DIDAC 2026: covers all three supported roles (learner, college_admin,
    // school_admin — see role_and_quota_rules in the TSD), keyed off the
    // user's actual DB role (server-truth), not the client-supplied
    // businessType/roleType query params. confirmPromoRedemption() commits
    // the redemption synchronously right here if it hasn't already landed
    // via withAuth()'s fire-and-forget hook, so pricing/eligibility is never
    // stale relative to a redemption that is still in flight.
    if (isSupportedPromoRole(storedRole) && referralCode && userIdentity.id) {
      const redemption = await confirmPromoRedemption(supabase, userIdentity.id, storedRole, referralCode);
      if (redemption) {
        plans = applyDidacPromoRules(plans, storedRole, redemption.priceAdjustment);
      }
    }

    return apiSuccess({ plans }, context.request, 200);
  } catch (error) {
    console.error('[SubscriptionPlans] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to fetch subscription plans', context.request);
  }
}
