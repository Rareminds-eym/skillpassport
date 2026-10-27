/**
 * Entitlement Service — Zero-Hardcoding Subscription & Feature Gating Engine
 * 
 * Philosophy: Database is single source of truth. The application asks:
 * "What can this tenant do?" — NEVER "What plan code is this tenant on?"
 * 
 * Pattern: Entitlement Engine (Stigg / Schematic / Stripe Entitlements)
 * @module functions/shared/lib/entitlement-service
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface FeatureEntitlement {
  enabled: boolean;
  feature_type: 'boolean' | 'numeric_limit' | 'metered';
  category: string;
  display_name: string;
  limit?: number | null;
  current_usage?: number;
  allocated?: number;
  consumed?: number;
  remaining?: number;
}

export interface EntitlementManifest {
  tenant_id: string;
  is_subscribed: boolean;
  subscription_id: string | null;
  subscription_status: string;
  plan_id: string;
  plan_code: string;
  plan_name: string;
  plan_family: 'recruiter' | 'individual' | 'institution';
  hierarchy_order: number;
  is_sales_only: boolean;
  features: Record<string, FeatureEntitlement>;
  synced_at: string;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  feature_type?: 'boolean' | 'numeric_limit' | 'metered';
  limit?: number | null;
  current_usage?: number;
  remaining?: number;
}

/**
 * Resolves full entitlement manifest for a tenant (organization or user).
 * Gathers plan entitlements, inheritance, tenant overrides, and live credit balances.
 */
