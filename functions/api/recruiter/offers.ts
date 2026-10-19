import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { getActiveOrgId, getOrgOwnedOpportunityIds } from '../../lib/org-ownership';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Offers API — offers are the recruiter surface's offer letters.
 *
 * 🔒 DB-verified schema note: `offers` has NO organization_id / created_by
 * columns. Ownership is enforced transitively through `job_id`: an offer is
 * accessible iff its job_id references one of the caller's org-owned
 * opportunities (getOrgOwnedOpportunityIds). This is fail-closed — an offer
 * with an unknown/foreign job_id is simply never returned or deletable.
 */

export const onRequest = async (context: any) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  if (context.request.method === 'DELETE') return onRequestDelete(context);
  return apiMethodNotAllowed();
};

/** Whitelisted offers columns (DB-verified) that a client may supply on create. */
const OFFER_FIELDS = [
  'candidate_id', 'candidate_name', 'job_id', 'job_title', 'template',
  'ctc_band', 'offered_ctc', 'offer_date', 'expiry_date', 'status',
  'sent_via', 'benefits', 'notes', 'response_deadline',
] as const;

/**
 * Sort-field whitelist (PostgREST `order` accepts column names — never pass
 * raw client values into it).
 */
const OFFER_SORT_FIELDS = ['inserted_at', 'updated_at', 'offer_date', 'expiry_date', 'status'] as const;

/** Resolve the caller's org + the set of org-owned opportunity ids (job_id scope). */
async function resolveOrgJobScope(
  supabase: SupabaseClient,
  user: { id: string; org_id?: string | null }
): Promise<string[] | null> {
  const orgId = await getActiveOrgId(supabase, user as any);
  if (!orgId) return null;
  const jobIds = await getOrgOwnedOpportunityIds(supabase, orgId);
  return jobIds;
}

const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  if (isNaN(limit) || limit < 1) return apiError(400, 'VALIDATION_ERROR', 'limit must be a positive integer', context.request);
  if (isNaN(offset) || offset < 0) return apiError(400, 'VALIDATION_ERROR', 'offset must be a non-negative integer', context.request);

  // 🔒 Org is ALWAYS the caller's server-resolved org — body/query org params
  // are ignored (a client-supplied org id is never an authority).
  const jobIds = await resolveOrgJobScope(supabase, user);
  if (!jobIds || jobIds.length === 0) {
    // Fail-closed: no resolvable org or no owned jobs ⇒ empty list, never an
    // all-org dump.
    return apiSuccess({ offers: [], total: 0 }, context.request);
  }

  let query = supabase
    .from('offers')
    .select('*', { count: 'exact' })
    .in('job_id', jobIds); // ownership via job_id → org-owned opportunities

  const status = url.searchParams.get('status');
  if (status) {
    const statuses = status.split(',');
    if (statuses.length === 1) query = query.eq('status', statuses[0]);
    else query = query.in('status', statuses);
  }

  const candidateName = url.searchParams.get('candidateName');
  if (candidateName) query = query.ilike('candidate_name', `%${candidateName}%`);

  const jobTitle = url.searchParams.get('jobTitle');
  if (jobTitle) query = query.ilike('job_title', `%${jobTitle}%`);

  const offerDateFrom = url.searchParams.get('offerDateFrom');
  if (offerDateFrom) query = query.gte('offer_date', offerDateFrom);
  const offerDateTo = url.searchParams.get('offerDateTo');
  if (offerDateTo) query = query.lte('offer_date', offerDateTo);

  const expiryDateFrom = url.searchParams.get('expiryDateFrom');
  if (expiryDateFrom) query = query.gte('expiry_date', expiryDateFrom);
  const expiryDateTo = url.searchParams.get('expiryDateTo');
  if (expiryDateTo) query = query.lte('expiry_date', expiryDateTo);

  // 🔒 Sort field whitelist — never pass raw client values into `order`.
  const sortFieldRaw = url.searchParams.get('sortField') || 'inserted_at';
  const sortField = (OFFER_SORT_FIELDS as readonly string[]).includes(sortFieldRaw) ? sortFieldRaw : 'inserted_at';
  const sortDir = url.searchParams.get('sortDir') || 'desc';
  query = query.order(sortField as any, { ascending: sortDir === 'asc' });

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return apiDbError(error, context.request);
  return apiSuccess({ offers: data, total: count }, context.request);
});

const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  // 🔒 Org ALWAYS server-resolved from the caller.
  const jobIds = await resolveOrgJobScope(supabase, user);
  if (!jobIds) {
    return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
  }

  // 🔒 Field whitelist (no mass-assignment, OWASP API5). id and
  // inserted_at/updated_at are never client-settable here.
  const canonical: Record<string, unknown> = {};
  OFFER_FIELDS.forEach((field) => {
    if (body[field] !== undefined) canonical[field] = body[field];
  });

  // Required NOT NULL columns (DB-verified): candidate_name, job_title, expiry_date.
  const missing = ['candidate_name', 'job_title', 'expiry_date'].filter((f) => !canonical[f]);
  if (missing.length > 0) {
    return apiError(400, 'VALIDATION_ERROR', `Missing required offer field(s): ${missing.join(', ')}`, context.request);
  }

  // 🔒 Object-level authz on create: the offer must attach to one of the
  // caller's org-owned opportunities (fail-closed on unknown/foreign job_id).
  const jobId = String(canonical.job_id ?? '');
  if (!jobId || !jobIds.includes(jobId)) {
    return apiError(403, 'FORBIDDEN', 'Offer must reference a job posted by your organization', context.request);
  }

  // status enum is constrained in DB (pending|accepted|rejected|expired|withdrawn);
  // reject unknown values with a clear 400 instead of a cryptic DB error.
  if (canonical.status != null && !['pending', 'accepted', 'rejected', 'expired', 'withdrawn'].includes(String(canonical.status))) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid offer status', context.request);
  }

  const { data, error } = await supabase
    .from('offers')
    .insert(canonical)
    .select()
    .single();

  if (error) return apiDbError(error, context.request);
  return apiSuccess({ offer: data }, context.request);
});

const onRequestDelete = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id query param required', context.request);

  // 🔒 Object-level authz (OWASP API1): fetch the row, resolve its job_id and
  // verify it belongs to one of the caller's org-owned opportunities BEFORE
  // deleting. Caller without an org scope is denied (fail-closed).
  const jobIds = await resolveOrgJobScope(supabase, user);
  const { data: row, error: fetchError } = await supabase
    .from('offers')
    .select('id, job_id')
    .eq('id', id)
    .limit(1)
    .maybeSingle();
  if (fetchError) return apiDbError(fetchError, context.request);
  if (!row) return apiError(404, 'NOT_FOUND', 'Offer not found', context.request);
  if (!jobIds || !jobIds.includes(String(row.job_id ?? ''))) {
    return apiError(403, 'FORBIDDEN', 'You do not have access to this offer', context.request);
  }

  const { error } = await supabase.from('offers').delete().eq('id', row.id);
  if (error) return apiDbError(error, context.request);
  return apiSuccess({ deleted: true }, context.request);
});
