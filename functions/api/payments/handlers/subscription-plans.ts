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
import { createLogger } from '../../../lib/logger';
import { initAuth, verifyJWT, extractToken } from '@rareminds-eym/auth-core';
import { getPromoCampaign, applyCampaignToPlans } from '../lib/promo-campaigns';

const logger = createLogger('payments:subscription-plans');

const normalizePromoCode = (code: unknown): string =>
  String(code || '').trim().toUpperCase();

// ponytail: getPlanCode deleted — was only used by applyCollegeLearnerPromoRules

/**
 * Transform a raw subscription_plans row into the shape the frontend PlanCard expects.
 *
 * DB schema:
 *   - pricing_matrix: { "all": { "yearly": 4999, "currency": "INR" } }
 *   - entity_config: { "all": { "tagline": "...", "is_recommended": true, ... } }
 *   - base_features: ["feature_key_1", "feature_key_2", ...]
 *
 * Frontend expects:
 *   - plan.price (number — yearly price)
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
    // Flat pricing fields the frontend expects (plans are yearly-only)
    price: pricing.yearly ?? 0,
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
  const token = extractToken(request);
  if (!token || !env.SSO_SERVICE || typeof env.SSO_SERVICE !== 'object') {
    return { id: null, email: null };
  }

  try {
    initAuth({ ssoRpc: env.SSO_SERVICE as any });
  } catch {
    // auth-core may already be initialized in this Worker isolate.
  }

  try {
    const user = await verifyJWT(token);
    return {
      id: (user.sub || user.id || null) as string | null,
      email: (user.email || null) as string | null,
    };
  } catch {
    return { id: null, email: null };
  }
}

function parseUserMetadata(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'object' && raw !== null) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
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

  const metadata = parseUserMetadata(data?.metadata);
  return normalizePromoCode(metadata.referralCode || metadata.referral_code || metadata.promoCode || metadata.promo);
}

// ponytail: applyCollegeLearnerPromoRules deleted — replaced by generic applyCampaignToPlans in promo-campaigns.ts

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
      logger.error('fetch_subscription_plans_failed', error, { businessType, entityType });
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
        logger.warn('detailed_features_lookup_failed', { error: String(featureErr) });
      }
    }

    const userIdentity = await getOptionalUserIdentity(context.request, context.env);
    const storedReferralCode = await getStoredReferralCode(supabase, userIdentity);
    const referralCode = storedReferralCode || referralCodeFromQuery;

    // DB-driven campaign lookup: apply locks + price overrides if campaign exists
    const campaign = await getPromoCampaign(supabase, referralCode);
    if (campaign) {
      plans = applyCampaignToPlans(plans, campaign);
      logger.info('campaign_applied', { referralCode, campaignCode: campaign.code, planCount: plans.length });
    }

    return apiSuccess({ plans }, context.request, 200);
  } catch (error) {
    logger.error('subscription_plans_handler_failed', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Failed to fetch subscription plans', context.request);
  }
}