export async function getTenantEntitlements(
  supabase: SupabaseClient,
  tenantId: string,
  preferredFamily?: 'recruiter' | 'individual' | 'institution'
): Promise<EntitlementManifest> {
  {
    // M8 hardening: tenantId is interpolated into a PostgREST or() filter below.
    // Restrict to identifier-safe characters so or-taxonomy payloads (dots, commas,
    // parentheses) can never extend the filter with foreign clauses like
    // `organization_id.not.is.null`.
    if (!/^[A-Za-z0-9_-]+$/.test(String(tenantId))) {
      throw new Error(`INVALID_TENANT_ID: rejected unsafe tenant id`);
    }
  }

  // 1. Find active subscription from subscription_cache
  const { data: sub, error: subErr } = await supabase
    .from('subscription_cache')
    .select('*')
    .or(`organization_id.eq.${tenantId},user_id.eq.${tenantId}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subErr && subErr.code !== 'PGRST116') {
    console.error(`[getTenantEntitlements] Error querying subscription_cache for tenant ${tenantId}:`, subErr);
    throw new Error(`Database error querying subscription: ${subErr.message}`);
  }

  let planRow: any = null;

  if (sub?.plan_id) {
    const { data: p, error: pErr } = await supabase
      .from('plans_cache')
      .select('*')
      .eq('id', sub.plan_id)
      .maybeSingle();
    if (pErr && pErr.code !== 'PGRST116') {
      console.error(`[getTenantEntitlements] Error querying plan by id ${sub.plan_id}:`, pErr);
    }
    planRow = p;
  } else if (sub?.plan_code) {
    const { data: p, error: pErr } = await supabase
      .from('plans_cache')
      .select('*')
      .eq('plan_code', sub.plan_code)
      .maybeSingle();
    if (pErr && pErr.code !== 'PGRST116') {
      console.error(`[getTenantEntitlements] Error querying plan by code ${sub.plan_code}:`, pErr);
    }
    planRow = p;
  }

  // 2. Fallback to default free plan for family if no active paid plan
  if (!planRow) {
    let resolvedFamily = preferredFamily;
    if (!resolvedFamily) {
      // Intelligently infer tenant family from organizations / users tables
      const { data: org } = await supabase
        .from('organizations')
        .select('organization_type')
        .eq('id', tenantId)
        .maybeSingle();

      if (org) {
        resolvedFamily = (org.organization_type === 'company' || org.organization_type === 'recruiter' || org.organization_type === 'recruitment')
          ? 'recruiter'
          : 'institution';
      } else {
        const { data: usr } = await supabase
          .from('users')
          .select('role')
          .eq('id', tenantId)
          .maybeSingle();

        if (usr) {
          const roleStr = String(usr.role || '').toLowerCase();
          if (roleStr.includes('recruiter')) {
            resolvedFamily = 'recruiter';
          } else if (roleStr.includes('admin') || roleStr.includes('educator')) {
            resolvedFamily = 'institution';
          } else {
            resolvedFamily = 'individual';
          }
        } else {
          resolvedFamily = 'recruiter';
        }
      }
    }

    const defaultCode = resolvedFamily === 'recruiter' ? 'recruiter_free' : 'freemium';
    const { data: defaultPlan } = await supabase
      .from('plans_cache')
      .select('*')
      .eq('plan_code', defaultCode)
      .maybeSingle();
    planRow = defaultPlan || {
      id: defaultCode === 'recruiter_free' ? 'b0000000-0000-4000-8000-000000000010' : 'a0000000-0000-4000-8000-000000000001',
      plan_code: defaultCode,
      name: defaultCode === 'recruiter_free' ? 'Recruiter Free' : 'Freemium',
      plan_family: resolvedFamily,
      hierarchy_order: 0,
      entity_config: {},
    };
  }

  const planFamily = (planRow.plan_family || preferredFamily) as 'recruiter' | 'individual' | 'institution';
  const hierarchyOrder = planRow.hierarchy_order ?? planRow.display_order ?? 0;
  const isSalesOnly = planRow.entity_config?.recruitment?.purchase_mode === 'contact_sales';

  // 3. Query all features in catalog
  const { data: featuresList, error: featErr } = await supabase
    .from('features')
    .select('id, feature_key, display_name, feature_type, category');

  if (featErr) {
    console.error('[getTenantEntitlements] Error querying features catalog:', featErr);
    throw new Error(`Database error querying features: ${featErr.message}`);
  }

  const featureMap = new Map<string, any>();
  for (const f of featuresList || []) {
    featureMap.set(f.id, f);
  }

  // 4. Query plan entitlements (including parent plan if inherited)
  const planIdsToFetch = [planRow.id];
  if (planRow.parent_plan_id) {
    planIdsToFetch.push(planRow.parent_plan_id);
  }

  const { data: rawEntitlements, error: entErr } = await supabase
    .from('plan_entitlements')
    .select('plan_id, feature_id, is_enabled, value_numeric, value_text')
    .in('plan_id', planIdsToFetch);

  if (entErr) {
    console.error(`[getTenantEntitlements] Error querying plan entitlements for plans ${planIdsToFetch.join(',')}:`, entErr);
    throw new Error(`Database error querying plan entitlements: ${entErr.message}`);
  }

  // Group by feature_id: direct plan entitlements override parent plan entitlements
  const resolvedFeatureEntitlements = new Map<string, any>();

  // If parent plan exists, insert parent entitlements first
  if (planRow.parent_plan_id) {
    for (const ent of (rawEntitlements || []).filter(e => e.plan_id === planRow.parent_plan_id)) {
      resolvedFeatureEntitlements.set(ent.feature_id, ent);
    }
  }

  // Then direct plan entitlements override
  for (const ent of (rawEntitlements || []).filter(e => e.plan_id === planRow.id)) {
    resolvedFeatureEntitlements.set(ent.feature_id, ent);
  }

  // 5. Query tenant overrides (custom enterprise agreements or pilot grants)
  const { data: overrides } = await supabase
    .from('tenant_entitlement_overrides')
    .select('feature_id, is_enabled, value_numeric, value_text, expires_at')
    .eq('tenant_id', tenantId);

  const now = new Date();
  for (const override of overrides || []) {
    if (override.expires_at && new Date(override.expires_at) < now) {
      continue; // Expired override
    }
    resolvedFeatureEntitlements.set(override.feature_id, override);
  }

  const addonLimits = (featuresList || []).some(feature => feature.feature_type === 'numeric_limit')
    ? await numericAddonGrants(supabase, tenantId) : new Map<string, number>();

  // 6. Build final feature map with live metered credit & usage counts
  const finalFeatures: Record<string, FeatureEntitlement> = {};

  for (const [featureId, featDef] of featureMap.entries()) {
    const ent = resolvedFeatureEntitlements.get(featureId);
    const isEnabled = ent?.is_enabled ?? false;
    const fType = featDef.feature_type as 'boolean' | 'numeric_limit' | 'metered';

    const item: FeatureEntitlement = {
      enabled: isEnabled,
      feature_type: fType,
      category: featDef.category,
      display_name: featDef.display_name,
    };

    if (fType === 'numeric_limit') {
      // H4: fail closed. No plan entitlement row for a known numeric-limit feature
      // means the plan does not grant it (limit 0); only an explicit row with a
      // NULL value means "no enforced limit" (Enterprise custom style).
      item.limit = ent && ent.value_numeric != null ? Number(ent.value_numeric) : (ent ? null : 0);
      if (item.limit !== null) item.limit += addonLimits.get(featDef.feature_key) || 0;
      // Get live usage if known resource
      if (featDef.feature_key === 'active_job_posts') {
        const { count } = await supabase
          .from('opportunities')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', tenantId)
          .or('status.eq.open,is_active.eq.true');
        item.current_usage = count || 0;
      } else if (featDef.feature_key === 'recruiter_seats') {
        const { count } = await supabase
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', tenantId);
        item.current_usage = count || 1;
      }
    } else if (fType === 'metered') {
      // Query credit balance via stored procedure
      const { data: balanceData, error: balErr } = await supabase
        .rpc('get_credit_balance', {
          p_tenant_id: tenantId,
          p_feature_key: featDef.feature_key,
        });

      if (balErr) {
        console.error(`[getTenantEntitlements] Error querying credit balance for ${featDef.feature_key} (tenant: ${tenantId}):`, balErr);
      }

      const balance = balanceData?.[0] || { allocated: 0, consumed: 0, remaining: 0 };
      item.allocated = balance.allocated;
      item.consumed = balance.consumed;
      item.remaining = balance.remaining;
      item.limit = ent?.value_numeric ? Number(ent.value_numeric) : null;
      item.enabled = isEnabled && balance.remaining > 0;
    }

    finalFeatures[featDef.feature_key] = item;
  }

  return {
    tenant_id: tenantId,
    is_subscribed: !!sub,
    subscription_id: sub?.id || null,
    subscription_status: sub?.status || 'none',
    plan_id: planRow.id,
    plan_code: planRow.plan_code,
    plan_name: planRow.name,
    plan_family: planFamily,
    hierarchy_order: hierarchyOrder,
    is_sales_only: isSalesOnly,
    features: finalFeatures,
    synced_at: new Date().toISOString(),
  };
}

/**
 * Checks if a tenant has access to a specific capability.
 */
export async function checkEntitlement(
  supabase: SupabaseClient,
  tenantId: string,
  featureKey: string
): Promise<EntitlementCheckResult> {
  const manifest = await getTenantEntitlements(supabase, tenantId);
  const feature = manifest.features[featureKey];

  if (!feature) {
    return {
      allowed: false,
      reason: `Feature '${featureKey}' is not recognized in the capability catalog.`,
    };
  }

  if (feature.feature_type === 'boolean') {
    return {
      allowed: feature.enabled,
      feature_type: 'boolean',
      reason: feature.enabled ? undefined : 'Upgrade your plan to access this feature.',
    };
  }

  if (feature.feature_type === 'numeric_limit') {
    const limit = feature.limit;
    const currentUsage = feature.current_usage || 0;
    if (limit !== null && limit !== undefined && currentUsage >= limit) {
      return {
        allowed: false,
        feature_type: 'numeric_limit',
        limit,
        current_usage: currentUsage,
        reason: `Limit reached (${currentUsage}/${limit}). Upgrade plan to add more.`,
      };
    }
    return {
      allowed: true,
      feature_type: 'numeric_limit',
      limit,
      current_usage: currentUsage,
    };
  }

  if (feature.feature_type === 'metered') {
    const remaining = feature.remaining ?? 0;
    if (remaining <= 0) {
      return {
        allowed: false,
        feature_type: 'metered',
        remaining: 0,
        reason: 'Credits exhausted. Purchase additional credits or upgrade plan.',
      };
    }
    return {
      allowed: true,
      feature_type: 'metered',
      remaining,
    };
  }

  return { allowed: false, reason: 'Unknown feature type' };
}

/**
 * Dynamically compares two plan tiers without hardcoded arrays.
 * Compares hierarchy_order (or display_order) from plans_cache in DB.
 */
export async function comparePlanTiers(
  supabase: SupabaseClient,
  planCodeA: string,
  planCodeB: string
): Promise<'lower' | 'equal' | 'higher'> {
  if (planCodeA === planCodeB) return 'equal';

  const { data: plans } = await supabase
    .from('plans_cache')
    .select('plan_code, hierarchy_order, display_order')
    .in('plan_code', [planCodeA, planCodeB]);

  const planA = plans?.find(p => p.plan_code === planCodeA);
  const planB = plans?.find(p => p.plan_code === planCodeB);

  const orderA = planA?.hierarchy_order ?? planA?.display_order ?? 0;
  const orderB = planB?.hierarchy_order ?? planB?.display_order ?? 0;

  if (orderA < orderB) return 'lower';
  if (orderA > orderB) return 'higher';
  return 'equal';
}

/**
 * Atomically consumes tenant metered credits via Postgres double-entry ledger.
 */
export async function consumeTenantCredits(
  supabase: SupabaseClient,
  tenantId: string,
  featureKey: string,
  amount: number,
  referenceId?: string,
  notes?: string
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  const { data, error } = await supabase.rpc('consume_credits', {
    p_tenant_id: tenantId,
    p_feature_key: featureKey,
    p_amount: amount,
    p_reference_id: referenceId || null,
    p_notes: notes || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as { success: boolean; remaining?: number; error?: string };
}

/**
 * Provisions initial metered credit allocation into credit_ledger on subscription activation.
 */
export async function allocateInitialPlanCredits(
  supabase: SupabaseClient,
  tenantId: string,
  planId: string,
  isOrg: boolean = true,
  notes?: string,
  referenceId?: string
): Promise<{ success: boolean; allocated: number; error?: string }> {
  const { data: meteredEntitlements, error: fetchErr } = await supabase
    .from('plan_entitlements')
    .select('feature_id, value_numeric, features!inner(feature_key, feature_type)')
    .eq('plan_id', planId)
    .eq('features.feature_type', 'metered');

  if (fetchErr) {
    console.error('[allocateInitialPlanCredits] Failed to fetch plan entitlements:', fetchErr);
    return { success: false, allocated: 0, error: fetchErr.message };
  }

  let allocatedCount = 0;
  for (const me of meteredEntitlements || []) {
    const featKey = (me as any).features?.feature_key;
    const quota = Number(me.value_numeric) || 0;
    if (featKey && quota > 0) {
      // referenceId (e.g. razorpay_payment_id / subscription id) feeds
      // uq_credit_ledger_alloc_ref so a replayed payment verification can never
      // stack a second plan allocation. 23505 therefore means "already
      // allocated" — treat as success, not as a failure of the whole purchase.
      const { error: insErr } = await supabase.from('credit_ledger').insert({
        tenant_id: tenantId,
        feature_key: featKey,
        transaction_type: 'plan_allocation',
        amount: quota,
        reference_id: referenceId || null,
        notes: notes || 'Initial plan allocation on subscription activation',
      });
      if (insErr) {
        if ((insErr as any).code === '23505' || /duplicate key/i.test(insErr.message || '')) {
          continue;
        }
        console.error(`[allocateInitialPlanCredits] Failed to insert credit allocation for ${featKey}:`, insErr);
        return { success: false, allocated: allocatedCount, error: insErr.message };
      }
      allocatedCount += quota;
    }
  }

  return { success: true, allocated: allocatedCount };
}

/**
 * Lightweight numeric-limit resolver for hot paths.
 *
 * getTenantEntitlements() loads the full manifest (features catalog, parent
 * plans, all credit balances, all usage counts) — correct for dashboards, too
 * heavy for single-check quota gates that re-count usage themselves.
 * getNumericLimit() resolves ONE feature's numeric_limit in a bounded number
 * of queries and honors tenant overrides first.
 *
 * Returns null when the tenant has no resolvable plan. Callers decide their
 * own fail-default (quota gates in this codebase are fail-closed).
 */
async function numericAddonGrants(supabase: SupabaseClient, tenantId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc('get_addon_numeric_grants', { p_tenant_id: tenantId });
  if (error) throw new Error('Unable to resolve purchased numeric entitlements');
  return new Map((data || []).map((row: { feature_key: string; quantity: number | string }) => [row.feature_key, Number(row.quantity)]));
}

export interface NumericLimitResult {
  limit: number | null;
  enabled: boolean;
}

export async function getNumericLimit(
  supabase: SupabaseClient,
  tenantId: string,
  featureKey: string
): Promise<NumericLimitResult | null> {
  if (!/^[A-Za-z0-9_-]+$/.test(String(tenantId))) return null;
  if (!/^[A-Za-z0-9_]+$/.test(String(featureKey))) return null;

  // The entitlement tables key on feature_id (uuid → features.id), not feature_key.
  const { data: featDef } = await supabase
    .from('features')
    .select('id')
    .eq('feature_key', featureKey)
    .maybeSingle();
  if (!featDef?.id) return null;

  const addons = await numericAddonGrants(supabase,tenantId);
  const withAddons = (limit: number | null) => limit === null ? null : Number(limit) + (addons.get(featureKey) || 0);

  // Tenant override outranks the plan (deterministic, newest first)
  const { data: override } = await supabase
    .from('tenant_entitlement_overrides')
    .select('value_numeric, is_enabled')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .eq('tenant_id', tenantId)
    .eq('feature_id', featDef.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (override && (override.is_enabled ?? true)) {
    return { limit: withAddons(override.value_numeric ?? null), enabled: true };
  }

  const { data: sub } = await supabase
    .from('subscription_cache')
    .select('plan_id, plan_code')
    .or(`organization_id.eq.${tenantId},user_id.eq.${tenantId}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let planId: string | null = sub?.plan_id ?? null;
  if (!planId && sub?.plan_code) {
    const { data: p } = await supabase
      .from('plans_cache')
      .select('id')
      .eq('plan_code', sub.plan_code)
      .maybeSingle();
    planId = p?.id ?? null;
  }
  if (!planId) return null;

  const { data: ent } = await supabase
    .from('plan_entitlements')
    .select('value_numeric, is_enabled')
    .eq('plan_id', planId)
    .eq('feature_id', featDef.id)
    .maybeSingle();

  if (!ent) return null;
  return { limit: withAddons(ent.value_numeric ?? null), enabled: ent.is_enabled ?? false };
}
