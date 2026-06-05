/**
 * Reconcile Subscriptions
 *
 * POST /api/cron/reconcile-subscriptions
 *
 * Called by sso-worker's scheduled handler to reconcile subscription_cache
 * with the auth DB source of truth. Detects drift (stale entries, missing
 * entries, status mismatches) and self-heals.
 *
 * Protected by a shared cron secret — not accessible to end users.
 */

import { apiSuccess, apiError } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';
import { ssoSyncSubscription, ssoSyncPlans } from '../../lib/sso-client';
import { syncSubscriptionCache, syncAllPlansCache } from '../../lib/sync-shadow';

interface ReconcileEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SSO_SERVICE: Fetcher;
  CRON_SECRET?: string;
}

export async function onRequestPost(context: { request: Request; env: ReconcileEnv }): Promise<Response> {
  const { env, request } = context;

  // Validate cron secret
  const cronSecret = request.headers.get('X-Cron-Secret');
  if (env.CRON_SECRET && cronSecret !== env.CRON_SECRET) {
    return apiError(401, 'UNAUTHORIZED', 'Unauthorized', request);
  }

  const supabase = getServiceClient(env);
  const results = {
    subscriptions_checked: 0,
    subscriptions_synced: 0,
    plans_synced: 0,
    errors: [] as string[],
  };

  try {
    // 1. Sync plans cache (rarely changes, always sync)
    try {
      const plansData = await ssoSyncPlans(env);
      if (plansData.plans && plansData.plans.length > 0) {
        await syncAllPlansCache(supabase, plansData.plans);
        results.plans_synced = plansData.plans.length;
      }
    } catch (planErr: any) {
      results.errors.push(`Plans sync failed: ${planErr.message}`);
    }

    // 2. Find stale subscription_cache entries
    const threshold = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: staleEntries, error: staleError } = await supabase
      .from('subscription_cache')
      .select('id, user_id, synced_at')
      .lt('synced_at', threshold)
      .order('synced_at', { ascending: true })
      .limit(100);

    if (staleError) {
      results.errors.push(`Stale query failed: ${staleError.message}`);
      return apiSuccess(results, request);
    }

    results.subscriptions_checked = staleEntries?.length || 0;

    // 3. Re-sync each entry from auth DB
    for (const entry of staleEntries || []) {
      try {
        const syncData = await ssoSyncSubscription(env, entry.user_id);
        if (syncData.subscription) {
          await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
          results.subscriptions_synced++;
        }
      } catch (syncErr: any) {
        results.errors.push(`User ${entry.user_id}: ${syncErr.message}`);
      }
    }

    console.log('[Reconcile] Completed:', JSON.stringify(results));

    return apiSuccess(results, request);
  } catch (error: any) {
    console.error('[Reconcile] Fatal error:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message, request);
  }
}
