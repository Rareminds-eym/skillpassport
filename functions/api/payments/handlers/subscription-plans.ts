/**
 * Subscription Plans Handler
 *
 * GET /api/payments/subscription-plans
 *
 * Queries Supabase directly for all active subscription plans.
 * Transforms the raw DB schema into the shape the frontend expects.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

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
    price: pricing.yearly || pricing.monthly || 0,
    yearlyPrice: pricing.yearly || 0,
    currency: (pricing.currency as string) || 'INR',
    duration: (config.duration as string) || 'yearly',
    // Config fields
    tagline: (config.tagline as string) || '',
    recommended: (config.is_recommended as boolean) || false,
    ideal_for: (config.ideal_for as string) || '',
    description: (config.description as string) || '',
    max_users: (config.max_users as number) || 1,
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

export async function handleSubscriptionPlans(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const url = new URL(context.request.url);
    const businessType = url.searchParams.get('businessType') || 'b2c';
    const entityType = url.searchParams.get('entityType') || 'all';

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
      return new Response(
        JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch subscription plans',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform raw DB rows into the shape the frontend expects
    const plans = (data || []).map((row: Record<string, unknown>) => transformPlan(row, entityType));

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
              // Override features with detailed ones if available
              (plan as Record<string, unknown>).features = detailedFeatures.map((f: Record<string, unknown>) => ({
                name: f.feature_name,
                feature_key: f.feature_key,
                value: f.feature_value,
                category: f.category,
                is_included: f.is_included,
                is_addon: f.is_addon,
              }));
            }
          }
        }
      } catch (featureErr) {
        // Non-critical: subscription_plan_features may not exist after Phase 10 cleanup
        console.warn('[SubscriptionPlans] subscription_plan_features query failed (non-critical):', featureErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, plans }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SubscriptionPlans] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch subscription plans',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
