/** Organization-level Hybrid grants. Non-Hybrid plans retain their existing access. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { apiError } from './response';

export type AdminOrganizationType = 'college' | 'school' | 'university';
export class HybridAccessError extends Error {}

async function checked<T>(query: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw new HybridAccessError('Unable to verify organization feature access');
  return data;
}

async function resolveAdminOrganizationId(
  supabase: SupabaseClient, userId: string, type: AdminOrganizationType, verifiedOrgId?: string,
): Promise<string | null> {
  // org_id comes exclusively from the verified JWT, never the request body.
  if (verifiedOrgId) {
    const org = await checked<any>(supabase.from('organizations').select('id, organization_type').eq('id', verifiedOrgId).maybeSingle());
    if (!org || org.organization_type !== type) throw new HybridAccessError('Unable to verify organization scope');
    return org.id;
  }
  const memberships = await checked<any[]>(supabase.from('organization_members').select('organization_id')
    .eq('user_id', userId).eq('status', 'active'));
  const owned = await checked<any[]>(supabase.from('organizations').select('id').eq('admin_id', userId).eq('organization_type', type));
  const ids = [...new Set([...memberships.map(m => m.organization_id), ...owned.map(o => o.id)])];
  if (!ids.length) throw new HybridAccessError('Unable to resolve organization');
  const orgs = await checked<any[]>(supabase.from('organizations').select('id').in('id', ids).eq('organization_type', type));
  if (orgs.length !== 1) throw new HybridAccessError('An unambiguous organization scope is required');
  return orgs[0].id;
}

export async function getHybridOrganizationAccess(
  supabase: SupabaseClient, userId: string, type: AdminOrganizationType, verifiedOrgId?: string,
): Promise<{ isHybrid: boolean; features: string[]; organizationId: string | null }> {
  const organizationId = await resolveAdminOrganizationId(supabase, userId, type, verifiedOrgId);
  // Cache timestamps describe replication, not which contract is effective.
  // Keep paused/cancelled/expired contracts in the selection: changing status
  // must never turn a restricted Hybrid organization into an unrestricted one.
  const subscription = await checked<any>(supabase.from('subscription_cache')
    .select('plan_code, features, status, subscription_start_date')
    .eq('organization_id', organizationId).eq('is_organization_subscription', true)
    .neq('status', 'pending')
    .or(`subscription_start_date.lte.${new Date().toISOString()},subscription_start_date.is.null`)
    .order('subscription_start_date', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false }).limit(1).maybeSingle());
  return {
    organizationId,
    isHybrid: subscription?.plan_code === 'hybrid',
    features: Array.isArray(subscription?.features) ? subscription.features.filter((f: unknown) => typeof f === 'string') : [],
  };
}

export interface HybridGateResult { allowed: boolean; reason?: string; unavailable?: boolean }

export async function checkHybridFeatureAccess(
  supabase: SupabaseClient, userId: string, type: AdminOrganizationType,
  featureKeys: string | readonly string[], verifiedOrgId?: string,
): Promise<HybridGateResult> {
  try {
    const access = await getHybridOrganizationAccess(supabase, userId, type, verifiedOrgId);
    if (!access.isHybrid) return { allowed: true };
    const keys = typeof featureKeys === 'string' ? [featureKeys] : featureKeys;
    if (!keys.length) return { allowed: false, reason: 'This operation is not available on your plan' };
    const catalog = await checked<any[]>(supabase.from('feature_keys_cache').select('key, is_active')
      .eq('role', `${type}_admin`).eq('product_code', 'skillpassport'));
    if (!catalog.length) throw new HybridAccessError('Feature catalog has not been synchronized');
    // Explicit inactive rows are tombstones. A missing row is not evidence that
    // the feature was retired (it may be a deployment/sync mismatch).
    const allowed = keys.some(key => {
      const entry = catalog.find(row => row.key === key);
      return entry && (entry.is_active === false || access.features.includes(key));
    });
    return { allowed, reason: allowed ? undefined : 'Not included in your plan' };
  } catch (error) {
    console.error('[hybrid-features] Access verification failed', error);
    return { allowed: false, unavailable: true, reason: 'Unable to verify organization feature access' };
  }
}

export async function requireHybridFeature(
  supabase: SupabaseClient, request: Request, type: AdminOrganizationType,
  featureKeys: string | readonly string[], userId: string, verifiedOrgId?: string,
): Promise<Response | null> {
  const result = await checkHybridFeatureAccess(supabase, userId, type, featureKeys, verifiedOrgId);
  if (result.allowed) return null;
  return apiError(result.unavailable ? 503 : 403, result.unavailable ? 'FEATURE_ACCESS_UNAVAILABLE' : 'FEATURE_ACCESS_DENIED',
    result.reason!, request);
}
