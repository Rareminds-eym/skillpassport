/**
 * Plan handlers — public, no auth required
 * GET /api/payments/plans          (alias: /subscription-plans)
 * GET /api/payments/plan           (alias: /subscription-plan)
 * GET /api/payments/features       (alias: /subscription-features)
 * GET /api/payments/addon-catalog
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../src/functions-lib/response';
import type { PaymentsEnv } from '../types';

function adminClient(env: PaymentsEnv) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL!;
  return createClient(url, env.SUPABASE_SERVICE_ROLE_KEY);
}

function transformPlan(plan: any, featuresLimit?: number | null) {
  const allFeatures = plan.features || [];
  const totalFeatures = allFeatures.length;
  const isLimited = featuresLimit !== null && featuresLimit !== undefined && featuresLimit < totalFeatures;
  const displayFeatures = isLimited ? allFeatures.slice(0, featuresLimit) : allFeatures;
  return {
    id: plan.plan_code,
    dbId: plan.id,
    name: plan.name,
    tagline: plan.tagline || plan.description,
    price: plan.price_monthly === 0 ? null : String(plan.price_monthly),
    priceYearly: plan.price_yearly ? String(plan.price_yearly) : null,
    duration: plan.price_monthly === 0 ? 'custom' : 'person',
    currency: plan.currency || 'INR',
    features: displayFeatures,
    totalFeatures,
    hasMoreFeatures: isLimited,
    limits: { learners: plan.max_users, admins: plan.max_admins, storage: plan.storage_limit, idealFor: plan.ideal_for },
    positioning: plan.positioning || plan.description,
    color: plan.color || 'bg-slate-600',
    recommended: plan.is_recommended || false,
    contactSales: plan.price_monthly === 0,
    detailedFeatures: [],
  };
}

export async function handleGetPlans(req: Request, env: PaymentsEnv): Promise<Response> {
  const url = new URL(req.url);
  const businessType = url.searchParams.get('businessType') || 'b2b';
  const entityType = url.searchParams.get('entityType') || 'all';
  const featuresLimit = url.searchParams.get('featuresLimit');
  const limit = featuresLimit ? parseInt(featuresLimit, 10) : null;

  const supabase = adminClient(env);

  // Try RPC first, fall back to direct query
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_all_plans_for_entity', { p_entity_type: entityType, p_business_type: businessType });

  if (!rpcError && rpcData) {
    const plans = (rpcData as any[]).map(p => transformPlan(p, limit));
    return jsonResponse({ success: true, plans, meta: { businessType, entityType, count: plans.length } });
  }

  // Fallback: direct query
  const { data, error } = await supabase
    .from('subscription_plans').select('*')
    .eq('is_active', true).order('price_monthly', { ascending: true });

  if (error) return jsonResponse({ error: error.message }, 500);
  const plans = (data ?? []).map(p => transformPlan(p, limit));
  return jsonResponse({ success: true, plans, meta: { businessType, entityType, count: plans.length } });
}

export async function handleGetPlan(req: Request, env: PaymentsEnv): Promise<Response> {
  const url = new URL(req.url);
  const planCode = url.searchParams.get('planCode');
  const entityType = url.searchParams.get('entityType') || 'all';
  const businessType = url.searchParams.get('businessType') || null;
  const featuresLimit = url.searchParams.get('featuresLimit');
  const limit = featuresLimit ? parseInt(featuresLimit, 10) : null;

  if (!planCode) return jsonResponse({ error: 'planCode is required' }, 400);

  const supabase = adminClient(env);

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_plan_for_entity', { p_plan_code: planCode, p_entity_type: entityType, p_business_type: businessType });

  if (!rpcError && rpcData) {
    return jsonResponse({ success: true, plan: transformPlan(rpcData, limit) });
  }

  // Fallback
  const { data, error } = await supabase
    .from('subscription_plans').select('*')
    .eq('plan_code', planCode).eq('is_active', true).maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!data) return jsonResponse({ error: 'Plan not found' }, 404);
  return jsonResponse({ success: true, plan: transformPlan(data, limit) });
}

export async function handleGetFeatures(_req: Request, env: PaymentsEnv): Promise<Response> {
  const supabase = adminClient(env);

  const { data: plans, error: plansError } = await supabase
    .from('subscription_plans').select('id, plan_code, name')
    .eq('is_active', true).order('display_order');

  if (plansError) return jsonResponse({ error: plansError.message }, 500);

  const planIds = (plans ?? []).map((p: any) => p.id);
  const { data: features, error: featuresError } = await supabase
    .from('subscription_plan_features').select('*')
    .in('plan_id', planIds).order('display_order');

  if (featuresError) return jsonResponse({ error: featuresError.message }, 500);

  const featureMap = new Map<string, any>();
  (features ?? []).forEach((f: any) => {
    const key = `${f.category}-${f.feature_key}`;
    if (!featureMap.has(key)) {
      featureMap.set(key, { category: f.category, featureKey: f.feature_key, featureName: f.feature_name, displayOrder: f.display_order, plans: {} });
    }
    const plan = (plans ?? []).find((p: any) => p.id === f.plan_id);
    if (plan) {
      featureMap.get(key).plans[plan.plan_code] = { value: f.feature_value, isIncluded: f.is_included, isAddon: f.is_addon };
    }
  });

  const comparison = Array.from(featureMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  return jsonResponse({ success: true, plans: (plans ?? []).map((p: any) => ({ id: p.plan_code, name: p.name })), comparison });
}

export async function handleGetAddonCatalog(req: Request, env: PaymentsEnv): Promise<Response> {
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const role = url.searchParams.get('role');

  const supabase = adminClient(env);

  let addonsQuery = supabase
    .from('subscription_plan_features')
    .select('id, feature_key, feature_name, category, addon_price_monthly, addon_price_annual, addon_description, target_roles, icon_url, sort_order_addon')
    .eq('is_addon', true).order('sort_order_addon', { ascending: true });
  if (category) addonsQuery = addonsQuery.eq('category', category);

  const { data: addons, error: addonsError } = await addonsQuery;
  if (addonsError) return jsonResponse({ error: addonsError.message }, 500);

  const uniqueAddons = new Map<string, any>();
  (addons ?? []).forEach((addon: any) => {
    if (role && addon.target_roles?.length && !addon.target_roles.includes(role)) return;
    if (!uniqueAddons.has(addon.feature_key)) {
      uniqueAddons.set(addon.feature_key, {
        id: addon.id, feature_key: addon.feature_key, name: addon.feature_name,
        description: addon.addon_description, category: addon.category,
        price_monthly: parseFloat(addon.addon_price_monthly) || 0,
        price_annual: parseFloat(addon.addon_price_annual) || 0,
        target_roles: addon.target_roles || [], icon_url: addon.icon_url,
      });
    }
  });

  let bundlesQuery = supabase.from('bundles').select('*, bundle_features(feature_key)').eq('is_active', true).order('display_order', { ascending: true });
  const { data: bundles, error: bundlesError } = await bundlesQuery;
  if (bundlesError) return jsonResponse({ error: bundlesError.message }, 500);

  const filteredBundles = role
    ? (bundles ?? []).filter((b: any) => !b.target_roles?.length || b.target_roles.includes(role))
    : (bundles ?? []);

  return jsonResponse({
    success: true,
    addons: Array.from(uniqueAddons.values()),
    bundles: filteredBundles.map((b: any) => ({
      id: b.id, name: b.name, slug: b.slug, description: b.description,
      price_monthly: parseFloat(b.monthly_price) || 0,
      price_annual: parseFloat(b.annual_price) || 0,
      discount_percentage: b.discount_percentage || 0,
      target_roles: b.target_roles || [],
      feature_keys: b.bundle_features?.map((bf: any) => bf.feature_key) || [],
    })),
  });
}
