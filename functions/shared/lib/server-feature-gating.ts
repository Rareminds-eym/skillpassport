/**
 * Server-Side Feature Gating
 *
 * Provides server-side feature access control to prevent unauthorized
 * access to premium features through API manipulation.
 *
 * Reads from subscription_cache and plans_cache shadow tables (app DB)
 * for fast feature checks. Self-heals stale cache entries via async refresh.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '../../lib/logger';
import { isStale } from '../../lib/sync-shadow';
import { isFreemiumPlan } from '../../../src/shared/lib/isFreemiumPlan';

const logger = createLogger('server-feature-gating');

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
    // H5: `.maybeSingle()` errors when two rows match (cancelled history row + fresh
    // resubscription resolve to >1 matches). Fetch newest-active first, then fall back
    // to cancelled/grace_period so the cancelled-preserved-time contract still applies.
    const selectColumns = 'id, user_id, organization_id, status, plan_code, features, synced_at, is_organization_subscription, subscription_end_date';
    let { data: cached, error } = await supabase
      .from('subscription_cache')
      .select(selectColumns)
      .eq('user_id', userId)
      .in('status', ['active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cached && !error) {
      const { data: prior, error: priorErr } = await supabase
        .from('subscription_cache')
        .select(selectColumns)
        .eq('user_id', userId)
        .in('status', ['grace_period', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (priorErr) {
        error = priorErr;
      } else {
        cached = prior;
      }
    }

    if (error) {
      logger.error('Error fetching subscription_cache', { error: (error as Error).message, userId });
      return {
        hasAccess: false,
        reason: 'Unable to verify subscription',
        requiresUpgrade: false,
      };
    }

    // Check if user belongs to an organization if they have no personal active paid plan
    let orgId: string | null = null;
    if (!cached || cached.plan_code === 'freemium') {
      try {
        const { data: mem } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();
        if (mem?.organization_id) {
          orgId = mem.organization_id;
        } else {
          const { data: u } = await supabase
            .from('users')
            .select('"organizationId"')
            .eq('id', userId)
            .maybeSingle();
          if (u?.organizationId) orgId = u.organizationId;
        }

        if (orgId) {
          const { data: orgSub } = await supabase
            .from('subscription_cache')
            .select('id, user_id, organization_id, status, plan_code, features, synced_at, is_organization_subscription, subscription_end_date')
            .eq('organization_id', orgId)
            .eq('is_organization_subscription', true)
            .in('status', ['active', 'grace_period', 'cancelled'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (orgSub) {
            cached = orgSub;
          }
        }
      } catch (e) {
        logger.warn('Error resolving organization subscription for user', { error: (e as Error).message, userId });
      }
    }

    // Check dynamic Entitlement Engine (Database single source of truth).
    // H6: the engine only reads status='active' (entitlement-service.ts), so consulting
    // it for grace_period/cancelled rows resolved the default free plan and denied
    // every catalog feature pre-emptively. For non-active rows fall straight through
    // to the paid-time-preserving legacy path below.
    if (cached?.status === 'active') {
    const effectiveTenantId = orgId || cached?.organization_id || userId;
    try {
      const { checkEntitlement } = await import('./entitlement-service');
      const ent = await checkEntitlement(supabase, effectiveTenantId, feature);
      if (ent && ent.allowed) {
        return {
          hasAccess: true,
          planCode: cached?.plan_code || 'active',
          requiresUpgrade: false,
        };
      } else if (ent && ent.reason && !ent.reason.includes('not recognized')) {
        return {
          hasAccess: false,
          reason: ent.reason,
          planCode: cached?.plan_code || 'free',
          requiresUpgrade: true,
        };
      }
    } catch {
      // Feature not in new entitlement catalog or mock environment, proceed to plan features check
    }
    }

    if (!cached) {
      const isFreemiumAllowed = FREEMIUM_FEATURES[feature] === true;
      return {
        hasAccess: isFreemiumAllowed,
        reason: isFreemiumAllowed ? undefined : 'No active subscription',
        planCode: 'freemium',
        requiresUpgrade: !isFreemiumAllowed,
      };
    }

    // Dead RPC removed: refresh_subscription_cache_for_user has no migration.
    // Keep stale detection for metrics; cache is healed by cron and get-active-subscription fallback.
    if (isStale(cached.synced_at)) {
      logger.info('heal_metric', {
        metric: 'heal_cache_miss_total',
        status: 'stale_detected',
        userId,
        synced_at: cached.synced_at,
      } as any);
    }

    const planCode = cached.plan_code;

    // Preserve already-paid time after cancellation, as required by the
    // existing entitlement contract/tests. Missing or invalid expiry denies.
    if (cached.status === 'cancelled' &&
        (!cached.subscription_end_date || !Number.isFinite(Date.parse(cached.subscription_end_date)) ||
         Date.parse(cached.subscription_end_date) <= Date.now())) {
      const baseline = FREEMIUM_FEATURES[feature] === true;
      return {hasAccess: baseline, planCode: 'freemium', requiresUpgrade: !baseline,
        reason: baseline ? undefined : 'Subscription has expired'};
    }

    if (!planCode) {
      return {
        hasAccess: false,
        reason: 'Invalid subscription plan',
        requiresUpgrade: false,
      };
    }

    if (isFreemiumPlan(planCode)) {
      const hasAccess = FREEMIUM_FEATURES[feature] === true;
      return {
        hasAccess,
        reason: hasAccess ? undefined : 'Feature not included in Freemium plan',
        planCode,
        requiresUpgrade: !hasAccess,
      };
    }

    const planFeatures = Array.isArray(cached.features) ? cached.features : [];
    const hasFeature = planFeatures.includes(feature);

    return {
      hasAccess: hasFeature,
      reason: hasFeature ? undefined : 'Feature not included in current plan',
      planCode,
      requiresUpgrade: !hasFeature,
    };
  } catch (error) {
    logger.error('Unexpected error', { error: (error as Error).message, userId });
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
      logger.error('Error verifying plan', { error: (error as Error).message, planCode });
      return { exists: false };
    }

    return { exists: !!plan, plan };
  } catch (error) {
    logger.error('Unexpected error verifying plan', { error: (error as Error).message, planCode });
    return { exists: false };
  }
}

export async function canUpgradeToPlan(
  supabase: SupabaseClient,
  userId: string,
  targetPlanCode: string
): Promise<{ canUpgrade: boolean; reason?: string; currentPlanCode?: string }> {
  try {
    // Newest-first + limit(1) (H5 class fix): with cancelled-history + resub
    // rows this query can match multiple rows and .maybeSingle() would error
    // PGRST116 — the same failure mode removed from the gating engine query.
    const { data: cached, error } = await supabase
      .from('subscription_cache')
      .select('id, status, plan_code')
      .eq('user_id', userId)
      .in('status', ['active', 'grace_period'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching subscription_cache', { error: (error as Error).message, userId });
      return { canUpgrade: false, reason: 'Unable to verify current subscription' };
    }

    if (!cached) {
      return { canUpgrade: true };
    }

    const currentPlanCode = cached.plan_code;

    if (!currentPlanCode) {
      return { canUpgrade: true };
    }

    const { comparePlanTiers } = await import('./entitlement-service');
    const comparison = await comparePlanTiers(supabase, currentPlanCode, targetPlanCode);

    if (comparison === 'equal') {
      return {
        canUpgrade: false,
        reason: 'Current plan is already at this tier',
        currentPlanCode,
      };
    }

    const canUpgrade = comparison === 'lower'; // current is lower than target => can upgrade

    return {
      canUpgrade,
      reason: canUpgrade ? undefined : 'Cannot downgrade or make lateral moves to a lower tier',
      currentPlanCode,
    };
  } catch (error) {
    logger.error('Unexpected error checking upgrade eligibility', { error: (error as Error).message, userId });
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

/**
 * @deprecated Dead code: RPC refresh_subscription_cache_for_user has no migration.
 * Kept for reference. Do NOT call. Stale is now observed via stale_detected metric and healed by cron + get-active-subscription SSO fallback.
 */
async function refreshCacheAsync(_supabase: SupabaseClient, _userId: string): Promise<void> {
  // No-op: previously called supabase.rpc('refresh_subscription_cache_for_user') which never existed.
  // Intentionally left empty; call site now emits stale_detected and relies on cron-reconcile-heal.
}
