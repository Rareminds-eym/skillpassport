/**
 * Shadow table sync utilities — keeps subscription_cache and plans_cache
 * in sync with the auth DB source of truth.
 *
 * Write-through: called after every subscription write to auth DB.
 * Self-healing: stale entries trigger async refresh on next read.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const STALENESS_THRESHOLD_MINUTES = 60;

export async function syncSubscriptionCache(
  supabase: SupabaseClient,
  subscription: Record<string, unknown>,
  plan?: Record<string, unknown> | null,
): Promise<void> {
  const { error } = await supabase
    .from('subscription_cache')
    .upsert({
      id: subscription.id,
      user_id: subscription.user_id,
      organization_id: subscription.organization_id || null,
      plan_id: subscription.plan_id,
      plan_code: subscription.plan_code || (plan as Record<string, unknown>)?.plan_code,
      plan_name: subscription.plan_type || (plan as Record<string, unknown>)?.name,
      plan_type: subscription.plan_type,
      plan_amount: subscription.plan_amount,
      billing_cycle: subscription.billing_cycle,
      status: subscription.status,
      features: subscription.features || (plan as Record<string, unknown>)?.base_features || [],
      subscription_start_date: subscription.subscription_start_date,
      subscription_end_date: subscription.subscription_end_date,
      is_organization_subscription: subscription.is_organization_subscription || false,
      organization_type: subscription.organization_type || null,
      seat_count: subscription.seat_count || 1,
      synced_at: new Date().toISOString(),
      auth_updated_at: subscription.updated_at,
    }, { onConflict: 'id' });

  if (error) {
    console.error('[sync-shadow] Failed to sync subscription_cache:', error.message);
  }
}

export async function syncPlanCache(
  supabase: SupabaseClient,
  plan: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('plans_cache')
    .upsert({
      id: plan.id,
      plan_code: plan.plan_code,
      name: plan.name,
      business_type: plan.business_type,
      applicable_entities: plan.applicable_entities,
      pricing_matrix: plan.pricing_matrix,
      base_features: plan.base_features,
      entity_config: plan.entity_config,
      display_order: plan.display_order,
      is_active: plan.is_active,
      synced_at: new Date().toISOString(),
      auth_updated_at: plan.updated_at,
    }, { onConflict: 'id' });

  if (error) {
    console.error('[sync-shadow] Failed to sync plans_cache:', error.message);
  }
}

export async function syncAllPlansCache(
  supabase: SupabaseClient,
  plans: Record<string, unknown>[],
): Promise<void> {
  for (const plan of plans) {
    await syncPlanCache(supabase, plan);
  }
}

export function isStale(syncedAt: string | null, thresholdMinutes = STALENESS_THRESHOLD_MINUTES): boolean {
  if (!syncedAt) return true;
  const synced = new Date(syncedAt).getTime();
  const threshold = thresholdMinutes * 60 * 1000;
  return Date.now() - synced > threshold;
}
