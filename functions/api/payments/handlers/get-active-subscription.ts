/**
 * Get Active Subscription Handler
 *
 * GET /api/payments/get-active-subscription
 *
 * Queries subscription_cache (shadow table) for the user's active subscription.
 * Also checks license_assignments for org license holders.
 * Falls back to auth DB via SSO worker if cache is stale.
 *
 * Requires SSO authentication.
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { createLogger } from '../../../lib/logger';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../../lib/response';
import { syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';

const logger = createLogger('get-active-subscription');

export async function handleGetActiveSubscription(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const user = getContextUser(context);
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const supabase = getServiceClient(env);
    const userId = user.id;

    // =========================================================================
    // STEP 1: Check for organization license assignment FIRST
    // =========================================================================
    const { data: licenseAssignment, error: licenseError } = await supabase
      .from('license_assignments')
      .select(`
        id,
        status,
        expires_at,
        assigned_at,
        organization_subscription_id
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!licenseError && licenseAssignment && licenseAssignment.organization_subscription_id) {
      // Look up the org subscription from subscription_cache
      const { data: orgCache } = await supabase
        .from('subscription_cache')
        .select('*')
        .eq('id', licenseAssignment.organization_subscription_id)
        .maybeSingle();

      if (orgCache && orgCache.status === 'active') {
        const orgEndDate = new Date(orgCache.subscription_end_date);

        if (orgEndDate > new Date()) {
          const licenseExpiry = licenseAssignment.expires_at ? new Date(licenseAssignment.expires_at) : null;
          const effectiveEndDate = licenseExpiry && licenseExpiry < orgEndDate ? licenseExpiry : orgEndDate;

          if (effectiveEndDate > new Date()) {
            const orgSubscriptionData = {
              id: orgCache.id,
              user_id: userId,
              plan_id: orgCache.plan_id,
              plan_type: orgCache.plan_name || orgCache.plan_type || 'Organization Plan',
              plan_code: orgCache.plan_code,
              status: 'active',
              subscription_start_date: orgCache.subscription_start_date,
              subscription_end_date: effectiveEndDate.toISOString(),
              auto_renew: false,
              features: orgCache.features || [],
              is_organization_license: true,
              organization_id: orgCache.organization_id,
              organization_type: orgCache.organization_type,
              license_assignment_id: licenseAssignment.id,
              subscription_plans: {
                id: orgCache.plan_id,
                name: orgCache.plan_name || orgCache.plan_type,
                plan_code: orgCache.plan_code,
              },
            };

            return apiSuccess(orgSubscriptionData, context.request, { startTime });
          }
        }
      }
    }

    // =========================================================================
    // STEP 1.5: Check for revoked license assignments
    // =========================================================================
    const { data: revokedLicense } = await supabase
      .from('license_assignments')
      .select('id, status, revoked_at, organization_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'revoked')
      .order('revoked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // =========================================================================
    // STEP 2: Check for individual subscription via subscription_cache
    // =========================================================================
    const { data, error } = await supabase
      .from('subscription_cache')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'paused', 'cancelled', 'grace_period'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return apiDbError(error, context.request, { startTime });
    }

    if (!data) {
      if (revokedLicense) {
        // Look up the revoked org subscription from cache for plan details
        let planName = 'Organization License';
        let planCode: string | undefined;
        if (revokedLicense.organization_subscription_id) {
          const { data: revokedCache } = await supabase
            .from('subscription_cache')
            .select('plan_name, plan_code')
            .eq('id', revokedLicense.organization_subscription_id)
            .maybeSingle();
          if (revokedCache) {
            planName = revokedCache.plan_name || planName;
            planCode = revokedCache.plan_code;
          }
        }

        return apiSuccess({
          id: revokedLicense.id,
          user_id: userId,
          status: 'expired',
          plan_type: planName,
          plan_code: planCode,
          is_organization_license: true,
          was_revoked: true,
          revoked_at: revokedLicense.revoked_at,
        }, context.request, { startTime });
      }

      // Get most recent subscription_cache entry for display purposes
      const { data: recentSub } = await supabase
        .from('subscription_cache')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentSub) {
        // Shape it like the old format for backward compatibility
        return apiSuccess({
          ...recentSub,
          subscription_plans: {
            id: recentSub.plan_id,
            name: recentSub.plan_name || recentSub.plan_type,
            plan_code: recentSub.plan_code,
          },
        }, context.request, { startTime });
      }

      // Self-healing fallback: cache miss → check SSO source-of-truth via service binding
      // This handles local dev dockers (8788) where SYNC_QUEUE consumer is not running,
      // and any future direct SSO inserts. Fail-soft: on SSO failure return null (current behavior).
      try {
        const ssoRaw = (context.env as Record<string, unknown>).SSO_SERVICE;
        if (ssoRaw && typeof ssoRaw === 'object') {
          const sso = ssoRaw as {
            syncSubscription?: (userId: string) => Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
            getUserSubscription?: (userId: string) => Promise<{ subscription: Record<string, unknown> | null; plan: Record<string, unknown> | null }>;
          };
          const fetcher = sso.syncSubscription ?? sso.getUserSubscription;
          if (fetcher) {
            const { subscription, plan } = await fetcher.call(sso, userId);
            if (subscription) {
              // Ensure FK users_shadow exists before cache upsert
              await syncUserShadow(supabase, userId, (subscription as { email?: string }).email || user.email);
              await syncSubscriptionCache(supabase, subscription as Record<string, unknown>, plan as Record<string, unknown> | null);
              // Re-read the just-synced cache row to return canonical shape
              const { data: synced } = await supabase
                .from('subscription_cache')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['active', 'paused', 'cancelled', 'grace_period'])
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              if (synced) {
                return apiSuccess({
                  ...synced,
                  subscription_plans: {
                    id: synced.plan_id,
                    name: synced.plan_name || synced.plan_type,
                    plan_code: synced.plan_code,
                  },
                }, context.request, { startTime });
              }
              // Fallback: return SSO data directly if re-read fails
              return apiSuccess({
                ...(subscription as Record<string, unknown>),
                subscription_plans: plan
                  ? { id: (plan as { id?: string }).id, name: (plan as { name?: string }).name, plan_code: (plan as { plan_code?: string }).plan_code }
                  : undefined,
              }, context.request, { startTime });
            }
          }
        }
      } catch (e) {
        logger.warn('SSO fallback failed (fail-soft, returning null)', { error: e instanceof Error ? e.message : String(e), userId });
        logger.info('heal_metric', { metric: 'heal_cache_miss_total', status: 'fallback_null', userId } as any);
      }

      return apiSuccess(null, context.request, { startTime });
    }

    // Shape response to match old format (backward compatible with formatSubscriptionData)
    return apiSuccess({
      ...data,
      subscription_plans: {
        id: data.plan_id,
        name: data.plan_name || data.plan_type,
        plan_code: data.plan_code,
      },
    }, context.request, { startTime });
  } catch (error) {
    logger.error('GetActiveSubscription error', { error: (error as Error).message, userId: (error as any)?.userId, stack: (error as Error).stack });
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}
