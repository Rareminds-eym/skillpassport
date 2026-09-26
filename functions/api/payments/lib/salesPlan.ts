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
  let query = supabase.from('plans_cache').select('id, plan_code, name, entity_config').eq('is_active', true);
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

export function catalogPlanErrorResponse(error: unknown, request: Request): Response | null {
  return error instanceof CatalogPlanError ? apiError(error.status, error.code, error.message, request) : null;
}
