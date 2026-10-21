import type { SupabaseClient } from '@supabase/supabase-js';
import { apiError } from '../../../lib/response';

/** Read only catalog metadata, never client-supplied purchase flags. */
export function isSalesOnlyPlan(plan: { entity_config?: unknown }): boolean {
  const configs = plan.entity_config;
  if (!configs || typeof configs !== 'object') return false;
  return Object.values(configs).some(config =>
    config && typeof config === 'object' && config.purchase_mode === 'contact_sales',
  );
}

class CatalogPlanError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
}

/** Resolve one authoritative plan for order creation and every fulfillment path. */
export async function requireSelfServePlan(supabase: SupabaseClient, reference: {
  plan_id?: unknown; plan_code?: unknown; plan_name?: unknown;
}) {
  let query = supabase.from('plans_cache').select('id, plan_code, name, entity_config, business_type, applicable_entities, pricing_matrix, base_features').eq('is_active', true);
  if (typeof reference.plan_id === 'string' && reference.plan_id) query = query.eq('id', reference.plan_id);
  else if (typeof reference.plan_code === 'string' && reference.plan_code) query = query.eq('plan_code', reference.plan_code);
  else if (typeof reference.plan_name === 'string' && reference.plan_name) query = query.eq('name', reference.plan_name);
  else throw new CatalogPlanError(400, 'VALIDATION_ERROR', 'A catalog plan is required.');
  const { data: plan, error } = await query.maybeSingle();
  if (error) throw new CatalogPlanError(503, 'CATALOG_UNAVAILABLE', 'Unable to verify plan availability.');
  if (!plan) throw new CatalogPlanError(404, 'NOT_FOUND', 'Plan not found or inactive.');
  if (isSalesOnlyPlan(plan)) throw new CatalogPlanError(400, 'CONTACT_SALES_REQUIRED', 'This plan requires an agreed sales proposal before activation.');
  return plan;
}

/** Validate the purchase audience without restricting the catalogue's plan codes or prices. */
export async function assertPlanPurchaseScope(
  supabase: SupabaseClient,
  plan: { business_type?: string; applicable_entities?: string[] },
  user: { id: string; org_id?: string; roles?: readonly string[] },
  bulkOrganizationId?: string,
): Promise<{ organizationId?: string; organizationType?: string }> {
  if (!bulkOrganizationId && plan.business_type === 'b2c') {
    if (!user.roles?.some(role => ['learner', 'educator', 'school_educator', 'college_educator'].includes(role))) {
      throw new CatalogPlanError(403, 'PLAN_SCOPE_MISMATCH', 'This individual plan does not cover your organization dashboard.');
    }
    if (plan.applicable_entities?.includes('all')) return {};
    const { data: org, error } = await supabase.from('organizations').select('organization_type').eq('id', user.org_id || '').maybeSingle();
    if (error) throw new CatalogPlanError(503, 'SUBSCRIPTION_UNAVAILABLE', 'Unable to verify the plan audience.');
    if (!org || !plan.applicable_entities?.includes(org.organization_type)) throw new CatalogPlanError(403, 'PLAN_SCOPE_MISMATCH', 'This plan is not available for your account.');
    return { organizationType: org.organization_type };
  }
  if (!['b2b', 'b2c'].includes(plan.business_type ?? '')) throw new CatalogPlanError(503, 'CATALOG_UNAVAILABLE', 'Plan audience is not configured.');
  const orgId = bulkOrganizationId || user.org_id;
  if (!orgId) throw new CatalogPlanError(403, 'ORGANIZATION_REQUIRED', 'An organization is required for this purchase.');
  const [{ data: org, error: orgError }, { data: member, error: memberError }] = await Promise.all([
    supabase.from('organizations').select('id, organization_type, admin_id').eq('id', orgId).maybeSingle(),
    supabase.from('organization_members').select('role').eq('user_id', user.id).eq('organization_id', orgId).eq('status', 'active').maybeSingle(),
  ]);
  if (orgError || memberError) throw new CatalogPlanError(503, 'SUBSCRIPTION_UNAVAILABLE', 'Unable to verify organization membership.');
  const adminRoles = ['admin', 'owner', 'school_admin', 'college_admin', 'university_admin', 'company_admin'];
  const verifiedAdmin = user.org_id === orgId && user.roles?.some(role => adminRoles.includes(role));
  if (!org || (!verifiedAdmin && org.admin_id !== user.id && !adminRoles.includes(member?.role))) throw new CatalogPlanError(403, 'FORBIDDEN', 'Only an organization administrator can make this purchase.');
  const roleEntity = (['school', 'college', 'university'] as const).find(type => user.roles?.includes(`${type}_admin`));
  const recruitmentAdmin = !user.roles?.includes('learner') && user.roles?.some(role => ['owner', 'company_admin', 'recruiter'].includes(role));
  const type = org.organization_type === 'company' ? 'recruitment'
    : org.organization_type || roleEntity || (recruitmentAdmin ? 'recruitment' : undefined);
  if (!type || !plan.applicable_entities?.some(entity => entity === 'all' || entity === type)) {
    throw new CatalogPlanError(403, 'PLAN_SCOPE_MISMATCH', 'This plan is not available for this organization type.');
  }
  return { organizationId: org.id, organizationType: type };
}

export function catalogPlanErrorResponse(error: unknown, request: Request): Response | null {
  return error instanceof CatalogPlanError ? apiError(error.status, error.code, error.message, request) : null;
}

/** An individual upgrade must not overwrite a bulk purchase owned by the same buyer. */
export async function subscriptionForUpgrade(supabase: SupabaseClient, userId: string,
  plan: { business_type: string }, organizationId?: string) {
  const { data: plans, error: planError } = await supabase.from('plans_cache').select('id').eq('business_type', plan.business_type);
  if (planError) throw new CatalogPlanError(503, 'CATALOG_UNAVAILABLE', 'Unable to verify existing subscription plans.');
  if (!plans?.length) return null;
  let query = supabase.from('subscription_cache').select('*').eq('user_id', userId)
    .in('plan_id', plans.map(plan => plan.id)).eq('is_organization_subscription', plan.business_type === 'b2b')
    .in('status', ['active', 'pending', 'grace_period']).order('subscription_start_date', { ascending: false }).limit(1);
  if (plan.business_type === 'b2b') {
    if (!organizationId) throw new CatalogPlanError(400, 'ORGANIZATION_REQUIRED', 'An organization is required for institution checkout.');
    query = query.eq('organization_id', organizationId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new CatalogPlanError(503, 'SUBSCRIPTION_UNAVAILABLE', 'Unable to verify the existing subscription.');
  return data;
}
