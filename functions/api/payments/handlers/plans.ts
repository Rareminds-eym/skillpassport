/**
 * Subscription Plans handlers
 * GET /api/payments/plans - all active plans
 * GET /api/payments/plan - single plan by planCode
 * GET /api/payments/features - features comparison
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../src/functions-lib';

function transformPlan(plan: any, featuresLimit: number | null) {
  const allFeatures = plan.features || [];
  const total = allFeatures.length;
  const limited = featuresLimit !== null && featuresLimit < total;
  return {
    id: plan.plan_code,
    dbId: plan.id,
    name: plan.name,
    tagline: plan.tagline || plan.description,
    price: plan.price_monthly === 0 ? null : String(plan.price_monthly),
    priceYearly: plan.price_yearly ? String(plan.price_yearly) : null,
    duration: plan.price_monthly === 0 ? 'custom' : 'person',
    currency: plan.currency || 'INR',
    features: limited ? allFeatures.slice(0, featuresLimit!) : allFeatures,
    totalFeatures: total,
    hasMoreFeatures: limited,
    limits: {
      learners: plan.max_users,
      admins: plan.max_admins,
      storage: plan.storage_limit,
      idealFor: plan.ideal_for,
    },
    positioning: plan.positioning || plan.description,
    color: plan.color || 'bg-slate-600',
    recommended: plan.is_recommended || false,
    contactSales: plan.price_monthly === 0,
  };
}

export async function handleGetPlans(url: URL, supabase: SupabaseClient): Promise<Response> {
  const businessType = url.searchParams.get('businessType') || 'b2b';
  const entityType = url.searchParams.get('entityType') || 'all';
  const featuresLimit = url.searchParams.get('featuresLimit');
  const limit = featuresLimit ? parseInt(featuresLimit, 10) : null;

  const { data, error } = await supabase.rpc('get_all_plans_for_entity', {
    p_entity_type: entityType,
    p_business_type: businessType,
  });

  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({
    success: true,
    plans: (data || []).map((p: any) => transformPlan(p, limit)),
    meta: { businessType, entityType, count: (data || []).length },
  });
}

export async function handleGetPlan(url: URL, supabase: SupabaseClient): Promise<Response> {
  const planCode = url.searchParams.get('planCode');
  if (!planCode) return jsonResponse({ error: 'planCode is required' }, 400);

  const featuresLimit = url.searchParams.get('featuresLimit');
  const limit = featuresLimit ? parseInt(featuresLimit, 10) : null;

  const { data, error } = await supabase.rpc('get_plan_for_entity', {
    p_plan_code: planCode,
    p_entity_type: url.searchParams.get('entityType') || 'all',
    p_business_type: url.searchParams.get('businessType') || null,
  });

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!data) return jsonResponse({ error: 'Plan not found' }, 404);

  return jsonResponse({ success: true, plan: transformPlan(data, limit) });
}

export async function handleGetFeatures(supabase: SupabaseClient): Promise<Response> {
  const { data: plans, error: plansError } = await supabase
    .from('subscription_plans')
    .select('id, plan_code, name')
    .eq('is_active', true)
    .eq('business_type', 'b2b')
    .order('display_order');

  if (plansError) return jsonResponse({ error: plansError.message }, 500);

  const planIds = (plans || []).map((p: any) => p.id);
  const { data: features, error: featuresError } = await supabase
    .from('subscription_plan_features')
    .select('*')
    .in('plan_id', planIds)
    .order('display_order');

  if (featuresError) return jsonResponse({ error: featuresError.message }, 500);

  const featureMap = new Map<string, any>();
  (features || []).forEach((f: any) => {
    const key = `${f.category}-${f.feature_key}`;
    if (!featureMap.has(key)) {
      featureMap.set(key, {
        category: f.category,
        featureKey: f.feature_key,
        featureName: f.feature_name,
        displayOrder: f.display_order,
        plans: {},
      });
    }
    const plan = (plans || []).find((p: any) => p.id === f.plan_id);
    if (plan) {
      featureMap.get(key).plans[plan.plan_code] = {
        value: f.feature_value,
        isIncluded: f.is_included,
        isAddon: f.is_addon,
      };
    }
  });

  return jsonResponse({
    success: true,
    plans: (plans || []).map((p: any) => ({ id: p.plan_code, name: p.name })),
    comparison: Array.from(featureMap.values()).sort((a, b) => a.displayOrder - b.displayOrder),
  });
}
