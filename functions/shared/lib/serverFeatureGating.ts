/**
 * Server-Side Feature Gating
 * 
 * Provides server-side feature access control to prevent unauthorized
 * access to premium features through API manipulation.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Plan hierarchy (lowest to highest tier)
 */
const PLAN_HIERARCHY = [
  'pay_as_you_go',
  'basic',
  'professional',
  'enterprise',
  'enterprise_ecosystem',
];

/**
 * Freemium (pay_as_you_go) feature configuration
 */
const PAY_AS_YOU_GO_FEATURES: Record<string, boolean> = {
  // Free features
  dashboard_access: true,
  profile_creation: true,
  marketplace_access: true,
  view_pricing: true,
  opportunities_access: true,
  courses_listing_access: true,
  
  // Locked features
  assessments: false,
  projects: false,
  storage: false,
  analytics: false,
  portfolio: false,
  career_paths: false,
  mock_interviews: false,
  resume_builder: false,
  certificates: false,
  course_enrollment: false,
  priority_support: false,
};

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  planCode?: string;
  requiresUpgrade?: boolean;
}

/**
 * Check if user has access to a feature (server-side)
 */
export async function checkServerFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  feature: string
): Promise<FeatureAccessResult> {
  try {
    // Get user's active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        subscription_plans (
          plan_code,
          base_features
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('[ServerFeatureGating] Error fetching subscription:', error);
      // Deny access on error (fail closed)
      return {
        hasAccess: false,
        reason: 'Unable to verify subscription',
        requiresUpgrade: false,
      };
    }

    // No active subscription - deny access
    if (!subscription) {
      return {
        hasAccess: false,
        reason: 'No active subscription',
        requiresUpgrade: true,
      };
    }

    const plans = Array.isArray(subscription.subscription_plans)
      ? subscription.subscription_plans[0]
      : subscription.subscription_plans;

    const planCode = plans?.plan_code;

    if (!planCode) {
      return {
        hasAccess: false,
        reason: 'Invalid subscription plan',
        requiresUpgrade: false,
      };
    }

    // Check Freemium access
    if (planCode === 'pay_as_you_go') {
      const hasAccess = PAY_AS_YOU_GO_FEATURES[feature] === true;
      return {
        hasAccess,
        reason: hasAccess ? undefined : 'Feature not included in Freemium plan',
        planCode,
        requiresUpgrade: !hasAccess,
      };
    }

    // Check if feature is in plan's features array
    const planFeatures = plans?.base_features || [];
    const hasFeature = planFeatures.includes(feature);

    return {
      hasAccess: hasFeature,
      reason: hasFeature ? undefined : 'Feature not included in current plan',
      planCode,
      requiresUpgrade: !hasFeature,
    };
  } catch (error) {
    console.error('[ServerFeatureGating] Unexpected error:', error);
    // Deny access on error (fail closed)
    return {
      hasAccess: false,
      reason: 'Internal error',
      requiresUpgrade: false,
    };
  }
}

/**
 * Verify plan exists and is active
 */
export async function verifyPlanExists(
  supabase: SupabaseClient,
  planCode: string
): Promise<{ exists: boolean; plan?: any }> {
  try {
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_code', planCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[ServerFeatureGating] Error verifying plan:', error);
      return { exists: false };
    }

    return { exists: !!plan, plan };
  } catch (error) {
    console.error('[ServerFeatureGating] Unexpected error verifying plan:', error);
    return { exists: false };
  }
}

/**
 * Check if user can upgrade to a specific plan
 */
export async function canUpgradeToPlan(
  supabase: SupabaseClient,
  userId: string,
  targetPlanCode: string
): Promise<{ canUpgrade: boolean; reason?: string; currentPlanCode?: string }> {
  try {
    // Get user's current subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        subscription_plans (
          plan_code
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('[ServerFeatureGating] Error fetching subscription:', error);
      return { canUpgrade: false, reason: 'Unable to verify current subscription' };
    }

    // No subscription - can upgrade to any plan
    if (!subscription) {
      return { canUpgrade: true };
    }

    const plans = Array.isArray(subscription.subscription_plans)
      ? subscription.subscription_plans[0]
      : subscription.subscription_plans;

    const currentPlanCode = plans?.plan_code;

    if (!currentPlanCode) {
      return { canUpgrade: true };
    }

    // Check plan hierarchy
    const currentIndex = PLAN_HIERARCHY.indexOf(currentPlanCode);
    const targetIndex = PLAN_HIERARCHY.indexOf(targetPlanCode);

    if (currentIndex === -1 || targetIndex === -1) {
      return { canUpgrade: false, reason: 'Invalid plan code', currentPlanCode };
    }

    // Can only upgrade to higher tier or same tier (renewal)
    const canUpgrade = targetIndex >= currentIndex;

    return {
      canUpgrade,
      reason: canUpgrade ? undefined : 'Cannot downgrade to lower tier',
      currentPlanCode,
    };
  } catch (error) {
    console.error('[ServerFeatureGating] Unexpected error checking upgrade eligibility:', error);
    return { canUpgrade: false, reason: 'Internal error' };
  }
}

/**
 * Middleware to protect API endpoints with feature gating
 */
export function requireFeature(feature: string) {
  return async (
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ allowed: boolean; response?: Response }> => {
    const accessResult = await checkServerFeatureAccess(supabase, userId, feature);

    if (!accessResult.hasAccess) {
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            error: 'FEATURE_ACCESS_DENIED',
            message: accessResult.reason || 'You do not have access to this feature',
            requiresUpgrade: accessResult.requiresUpgrade,
            currentPlan: accessResult.planCode,
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      };
    }

    return { allowed: true };
  };
}
