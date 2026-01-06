/**
 * Subscription Plans Handlers
 * GET /subscription-plans - Get all active plans
 * GET /subscription-plan - Get single plan by code
 * GET /subscription-features - Get features comparison
 */

import { Env } from '../types';
import { jsonResponse } from '../utils';
import { createSupabaseAdmin } from '../helpers';

/**
 * GET /subscription-plans - Get all active subscription plans
 * Query params: businessType, entityType, roleType, featuresLimit (optional, default 4)
 */
export async function handleGetSubscriptionPlans(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const businessType = url.searchParams.get('businessType') || 'b2b';
  const entityType = url.searchParams.get('entityType') || 'all';
  const roleType = url.searchParams.get('roleType') || 'all';
  const featuresLimit = url.searchParams.get('featuresLimit'); // null = all features, number = limit

  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    // Fetch plans
    let query = supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('business_type', businessType)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Filter by entity_type (match specific or 'all')
    if (entityType !== 'all') {
      query = query.or(`entity_type.eq.${entityType},entity_type.eq.all`);
    }

    // Filter by role_type (match specific or 'all')
    if (roleType !== 'all') {
      query = query.or(`role_type.eq.${roleType},role_type.eq.all`);
    }

    const { data: plans, error: plansError } = await query;

    if (plansError) {
      console.error('[SUBSCRIPTION-PLANS] Error fetching plans:', plansError);
      return jsonResponse({ error: plansError.message }, 500);
    }

    // Fetch features for all plans
    const planIds = plans?.map(p => p.id) || [];
    let features: any[] = [];
    
    if (planIds.length > 0) {
      const { data: featuresData, error: featuresError } = await supabaseAdmin
        .from('subscription_plan_features')
        .select('*')
        .in('plan_id', planIds)
        .order('display_order', { ascending: true });

      if (!featuresError) {
        features = featuresData || [];
      }
    }

    // Group features by plan_id
    const featuresByPlan: Record<string, any[]> = {};
    features.forEach(f => {
      if (!featuresByPlan[f.plan_id]) {
        featuresByPlan[f.plan_id] = [];
      }
      featuresByPlan[f.plan_id].push(f);
    });

    // Transform plans to frontend format
    // Apply features limit if specified
    const limit = featuresLimit ? parseInt(featuresLimit, 10) : null;
    
    const transformedPlans = plans?.map(plan => {
      const allFeatures = plan.features || [];
      const totalFeatures = allFeatures.length;
      const isLimited = limit !== null && limit < totalFeatures;
      const displayFeatures = isLimited ? allFeatures.slice(0, limit) : allFeatures;
      
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
        totalFeatures: totalFeatures,
        hasMoreFeatures: isLimited,
        limits: {
          learners: plan.max_users,
          admins: plan.max_admins,
          storage: plan.storage_limit,
          idealFor: plan.ideal_for
        },
        positioning: plan.positioning || plan.description,
        color: plan.color || 'bg-slate-600',
        recommended: plan.is_recommended || false,
        contactSales: plan.price_monthly === 0,
        detailedFeatures: featuresByPlan[plan.id] || []
      };
    }) || [];

    return jsonResponse({
      success: true,
      plans: transformedPlans,
      meta: { businessType, entityType, roleType, count: transformedPlans.length }
    });
  } catch (error) {
    console.error('[SUBSCRIPTION-PLANS] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * GET /subscription-plan - Get a single subscription plan by plan_code
 * Query params: planCode, featuresLimit (optional)
 */
export async function handleGetSubscriptionPlan(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const planCode = url.searchParams.get('planCode');
  const featuresLimit = url.searchParams.get('featuresLimit'); // null = all features

  if (!planCode) {
    return jsonResponse({ error: 'planCode is required' }, 400);
  }

  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('plan_code', planCode)
      .eq('is_active', true)
      .single();

    if (planError) {
      if (planError.code === 'PGRST116') {
        return jsonResponse({ error: 'Plan not found' }, 404);
      }
      return jsonResponse({ error: planError.message }, 500);
    }

    // Fetch features
    const { data: features } = await supabaseAdmin
      .from('subscription_plan_features')
      .select('*')
      .eq('plan_id', plan.id)
      .order('display_order', { ascending: true });

    // Apply features limit
    const allFeatures = plan.features || [];
    const totalFeatures = allFeatures.length;
    const limit = featuresLimit ? parseInt(featuresLimit, 10) : null;
    const isLimited = limit !== null && limit < totalFeatures;
    const displayFeatures = isLimited ? allFeatures.slice(0, limit) : allFeatures;

    const transformedPlan = {
      id: plan.plan_code,
      dbId: plan.id,
      name: plan.name,
      tagline: plan.tagline || plan.description,
      price: plan.price_monthly === 0 ? null : String(plan.price_monthly),
      priceYearly: plan.price_yearly ? String(plan.price_yearly) : null,
      duration: plan.price_monthly === 0 ? 'custom' : 'person',
      currency: plan.currency || 'INR',
      features: displayFeatures,
      totalFeatures: totalFeatures,
      hasMoreFeatures: isLimited,
      limits: {
        learners: plan.max_users,
        admins: plan.max_admins,
        storage: plan.storage_limit,
        idealFor: plan.ideal_for
      },
      positioning: plan.positioning || plan.description,
      color: plan.color || 'bg-slate-600',
      recommended: plan.is_recommended || false,
      contactSales: plan.price_monthly === 0,
      detailedFeatures: features || []
    };

    return jsonResponse({ success: true, plan: transformedPlan });
  } catch (error) {
    console.error('[SUBSCRIPTION-PLAN] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}

/**
 * GET /subscription-features - Get features comparison across all plans
 */
export async function handleGetSubscriptionFeatures(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = createSupabaseAdmin(env);

  try {
    // Fetch all active plans
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, plan_code, name')
      .eq('is_active', true)
      .eq('business_type', 'b2b')
      .order('display_order');

    if (plansError) {
      return jsonResponse({ error: plansError.message }, 500);
    }

    // Fetch all features
    const planIds = plans?.map(p => p.id) || [];
    const { data: features, error: featuresError } = await supabaseAdmin
      .from('subscription_plan_features')
      .select('*')
      .in('plan_id', planIds)
      .order('display_order');

    if (featuresError) {
      return jsonResponse({ error: featuresError.message }, 500);
    }

    // Build comparison matrix
    const featureMap = new Map<string, any>();
    
    features?.forEach(f => {
      const key = `${f.category}-${f.feature_key}`;
      if (!featureMap.has(key)) {
        featureMap.set(key, {
          category: f.category,
          featureKey: f.feature_key,
          featureName: f.feature_name,
          displayOrder: f.display_order,
          plans: {}
        });
      }
      
      const plan = plans?.find(p => p.id === f.plan_id);
      if (plan) {
        featureMap.get(key).plans[plan.plan_code] = {
          value: f.feature_value,
          isIncluded: f.is_included,
          isAddon: f.is_addon
        };
      }
    });

    const comparison = Array.from(featureMap.values())
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return jsonResponse({
      success: true,
      plans: plans?.map(p => ({ id: p.plan_code, name: p.name })) || [],
      comparison
    });
  } catch (error) {
    console.error('[SUBSCRIPTION-FEATURES] Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
