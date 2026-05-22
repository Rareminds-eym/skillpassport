/**
 * Server-Side Feature Gating
 *
 * Provides server-side feature access control to prevent unauthorized
 * access to premium features through API manipulation.
 *
 * Reads from subscription_cache and plans_cache shadow tables (app DB)
 * for <1ms feature checks. Self-heals stale cache entries via async refresh.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { isStale } from '../../lib/sync-shadow';

const PLAN_HIERARCHY = [
  'freemium',
  'basic',
  'professional',
  'enterprise',
  'enterprise_ecosystem',
];

const FREEMIUM_FEATURES: Record<string, boolean> = {
  dashboard_access: true,
  profile_creation: true,
  marketplace_access: true,
  view_pricing: true,
  opportunities_access: true,
  courses_listing_access: true,

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

export async function checkServerFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  feature: string
): Promise<FeatureAccessResult> {
  try {
    const { data: cached, error } = await supabase
      .from('subscription_cache')
      .select('id, status, plan_code, features, synced_at')
      .eq('user_id', userId)
      .in('status', ['active', 'grace_period'])
      .maybeSingle();

    if (error) {
      console.error('[ServerFeatureGating] Error fetching subscription_cache:', error);
      return {
        hasAccess: false,
        reason: 'Unable to verify subscription',
        requiresUpgrade: false,
      };
    }

    if (!cached) {
      return {
        hasAccess: false,
        reason: 'No active subscription',
        requiresUpgrade: true,
      };
    }

    // Self-healing: if stale, trigger async refresh (non-blocking)
    if (isStale(cached.synced_at)) {
      refreshCacheAsync(supabase, userId).catch(() => {});
    }

    const planCode = cached.plan_code;

    if (!planCode) {
      return {
        hasAccess: false,
        reason: 'Invalid subscription plan',
        requiresUpgrade: false,
      };
    }

    if (planCode === 'freemium') {
      const hasAccess = FREEMIUM_FEATURES[feature] === true;
      return {
        hasAccess,
        reason: hasAccess ? undefined : 'Feature not included in Freemium plan',
        planCode,
        requiresUpgrade: !hasAccess,
      };
    }

    const planFeatures: string[] = Array.isArray(cached.features) ? cached.features : [];
    const hasFeature = planFeatures.includes(feature);

    return {
      hasAccess: hasFeature,
      reason: hasFeature ? undefined : 'Feature not included in current plan',
      planCode,
      requiresUpgrade: !hasFeature,
    };
  } catch (error) {
    console.error('[ServerFeatureGating] Unexpected error:', error);
    return {
      hasAccess: false,
      reason: 'Internal error',
      requiresUpgrade: false,
    };
  }
}

export async function verifyPlanExists(
  supabase: SupabaseClient,
  planCode: string
): Promise<{ exists: boolean; plan?: any }> {
  try {
    const { data: plan, error } = await supabase
      .from('plans_cache')
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

export async function canUpgradeToPlan(
  supabase: SupabaseClient,
  userId: string,
  targetPlanCode: string
): Promise<{ canUpgrade: boolean; reason?: string; currentPlanCode?: string }> {
  try {
    const { data: cached, error } = await supabase
      .from('subscription_cache')
      .select('id, status, plan_code')
      .eq('user_id', userId)
      .in('status', ['active', 'grace_period'])
      .maybeSingle();

    if (error) {
      console.error('[ServerFeatureGating] Error fetching subscription_cache:', error);
      return { canUpgrade: false, reason: 'Unable to verify current subscription' };
    }

    if (!cached) {
      return { canUpgrade: true };
    }

    const currentPlanCode = cached.plan_code;

    if (!currentPlanCode) {
      return { canUpgrade: true };
    }

    const currentIndex = PLAN_HIERARCHY.indexOf(currentPlanCode);
    const targetIndex = PLAN_HIERARCHY.indexOf(targetPlanCode);

    if (currentIndex === -1 || targetIndex === -1) {
      return { canUpgrade: false, reason: 'Invalid plan code', currentPlanCode };
    }

    const canUpgrade = targetIndex > currentIndex;

    return {
      canUpgrade,
      reason: canUpgrade ? undefined : 'Cannot downgrade or make lateral moves to the same tier',
      currentPlanCode,
    };
  } catch (error) {
    console.error('[ServerFeatureGating] Unexpected error checking upgrade eligibility:', error);
    return { canUpgrade: false, reason: 'Internal error' };
  }
}

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

async function refreshCacheAsync(supabase: SupabaseClient, userId: string): Promise<void> {
  // Self-healing: when a stale cache entry is detected during a feature check,
  // attempt to refresh it from the auth DB. Since this module doesn't have
  // access to the Cloudflare env (SSO_SERVICE binding), we use the supabase
  // client to call the `refresh_subscription_cache` RPC if it exists,
  // or fall back to marking the entry for the reconciliation cron to pick up.
  try {
    // Attempt direct sync via database function (if deployed)
    const { error: rpcError } = await supabase.rpc('refresh_subscription_cache_for_user', {
      target_user_id: userId,
    });

    if (rpcError) {
      // RPC not deployed or failed — this is expected pre-migration.
      // The nightly reconciliation cron will correct the stale data.
      // Also, the next payment handler call will write-through sync.
      console.warn(
        `[ServerFeatureGating] Self-heal RPC unavailable for user ${userId}: ${rpcError.message}. ` +
        'Reconciliation cron will correct on next cycle.'
      );
    } else {
      console.log(`[ServerFeatureGating] Self-healed stale cache for user ${userId}`);
    }
  } catch (err) {
    // Non-critical — feature gating still uses whatever cache data exists.
    // The write-through sync on the next mutation will correct this.
    console.warn('[ServerFeatureGating] Self-heal failed (non-critical):', err);
  }
}
