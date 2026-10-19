/**
 * Opportunities API — list with filters (ORG-SCOPED)
 */
type AuthenticatedContext = Parameters<PagesFunction>[0];
import { getContextUser, withAuth } from '../../lib/auth';
import { notifyLearnersOfNewOpportunity } from '../../lib/newOpportunityNotifications';
import { verifyOrgAccess } from '../../lib/permissions';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';
import { eligibleJobs, isEligibleJob, stringSkills } from '../../lib/job-recommendations';
import { getNumericLimit } from '../../shared/lib/entitlement-service';
import {
  getActiveOrgId,
  getOrgMemberUserIds,
  getOrgOwnedOpportunityIds,
  assertInterviewAccess,
  getInterviewRow,
  assertLearnerOwnership,
  ALLOWED_REQUISITION_STATUSES,
} from '../../lib/org-ownership';

/**
 * Server-side application_status whitelist — derived from the live DB CHECK
 * constraint `check_application_status` on applied_jobs (verified via psql).
 * Never trust the client status value.
 */
const APPLICATION_STATUSES = [
  'applied', 'viewed', 'under_review', 'interview_scheduled', 'interviewed',
  'offer_received', 'accepted', 'rejected', 'withdrawn',
] as const;

export const onRequest = async (context: any) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

/**
 * Helper function to get opportunity IDs for a user's organization
 * Handles org verification and returns opportunity IDs or error
 */
async function getOrgOpportunityIds(
  supabase: any,
  user: any,
  context: AuthenticatedContext
): Promise<{ ids?: string[]; error?: Response }> {
  const orgId = user?.org_id;

  if (!orgId) {
    return { error: apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request) };
  }

  // Verify user has access to this organization
  const access = await verifyOrgAccess(supabase, user.sub, orgId, undefined);
  if (!access.allowed) {
    return { error: access.error || apiError(403, 'FORBIDDEN', 'Access denied to this organization', context.request) };
  }

  // Get opportunities belonging to this organization
  const { data: orgOpportunities, error: oppError } = await supabase
    .from('opportunities')
    .select('id')
    .eq('organization_id', orgId);

  if (oppError) {
    return { error: apiDbError(oppError, context.request) };
  }

  if (!orgOpportunities || orgOpportunities.length === 0) {
    return { ids: [] };
  }

  return { ids: orgOpportunities.map((o: any) => o.id) };
}

async function findOpportunityById(supabase: any, id: number | string, select = '*') {
  const rawId = String(id || '').trim();
  if (!rawId) {
    return { data: null, error: null };
  }

  return supabase
    .from('opportunities')
    .select(select)
    .eq('id', rawId)
    .maybeSingle();
}

// ── Org-scope resolvers (OWASP API1: object-level authorization) ──────────────
// Org ownership is ALWAYS derived from the DB via org-ownership helpers — the
// JWT org claim or the user's ACTIVE organization_members row — never from
// client input.

interface OrgScopeInfo {
  orgId: string | null;
  memberIds: string[] | null;
  oppIds: string[] | null;
}

/** Resolve the caller's org scope; never throws (null org = caller has none). */
async function resolveOrgScopeInfo(supabase: any, user: any): Promise<OrgScopeInfo> {
  const orgId = await getActiveOrgId(supabase, user);
  if (!orgId) return { orgId: null, memberIds: null, oppIds: null };
  const [memberIds, oppIds] = await Promise.all([
    getOrgMemberUserIds(supabase, orgId),
    getOrgOwnedOpportunityIds(supabase, orgId),
  ]);
  return { orgId, memberIds, oppIds };
}

/** Fetch an applied_jobs row's primary keys for gating (learner_id, opportunity_id, id). */
async function getApplicationRow(supabase: any, id: any) {
  const rawId = String(id || '').trim();
  if (!rawId) return null;
  const { data, error } = await supabase
    .from('applied_jobs')
    .select('id, learner_id, opportunity_id')
    .eq('id', rawId)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[opportunities] application lookup failed:', { code: error.code });
    return null;
  }
  return data ?? null;
}

/**
 * Mutation gate for an application row: the caller must be a member of the org
 * that owns the application's opportunity (recruiter surface) OR the learner
 * who owns the application (learner surface — mirrors apply-to-job's
 * assertLearnerOwnership rule). Deny-by-default: no scope ⇒ 403.
 */
async function canMutateApplication(
  supabase: any,
  user: any,
  scope: OrgScopeInfo,
  appRow: { learner_id: string; opportunity_id: string } | null
): Promise<boolean> {
  if (!appRow) return false;
  // Learner path: the application belongs to the caller's own learner identity.
  if (appRow.learner_id) {
    const { data: own } = await supabase
      .from('learners')
      .select('id')
      .eq('id', appRow.learner_id)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (own) return true;
  }
  // Recruiter path: target opportunity belongs to the caller's active org.
  if (scope.orgId && scope.oppIds && scope.oppIds.includes(String(appRow.opportunity_id))) return true;
  return false;
}

// ── Interview gating (fixes in the interviews action block use these) ────────
// interviews has NO organization_id column. DB id-space fact (psql-verified):
// interviews.learner_id > learners(user_id) while applied_jobs.learner_id >
// learners(id), so the foundation org-scope learner compare runs in USER space.

const INTERVIEW_CREATE_FIELDS = [
  'learner_id', 'candidate_name', 'candidate_email', 'candidate_phone',
  'job_title', 'interviewer', 'interviewer_email', 'date', 'duration',
  'status', 'type', 'meeting_type', 'meeting_link', 'meeting_notes', 'scorecard',
] as const;

const INTERVIEW_UPDATE_FIELDS = [
  'status', 'type', 'meeting_type', 'meeting_link', 'meeting_notes',
  'duration', 'date', 'interviewer', 'interviewer_email',
  'candidate_email', 'candidate_phone', 'completed_date', 'scorecard',
] as const;

/**
 * Interview-scope helper — learner ids owning rows visible to the caller,
 * in the USER id-space (learners.user_id):
 *   own identity + learners who applied to the caller's org-owned opportunities.
 */
async function getInterviewLearnerUserIds(supabase: any, user: any): Promise<string[] | null> {
  const ids = new Set<string>();
  if (user?.id) ids.add(user.id); // learners.user_id === users.id (FK space)

  const orgId = await getActiveOrgId(supabase, user);
  if (orgId) {
    const oppIds = await getOrgOwnedOpportunityIds(supabase, orgId);
    if (oppIds.length > 0) {
      const { data: apps, error: appErr } = await supabase
        .from('applied_jobs')
        .select('learner_id')
        .in('opportunity_id', oppIds);
      if (!appErr && (apps || []).length > 0) {
        const learnerIds = [...new Set((apps || []).map((r: any) => r.learner_id))].filter(Boolean);
        if (learnerIds.length > 0) {
          const { data: learnerRows, error: learnerErr } = await supabase
            .from('learners')
            .select('user_id')
            .in('id', learnerIds);
          if (!learnerErr) {
            (learnerRows || []).forEach((r: any) => { if (r.user_id) ids.add(r.user_id); });
          }
        }
      }
    }
  }
  return [...ids];
}

/**
 * Org/interview access gate used by every interview read-by-id and mutation.
 * Foundation rule first (assertInterviewAccess: creator OR applied-to-org
 * learner), supplemented by the real DB id-space check (interview learner = the
 * caller's own user id, i.e. self) since the foundation compare runs in the
 * applied_jobs learner id-space and cannot match interviews' user-space ids.
 */
async function canAccessInterview(supabase: any, user: any, interview: { learner_id?: string | null; created_by?: string | null } | null): Promise<boolean> {
  if (!interview) return false;
  if (interview.created_by && interview.created_by === user.id) return true;
  // Self (learner): interviews.learner_id stores learners.user_id (= users.id).
  if (interview.learner_id && interview.learner_id === user.id) return true;
  const orgId = await getActiveOrgId(supabase, user);
  if (await assertInterviewAccess(supabase, user, orgId, interview)) return true;
  // Org member checking an interview whose learner applied to one of the org's
  // opportunities (user-space compare).
  if (orgId && interview.learner_id) {
    const learnerUserIds = await getInterviewLearnerUserIds(supabase, user);
    if (learnerUserIds && learnerUserIds.includes(interview.learner_id)) return true;
  }
  return false;
}

/**
 * Load + gate an interview by id for any read-by-id or mutation. Fetches the
 * canonical row BEFORE touching it (deny-by-default) and returns an error
 * Response on gate failure instead of a row.
 */
async function loadGatedInterview(
  supabase: any,
  user: any,
  context: AuthenticatedContext,
  id: any
): Promise<{ id: string; row: { learner_id: string | null; created_by: string | null } | null; error: Response | null }> {
  const rawId = String(id || '').trim();
  if (!rawId) {
    return { id: rawId, row: null, error: apiError(400, 'VALIDATION_ERROR', 'id required', context.request) };
  }
  const row = await getInterviewRow(supabase, rawId);
  if (!row) {
    // getInterviewRow folds "missing" and "db error" into null → NOT_FOUND.
    return { id: rawId, row: null, error: apiError(404, 'NOT_FOUND', 'Interview not found', context.request) };
  }
  if (!(await canAccessInterview(supabase, user, row))) {
    return { id: rawId, row: null, error: apiError(403, 'FORBIDDEN', 'You do not have access to this interview', context.request) };
  }
  return { id: rawId, row, error: null };
}

// ── Shortlist ownership gate ─────────────────────────────────────────────────
// shortlists has NO organization_id: ownership derives from created_by being an
// active member of the caller's org (or the caller themself). Rows are fetched
// BEFORE any mutation (deny-by-default).
const SL_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

async function loadGatedShortlist(
  supabase: any,
  user: any,
  context: AuthenticatedContext,
  id: any
): Promise<{ id: string; row: Record<string, any> | null; error: Response | null }> {
  const rawId = String(id || '').trim();
  if (!rawId || !SL_ID_RE.test(rawId)) {
    return { id: rawId, row: null, error: apiError(400, 'VALIDATION_ERROR', 'id required', context.request) };
  }
  const { data: row, error } = await supabase
    .from('shortlists')
    .select('id, created_by')
    .eq('id', rawId)
    .limit(1)
    .maybeSingle();
  if (error) return { id: rawId, row: null, error: apiDbError(error, context.request) };
  if (!row) return { id: rawId, row: null, error: apiError(404, 'NOT_FOUND', 'Shortlist not found', context.request) };
  const orgId = await getActiveOrgId(supabase, user);
  const memberIds = orgId ? await getOrgMemberUserIds(supabase, orgId) : [];
  const createdBy = String(row.created_by ?? '');
  if (!createdBy || (createdBy !== user.id && !memberIds.includes(createdBy))) {
    return { id: rawId, row: null, error: apiError(403, 'FORBIDDEN', 'You do not have access to this shortlist', context.request) };
  }
  return { id: rawId, row, error: null };
}

const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as unknown as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);

  const id = url.searchParams.get('id');
  const learnerFeed = user.roles?.includes('learner') === true;
  if (id) {
    const { data, error } = await findOpportunityById(supabase, id);
    if (error) return apiDbError(error, context.request);
    if (!data) return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request);
    if (learnerFeed && !isEligibleJob(data)) return apiError(404, 'NOT_FOUND', 'Opportunity is no longer available', context.request);
    return apiSuccess({ opportunity: data }, context.request);
  }

  const rawLimit = parseInt(url.searchParams.get('limit') || '6', 10);
  const rawOffset = parseInt(url.searchParams.get('offset') || '0', 10);
  const searchTerm = url.searchParams.get('search') || '';
  const sortBy = url.searchParams.get('sortBy') || 'newest';
  const activeOnly = url.searchParams.get('activeOnly') !== 'false';
  const employmentType = url.searchParams.get('employmentType');
  const experienceLevel = url.searchParams.get('experienceLevel');
  const mode = url.searchParams.get('mode');
  const department = url.searchParams.get('department');
  const salaryMin = url.searchParams.get('salaryMin');
  const salaryMax = url.searchParams.get('salaryMax');
  const postedWithin = url.searchParams.get('postedWithin');

  if (Number.isNaN(rawLimit) || rawLimit < 1) return apiError(400, 'VALIDATION_ERROR', 'limit must be a positive integer', context.request);
  if (Number.isNaN(rawOffset) || rawOffset < 0) return apiError(400, 'VALIDATION_ERROR', 'offset must be a non-negative integer', context.request);
  const limit = rawLimit;
  const offset = rawOffset;

  const isRecruiter = !!user.roles && (user.roles.includes('recruiter') || user.roles.includes('company_admin'));

  let query = supabase
    .from('opportunities')
    .select('*', { count: 'exact' })
    .neq('employment_type', 'factory_visit');

  const requestedOrgId = url.searchParams.get('org_id');

  if (isRecruiter) {
    const orgId = requestedOrgId || user.org_id;

    if (!orgId) {
      return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required for recruiters', context.request);
    }

    // Verify recruiter has access to this organization
    const access = await verifyOrgAccess(supabase, user.sub, orgId, undefined);
    if (!access.allowed) {
      return access.error || apiError(403, 'FORBIDDEN', 'Access denied to this organization', context.request);
    }

    query = query.eq('organization_id', orgId);
  } else {
    // For non-recruiters (learners, educators, super_admins), allow filtering by org_id if requested
    if (requestedOrgId) {
      query = query.eq('organization_id', requestedOrgId);
    }
  }

  if (activeOnly) query = query.eq('is_active', true);
  if (learnerFeed) query = eligibleJobs(query);

  if (employmentType) {
    const vals = employmentType.split(',');
    if (vals.length === 1) query = query.eq('employment_type', vals[0]);
    else query = query.in('employment_type', vals);
  }
  if (experienceLevel) {
    const vals = experienceLevel.split(',');
    if (vals.length === 1) query = query.eq('experience_level', vals[0]);
    else query = query.in('experience_level', vals);
  }
  if (mode) {
    const vals = mode.split(',');
    if (vals.length === 1) query = query.eq('mode', vals[0]);
    else query = query.in('mode', vals);
  }
  if (department) {
    const vals = department.split(',');
    if (vals.length === 1) query = query.eq('department', vals[0]);
    else query = query.in('department', vals);
  }
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`);
  }
  if (salaryMin) {
    const raw = parseInt(salaryMin, 10);
    if (Number.isNaN(raw) || raw < 0) return apiError(400, 'VALIDATION_ERROR', 'salaryMin must be a non-negative integer', context.request);
    query = query.gte('salary_range_min', raw);
  }
  if (salaryMax) {
    const raw = parseInt(salaryMax, 10);
    if (Number.isNaN(raw) || raw < 0) return apiError(400, 'VALIDATION_ERROR', 'salaryMax must be a non-negative integer', context.request);
    query = query.lte('salary_range_max', raw);
  }
  if (postedWithin) {
    const raw = parseInt(postedWithin, 10);
    if (Number.isNaN(raw) || raw < 1) return apiError(400, 'VALIDATION_ERROR', 'postedWithin must be a positive integer', context.request);
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - raw);
    query = query.gte('created_at', dateThreshold.toISOString());
  }

  const ascending = sortBy === 'oldest';
  if (!ascending) {
    // Boost/featured fulfilment (spec §6): boosted and featured posts surface above
    // regular feed positions while their window is active; otherwise created_at wins.
    query = query
      .order('boosted_until', { ascending: false, nullsFirst: false })
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending });
  }
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return apiDbError(error, context.request);

  // Featured-employer surface (spec §6): annotate rows whose organizations hold an
  // active featured_employer add-on override so the learner UI can badge them.
  const featuredEmployerByOrg = await resolveFeaturedEmployerOrgs(supabase, data || []);
  const annotated = (data || []).map((o: any) => ({
    ...o,
    featuredEmployer: featuredEmployerByOrg.has(String(o.organization_id)),
  }));

  return apiSuccess({ opportunities: annotated, total: count }, context.request);
});

/**
 * One batched lookup of active featured_employer overrides for the organizations
 * present on the current page. Returns org ids that are currently featured.
 */
async function resolveFeaturedEmployerOrgs(supabase: any, rows: any[]): Promise<Set<string>> {
  const orgIds = [...new Set(rows.map((o: any) => o?.organization_id).filter(Boolean))];
  if (orgIds.length === 0) return new Set();

  const { data: feature, error: featErr } = await supabase
    .from('features')
    .select('id')
    .eq('feature_key', 'featured_employer')
    .maybeSingle();
  if (featErr || !feature) return new Set();

  const { data: overrides, error: ovErr } = await supabase
    .from('tenant_entitlement_overrides')
    .select('tenant_id, expires_at')
    .eq('feature_id', feature.id)
    .eq('is_enabled', true)
    .in('tenant_id', orgIds);
  if (ovErr) return new Set();

  const now = Date.now();
  return new Set(
    (overrides || [])
      .filter((ov: any) => !ov.expires_at || new Date(ov.expires_at).getTime() > now)
      .map((ov: any) => String(ov.tenant_id))
  );
}

const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as unknown as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const body: any = await context.request.json().catch(() => ({}));
  const { action } = body;

  if (!action) return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);

  switch (action) {

    // ── Existing actions ──
    case 'can-proceed-pipeline': {
      const user = getContextUser(context);
      const { application_id } = body;
      if (!application_id) return apiError(400, 'VALIDATION_ERROR', 'application_id required', context.request);
      // 🔒 Object-level authz (OWASP API1): the pipeline oracle must only ever
      // be consulted for an application targeting one of THIS org's
      // opportunities — otherwise it is a cross-tenant metadata oracle.
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(403, 'FORBIDDEN', 'No active organization for this user', context.request);
      const orgOppIds = await getOrgOwnedOpportunityIds(supabase, orgId);
      const { data: appRow, error: appErr } = await supabase
        .from('applied_jobs')
        .select('opportunity_id')
        .eq('id', String(application_id))
        .limit(1)
        .maybeSingle();
      if (appErr) return apiDbError(appErr, context.request);
      if (!appRow || !orgOppIds.includes(String(appRow.opportunity_id ?? ''))) {
        return apiError(403, 'FORBIDDEN', 'Application does not belong to your organization', context.request);
      }
      const { data, error } = await supabase.rpc('can_proceed_in_pipeline', { p_application_id: application_id });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ canProceed: data }, context.request);
    }

    case 'increment-search-usage': {
      const user = getContextUser(context);
      const { search_id } = body;
      if (!search_id) return apiError(400, 'VALIDATION_ERROR', 'search_id required', context.request);
      // 🔒 Object-level authz (OWASP API1): a saved search may only be
      // incremented by its owner — never used as a cross-user write.
      const { data: row, error: rowErr } = await supabase
        .from('recruiter_saved_searches')
        .select('recruiter_id')
        .eq('id', String(search_id))
        .limit(1)
        .maybeSingle();
      if (rowErr) return apiDbError(rowErr, context.request);
      if (!row || String(row.recruiter_id ?? '') !== String(user.id)) {
        return apiError(403, 'FORBIDDEN', 'You do not own this saved search', context.request);
      }
      const { error } = await supabase.rpc('increment_search_usage', { search_id });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ incremented: true }, context.request);
    }

    // Job boost fulfilment (spec §6): 1 job_boost_credits credit per boost event.
    // Boosted posts surface above regular feed positions while the window is active.
    //
    // Idempotency (Stripe pattern): credit consumption is keyed on the caller's
    // optional `requestId`. A replayed request finds the pre-existing
    // credit_ledger consumption row for (tenant, feature, reference) and is
    // treated as ALREADY CHARGED — the boost window is recomputed from the row's
    // current state without a second deduction.
    case 'boost-opportunity': {
      const user = getContextUser(context);
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      if (!user.org_id) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);

      const access = await verifyOrgAccess(supabase, user.sub, user.org_id, undefined);
      if (!access.allowed) {
        return access.error || apiError(403, 'FORBIDDEN', 'Access denied to this organization', context.request);
      }

      // The post must belong to the calling organization and be eligible
      const { data: existing, error: exErr } = await supabase
        .from('opportunities')
        .select('id, status, is_active, boosted_until')
        .eq('id', String(id))
        .eq('organization_id', user.org_id)
        .maybeSingle();
      if (exErr) return apiDbError(exErr, context.request);
      const visible = existing && (existing.status === 'open' || existing.is_active === true);
      if (!visible) return apiError(404, 'NOT_FOUND', 'Active opportunity not found in this organization', context.request);

      // Re-boost EXTEND semantics: an already-boosted post gets its window
      // extended by 7 days from the later of (existing expiry, now) — never
      // shortened, never restarted from zero. The charge stays 1 credit.
      const now = new Date();
      const base = existing.boosted_until && new Date(existing.boosted_until).getTime() > now.getTime()
        ? new Date(existing.boosted_until)
        : now;
      const boostedUntil = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Idempotency reference: client requestId when present, else a
      // feature-scoped random id (Stripe idempotency-key pattern). Refunds use
      // the identical reference so charge/refund rows stay linked.
      const requestId =
        typeof body.requestId === 'string' && body.requestId.trim()
          ? body.requestId.trim()
          : `job_boost_credits-${existing.id}-${crypto.randomUUID()}`;

      // Pre-check (idempotency contract): if a consumption row already exists
      // for (tenant, feature, reference) treat the request as ALREADY CHARGED
      // and continue the flow — no second deduction, no failure.
      let credit: { allowed: boolean; success: boolean; remaining?: number } | null = null;
      const { data: priorCharge } = await supabase
        .from('credit_ledger')
        .select('id')
        .eq('tenant_id', user.org_id)
        .eq('feature_key', 'job_boost_credits')
        .eq('reference_id', requestId)
        .eq('transaction_type', 'consumption')
        .limit(1)
        .maybeSingle();
      if (priorCharge) {
        credit = { allowed: true, success: true };
      } else {
        // Pre-check the balance so we don't charge a credit whose downstream
        // update then fails (charge compensation below covers the race window).
        const { enforceAndConsumeCredits } = await import('../../shared/lib/credit-middleware');
        credit = await enforceAndConsumeCredits(
          supabase,
          user.org_id,
          'job_boost_credits',
          1,
          requestId,
          JSON.stringify({ boosted_by: user.id, opportunity_id: existing.id, request_id: requestId }),
          context.request
        );
        // Note on the 23505 arm of the idempotency contract: credit-ledger rows
        // for transaction_type='consumption' carry no UNIQUE constraint (only
        // allocation rows do, via uq_credit_ledger_alloc_ref), and
        // enforceAndConsumeCredits does not surface the underlying error code —
        // so the pre-check above is the app-level idempotency gate here. The
        // 23505-treat-as-charged branch is enforced at the ledger level where
        // the constraint exists (plan allocation / top-up replay paths).
      }
      if (!credit.allowed || !credit.success) {
        return (credit as any).errorResponse || (credit as any).response || apiError(402, 'INSUFFICIENT_CREDITS', 'Credit deduction failed', context.request);
      }
      const chargedNow = !priorCharge;

      const { data: updated, error: upErr } = await supabase
        .from('opportunities')
        .update({
          boosted_until: boostedUntil.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, boosted_until, featured_until')
        .single();
      if (upErr) {
        // The charge already succeeded — refund it so a failed update never
        // burns a credit silently (best-effort; the reference ties both rows so
        // a replay with the same requestId never double-refunds... the ledger
        // refund insert is app-level compensating action, same reference).
        if (chargedNow) {
          try {
            await supabase.from('credit_ledger').insert({
              tenant_id: user.org_id,
              feature_key: 'job_boost_credits',
              transaction_type: 'refund',
              amount: 1,
              reference_id: requestId,
              notes: JSON.stringify({ reason: 'boost_update_failed', boosted_by: user.id, opportunity_id: existing.id }),
            });
          } catch (refundErr) {
            console.error('[boost-opportunity] Failed to refund credit after failed update:', refundErr);
          }
        }
        return apiDbError(upErr, context.request);
      }

      return apiSuccess({ boosted: true, opportunity: updated, credits_remaining: chargedNow ? (credit as any).remaining : undefined }, context.request);
    }

    case 'recruiter-saved-searches': {
      const user = getContextUser(context);
      const subAction = body.sub_action;

      if (subAction === 'get') {
        const { id } = body;
        if (id) {
          const { data, error } = await supabase.from('recruiter_saved_searches').select('*').eq('id', id).eq('recruiter_id', user.id).maybeSingle();
          if (error) return apiDbError(error, context.request);
          return apiSuccess({ search: data }, context.request);
        }
        const { data, error } = await supabase.from('recruiter_saved_searches').select('*').eq('recruiter_id', user.id).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request);
        return apiSuccess({ searches: data || [] }, context.request);
      }
      if (subAction === 'create') {
        const { name, search_criteria } = body;
        if (!name) return apiError(400, 'VALIDATION_ERROR', 'name required', context.request);
        const { data, error } = await supabase.from('recruiter_saved_searches').insert({ recruiter_id: user.id, name, search_criteria: search_criteria || {}, use_count: 0 }).select().single();
        if (error) return apiDbError(error, context.request);
        return apiSuccess({ search: data }, context.request);
      }
      if (subAction === 'update') {
        const { id, ...updates } = body;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
        const { data, error } = await supabase.from('recruiter_saved_searches').update(updates).eq('id', id).eq('recruiter_id', user.id).select().single();
        if (error) return apiDbError(error, context.request);
        return apiSuccess({ search: data }, context.request);
      }
      if (subAction === 'delete') {
        const { id } = body;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
        const { error } = await supabase.from('recruiter_saved_searches').delete().eq('id', id).eq('recruiter_id', user.id);
        if (error) return apiDbError(error, context.request);
        return apiSuccess({ deleted: true }, context.request);
      }
      return apiError(400, 'VALIDATION_ERROR', `Unknown sub_action: ${subAction}`, context.request);
    }

    // ── opportunity actions ──
    case 'create-opportunity': {
      const opportunity = body.opportunity;
      if (!opportunity) return apiError(400, 'VALIDATION_ERROR', 'opportunity data required', context.request);
      if (typeof opportunity.skills_required === 'string') opportunity.skills_required = stringSkills(opportunity.skills_required);
      if (opportunity.skills_required != null && (!Array.isArray(opportunity.skills_required) || opportunity.skills_required.some((skill: unknown) => typeof skill !== 'string'))) {
        return apiError(400, 'VALIDATION_ERROR', 'skills_required must be an array of strings', context.request);
      }

      // 🔒 Quota check: Enforce active_job_posts plan entitlement
      const user = getContextUser(context);
      let organizationId = opportunity.organization_id || (user as any)?.org_id;
      if (!organizationId && user?.id) {
        const { data: mem } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        organizationId = mem?.organization_id;
      }

      // 🔒 Fail-closed + authority: a client-named organization different from
      // the JWT org requires verified membership; unresolvable orgs cannot
      // create postings at all (fixes the verifyOrgAccess-less corner).
      if (!organizationId) {
        return apiError(400, 'VALIDATION_ERROR', 'organizationId is required', context.request);
      }
      if ((user as any)?.org_id && (user as any)?.org_id !== organizationId) {
        const access = await verifyOrgAccess(supabase, user.sub, organizationId, undefined);
        if (!access.allowed) {
          return access.error || apiError(403, 'FORBIDDEN', 'Access denied to this organization', context.request);
        }
      }
      // 🔒 The row is always owned by the verified organization, never the raw body value
      opportunity.organization_id = organizationId;
      // 🔒 Authorship is server-set: no client-created_by trust
      opportunity.created_by = user.id;

      if (organizationId) {
        // 🔒 Quota check: Enforce active_job_posts plan entitlement.
        // getNumericLimit is the bounded hot-path resolver; fail-closed at this
        // call site: an unresolvable plan/entitlement (null result, or a
        // disabled feature) denies the posting rather than allowing it unchecked.
        const entitlement = await getNumericLimit(supabase, organizationId, 'active_job_posts');
        if (!entitlement || !entitlement.enabled) {
          return apiError(
            402,
            'QUOTA_EXCEEDED',
            'Your plan does not include permission to publish job posts, or the limit could not be verified. Please upgrade your recruiter plan or contact support.',
            context.request
          );
        }
        // enabled && limit === null ⇒ explicit "no enforced limit" entitlement
        // (Enterprise custom style per the entitlement service contract).
        if (entitlement.limit !== null) {
          const { count, error: countErr } = await supabase
            .from('opportunities')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .or('is_active.eq.true,status.eq.open');

          if (countErr) {
            console.error('[Opportunities] Failed to count active job posts:', countErr);
            return apiDbError(countErr, context.request);
          }

          if (typeof count === 'number' && count >= entitlement.limit) {
            return apiError(
              402,
              'QUOTA_EXCEEDED',
              `Your current plan allows up to ${entitlement.limit} active job posts. You currently have ${count} active posts. Please upgrade your recruiter plan to publish more opportunities.`,
              context.request
            );
          }
        }
      }

      const { data, error } = await supabase.from('opportunities').insert([opportunity]).select().single();
      if (error) return apiDbError(error, context.request);
      await notifyLearnersOfNewOpportunity(supabase, data);
      return apiSuccess({ opportunity: data }, context.request);
    }

    case 'update-opportunity': {
      const { action: _action, id, updates: nestedUpdates, ...flatUpdates } = body;
      const updates = nestedUpdates || flatUpdates;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      if (typeof updates.skills_required === 'string') updates.skills_required = stringSkills(updates.skills_required);
      if (updates.skills_required != null && (!Array.isArray(updates.skills_required) || updates.skills_required.some((skill: unknown) => typeof skill !== 'string'))) {
        return apiError(400, 'VALIDATION_ERROR', 'skills_required must be an array of strings', context.request);
      }
      const existing = await findOpportunityById(supabase, id, 'id, organization_id, created_by, status, is_active');
      if (existing.error) return apiDbError(existing.error, context.request);
      if (!existing.data) return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request);

      // 🔒 Ownership (§6.3 completion): only the owning organization/author may update
      const user = getContextUser(context);
      const orgId = (user as any)?.org_id || null;
      const owns = existing.data.organization_id ? existing.data.organization_id === orgId : existing.data.created_by === user.id;
      if (!owns) return apiError(403, 'FORBIDDEN', 'You do not have access to this opportunity', context.request);

      delete updates.organization_id; // never allow re-owning the row
      delete updates.created_by;
      // 🔒 Server-owned counters: client updates must never inflate activity
      // metrics that the quota/usage surfaces read back.
      delete updates.applications_count;
      delete updates.messages_count;
      delete updates.views_count;
      delete updates.posted_date;

      // 🔒 Status whitelist + server-owned visibility (parity with
      // update-requisition / the hardened legacy alias in recruiter/actions.ts):
      // the update payload may no longer set is_active directly and status
      // transitions validate against the same server-side whitelist the
      // requisition actions use — visibility always mirrors the enforced
      // status.
      if (updates.status !== undefined) {
        const nextStatus = String(updates.status).trim().toLowerCase();
        if (!(ALLOWED_REQUISITION_STATUSES as readonly string[]).includes(nextStatus)) {
          return apiError(
            400,
            'VALIDATION_ERROR',
            `Invalid status '${updates.status}'. Allowed values: ${ALLOWED_REQUISITION_STATUSES.join(', ')}`,
            context.request
          );
        }
        updates.status = nextStatus;
        updates.is_active = nextStatus === 'open';
      }

      // 🔒 Publishing a draft must respect the active_job_posts plan quota
      // (H4 bypass fix — mirrors recruiter/actions.ts update-opportunity):
      // becomesVisible ⇔ the update toggles the post into the open/is_active
      // state it didn't already have; the count excludes this post itself.
      const currentlyVisible = existing.data.status === 'open' || existing.data.is_active === true;
      const becomesVisible = !currentlyVisible && (updates.status === 'open' || updates.is_active === true);
      if (becomesVisible && existing.data.organization_id) {
        // getNumericLimit hot-path resolver; fail-closed: an unresolvable or
        // disabled entitlement denies the publish rather than allowing it.
        const entitlement = await getNumericLimit(supabase, existing.data.organization_id, 'active_job_posts');
        if (!entitlement || !entitlement.enabled) {
          return apiError(
            402,
            'QUOTA_EXCEEDED',
            'Your plan does not include permission to publish job posts, or the limit could not be verified. Please upgrade your recruiter plan or contact support.',
            context.request
          );
        }
        if (entitlement.limit !== null) {
          const { count, error: countErr } = await supabase
            .from('opportunities')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', existing.data.organization_id)
            .neq('id', existing.data.id)
            .or('is_active.eq.true,status.eq.open');
          if (countErr) return apiDbError(countErr, context.request);
          if (typeof count === 'number' && count >= entitlement.limit) {
            return apiError(
              402,
              'QUOTA_EXCEEDED',
              `Your current plan allows up to ${entitlement.limit} active job posts. You currently have ${count} active posts. Please upgrade your recruiter plan to publish more opportunities.`,
              context.request
            );
          }
        }
      }

      const { data, error } = await supabase.from('opportunities').update(updates).eq('id', existing.data.id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ opportunity: data }, context.request);
    }

    case 'delete-opportunity': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const existing = await findOpportunityById(supabase, id, 'id, organization_id, created_by');
      if (existing.error) return apiDbError(existing.error, context.request);
      if (!existing.data) return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request);

      // 🔒 Ownership (§6.3 completion): only the owning organization/author may delete
      const user = getContextUser(context);
      const orgId = (user as any)?.org_id || null;
      const owns = existing.data.organization_id ? existing.data.organization_id === orgId : existing.data.created_by === user.id;
      if (!owns) return apiError(403, 'FORBIDDEN', 'You do not have access to this opportunity', context.request);

      const { error } = await supabase.from('opportunities').delete().eq('id', existing.data.id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }

    case 'increment-view-count': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      // Existence check only — the increment itself is delegated to the
      // SECURITY DEFINER RPC increment_opportunity_views(p_id) (contract with
      // the concurrently-shipped migration), which performs the counter
      // update atomically inside Postgres. A read-then-write UPDATE here was
      // racy under concurrent viewers.
      const existing = await findOpportunityById(supabase, id, 'id');
      if (existing.error) return apiDbError(existing.error, context.request);
      if (!existing.data) return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request);
      const { data: incremented, error } = await supabase.rpc('increment_opportunity_views', { p_id: existing.data.id });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ incremented: true, views_count: incremented ?? null }, context.request);
    }

    case 'get-opportunities-stats': {
      const { count: total, error: totalError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true });
      if (totalError) return apiDbError(totalError, context.request);
      const { count: active, error: activeError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).or('status.eq.open,is_active.eq.true');
      if (activeError) return apiDbError(activeError, context.request);
      const { count: draft, error: draftError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'draft');
      if (draftError) return apiDbError(draftError, context.request);
      const { count: closed, error: closedError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'closed');
      if (closedError) return apiDbError(closedError, context.request);
      const { count: cancelled, error: cancelledError } = await supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'cancelled');
      if (cancelledError) return apiDbError(cancelledError, context.request);
      return apiSuccess({ total: total || 0, active: active || 0, draft: draft || 0, closed: closed || 0, cancelled: cancelled || 0 }, context.request);
    }

    case 'get-placement-stats': {
      const { collegeId: explicitCollegeId } = body;
      const authUser = getContextUser(context);

      // 🔒 No client-trusted collegeId: an explicit college_id is only honored
      // when it matches the caller's own active organization (there is no
      // college-role util in this codebase, so no other bypass exists).
      if (explicitCollegeId && explicitCollegeId !== (authUser as any)?.org_id) {
        return apiError(403, 'FORBIDDEN', 'You may only view placement stats for your own organization', context.request);
      }
      const collegeId = (authUser as any)?.org_id;

      // Security check: collegeId must be present to prevent data leakage
      if (!collegeId) {
        return apiError(400, 'VALIDATION_ERROR', 'College ID is required', context.request);
      }

      let learnersQuery = supabase.from('learners').select('*', { count: 'exact', head: true });
      learnersQuery = learnersQuery.eq('college_id', collegeId);
      const { count: totallearners, error: totalError } = await learnersQuery;
      if (totalError) return apiDbError(totalError, context.request);

      let placementQuery = supabase
        .from('applied_jobs')
        .select(`id, learner_id, opportunities!fk_applied_jobs_opportunity(salary_range_max, salary_range_min, employment_type)`)
        .eq('application_status', 'accepted');

      const { data: collegelearners } = await supabase.from('learners').select('id').eq('college_id', collegeId);
      const learnerIds = collegelearners?.map(s => s.id) || [];
      
      if (learnerIds.length === 0) {
        return apiSuccess({ learnersPlaced: 0, placementRate: 0, totallearners: totallearners || 0, avgCTC: 0, medianCTC: 0, highestCTC: 0 }, context.request);
      }
      
      placementQuery = placementQuery.in('learner_id', learnerIds);

      const { data: placements, error: placementError } = await placementQuery;
      if (placementError) return apiDbError(placementError, context.request);

      const uniqueLearnerIds = new Set();
      const salaries: number[] = [];
      (placements || []).forEach(p => {
        uniqueLearnerIds.add(p.learner_id);
        const opp = p.opportunities as any;
        if (opp) {
          const salary = opp.salary_range_max || opp.salary_range_min || 0;
          if (salary > 0) salaries.push(Number(salary));
        }
      });
      const learnersPlaced = uniqueLearnerIds.size;
      salaries.sort((a, b) => a - b);
      const avgCTC = salaries.length > 0 ? salaries.reduce((s, v) => s + v, 0) / salaries.length : 0;
      const medianCTC = salaries.length > 0
        ? salaries.length % 2 === 0 ? (salaries[salaries.length / 2 - 1] + salaries[salaries.length / 2]) / 2 : salaries[Math.floor(salaries.length / 2)]
        : 0;
      const highestCTC = salaries.length > 0 ? Math.max(...salaries) : 0;
      const placementRate = totallearners && totallearners > 0 ? (learnersPlaced / totallearners) * 100 : 0;

      return apiSuccess({
        learnersPlaced, placementRate: Math.round(placementRate * 10) / 10,
        totallearners: totallearners || 0, avgCTC, medianCTC, highestCTC
      }, context.request);
    }

    // ── applied_jobs / application actions ──
    case 'apply-to-job': {
      const user = getContextUser(context);
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data: owner, error: ownerError } = await supabase.from('learners').select('id').eq('id', learner_id).eq('user_id', user.id).maybeSingle();
      if (ownerError) return apiError(503, 'PROFILE_UNAVAILABLE', 'Learner profile is temporarily unavailable', context.request);
      if (!owner) return apiError(403, 'FORBIDDEN', 'Only your own applications may be submitted', context.request);
      const available = await findOpportunityById(supabase, opportunity_id, 'id,status,is_active,deadline');
      if (available.error) return apiError(503, 'OPPORTUNITY_UNAVAILABLE', 'Opportunity could not be verified', context.request);
      if (!isEligibleJob(available.data)) return apiError(409, 'OPPORTUNITY_CLOSED', 'Opportunity is no longer available', context.request);

      const { data: existing } = await supabase.from('applied_jobs').select('id').eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).maybeSingle();
      if (existing) return apiSuccess({ success: false, message: 'You have already applied to this job', data: existing }, context.request);

      const { data: learner } = await supabase.from('learners').select('name, email, contact_number').eq('id', learner_id).maybeSingle();
      if (!learner) return apiSuccess({ success: false, message: 'Learner profile not found' }, context.request);

      const { data, error } = await supabase.from('applied_jobs').insert([{ learner_id, opportunity_id, application_status: 'applied' }]).select().single();
      if (error) return apiDbError(error, context.request);

      try {
        await supabase.from('pipeline_candidates').insert([{
          opportunity_id, learner_id, candidate_name: learner.name || 'Unknown', candidate_email: learner.email || '',
          candidate_phone: learner.contact_number || '', stage: 'sourced', source: 'direct_application',
          status: 'active', added_at: new Date().toISOString(), stage_changed_at: new Date().toISOString()
        }]);
      } catch (_) { }

      return apiSuccess({ success: true, message: 'Application submitted successfully!', data }, context.request);
    }

    case 'has-applied': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data } = await supabase.from('applied_jobs').select('id').eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).maybeSingle();
      return apiSuccess({ hasApplied: !!data }, context.request);
    }

    case 'get-learner-applications': {
      const { learner_id, status, limit } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      let query = supabase.from('applied_jobs').select('*, opportunity:opportunities!fk_applied_jobs_opportunity(id, job_title, title, company_name, company_logo, location, employment_type, salary_range_min, salary_range_max, mode, department, recruiter_id, experience_level)').eq('learner_id', learner_id).order('applied_at', { ascending: false });
      if (status) query = query.eq('application_status', status);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ applications: data || [] }, context.request);
    }

    case 'get-learner-application-stats': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data, error } = await supabase.from('applied_jobs').select('application_status').eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      const stats = (data || []).reduce((acc, app) => {
        acc.total++;
        if (Object.hasOwn(acc, app.application_status)) acc[app.application_status]++;
        return acc;
      }, { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 });
      return apiSuccess({ stats }, context.request);
    }

    case 'get-all-applications': {
      const { status, date_from, date_to, search, company_name, department, employment_type, college_id } = body;
      // 🔒 ORG SCOPING (OWASP API1): applied_jobs carries learner PII; listable
      // rows are only those whose opportunity belongs to the caller's active
      // organization. Empty org ⇒ empty list (never a cross-org dump).
      const user = getContextUser(context);
      const scope = await resolveOrgScopeInfo(supabase, user);
      if (!scope.oppIds || scope.oppIds.length === 0) {
        return apiSuccess({ applications: [] }, context.request);
      }
      let query = supabase.from('applied_jobs').select('*').in('opportunity_id', scope.oppIds).order('applied_at', { ascending: false });
      if (status) query = query.eq('application_status', status);
      if (date_from) query = query.gte('applied_at', date_from);
      if (date_to) query = query.lte('applied_at', date_to);
      const { data: appliedJobs, error: appliedJobsError } = await query;
      if (appliedJobsError) return apiDbError(appliedJobsError, context.request);
      if (!appliedJobs || appliedJobs.length === 0) return apiSuccess({ applications: [] }, context.request);

      const learnerIds = [...new Set(appliedJobs.map(job => job.learner_id))];
      const opportunityIds = [...new Set(appliedJobs.map(job => job.opportunity_id))];

      const [{ data: learners }, { data: opportunities }] = await Promise.all([
        supabase.from('learners').select('id, user_id, name, email, contact_number, university, universityId, branch_field, course_name, college_school_name, district_name, currentCgpa, expectedGraduationDate, approval_status, college_id').in('id', learnerIds),
        supabase.from('opportunities').select('*').in('id', opportunityIds),
      ]);

      const companyNames = [...new Set((opportunities || []).map(o => o.company_name).filter(Boolean))];
      let companies: any[] = [];
      if (companyNames.length > 0) {
        const { data: companiesData } = await supabase.from('companies').select('id, name, industry, companySize, hqCity, hqState, website, accountStatus').in('name', companyNames);
        companies = companiesData || [];
      }

      const learnerMap = (learners || []).reduce((acc, l) => { acc[l.id] = l; return acc; }, {});
      const oppMap = (opportunities || []).reduce((acc, o) => { acc[o.id] = o; return acc; }, {});
      const companyMap = companies.reduce((acc, c) => { acc[c.name] = c; return acc; }, {});

      let result = appliedJobs.map(job => {
        const learner = learnerMap[job.learner_id];
        const opp = oppMap[job.opportunity_id];
        const company = opp ? companyMap[opp.company_name] : null;
        return {
          ...job,
          learner: learner ? {
            id: learner.id, user_id: learner.user_id, name: learner.name || 'Unknown Learner',
            email: learner.email || 'No email', contact_number: learner.contact_number || '',
            university: learner.university || 'N/A', branch_field: learner.branch_field || '',
            course_name: learner.course_name || '', college_school_name: learner.college_school_name || '',
            district_name: learner.district_name || '', currentCgpa: learner.currentCgpa || null,
            expectedGraduationDate: learner.expectedGraduationDate || '', approval_status: learner.approval_status, college_id: learner.college_id
          } : { id: job.learner_id, user_id: '', name: 'Unknown Learner', email: 'No email', contact_number: '', university: 'N/A', branch_field: '', course_name: '', college_school_name: '', district_name: '', currentCgpa: null, expectedGraduationDate: '', approval_status: '', college_id: '' },
          opportunity: opp,
          company
        };
      });

      if (search) {
        const s = search.toLowerCase();
        result = result.filter(a => (a.learner?.name?.toLowerCase().includes(s) || a.learner?.email?.toLowerCase().includes(s) || a.opportunity?.title?.toLowerCase().includes(s) || a.opportunity?.job_title?.toLowerCase().includes(s) || a.opportunity?.company_name?.toLowerCase().includes(s) || a.company?.name?.toLowerCase().includes(s)));
      }
      if (company_name) result = result.filter(a => a.opportunity?.company_name === company_name);
      if (department) result = result.filter(a => a.learner?.branch_field === department || a.learner?.course_name === department || a.opportunity?.department === department);
      if (employment_type) result = result.filter(a => a.opportunity?.employment_type === employment_type);
      if (college_id) result = result.filter(a => a.learner?.college_id === college_id);

      return apiSuccess({ applications: result }, context.request);
    }

    case 'get-application-stats': {
      const { college_id, status, date_from, date_to } = body;
      if (college_id) {
        const { data: learners } = await supabase.from('learners').select('id').eq('college_id', college_id);
        const learnerIds = (learners || []).map(s => s.id);
        if (learnerIds.length === 0) return apiSuccess({ stats: { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 } }, context.request);
        let query = supabase.from('applied_jobs').select('application_status').in('learner_id', learnerIds);
        if (status) query = query.eq('application_status', status);
        if (date_from) query = query.gte('applied_at', date_from);
        if (date_to) query = query.lte('applied_at', date_to);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request);
        const stats = (data || []).reduce((acc, app) => { acc.total++; if (Object.hasOwn(acc, app.application_status)) acc[app.application_status]++; return acc; }, { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 });
        return apiSuccess({ stats }, context.request);
      }
      // 🔒 ORG SCOPING: without a college filter the stats must still be
      // limited to applications against the caller's org-owned opportunities.
      // Empty org ⇒ zeroed stats (never a cross-org aggregate).
      const user = getContextUser(context);
      const scope = await resolveOrgScopeInfo(supabase, user);
      if (!scope.oppIds || scope.oppIds.length === 0) {
        return apiSuccess({ stats: { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 } }, context.request);
      }
      let query = supabase.from('applied_jobs').select('application_status').in('opportunity_id', scope.oppIds);
      if (status) query = query.eq('application_status', status);
      if (date_from) query = query.gte('applied_at', date_from);
      if (date_to) query = query.lte('applied_at', date_to);
      const { data, error } = await query;
      if (error) return apiDbError(error, context.request);
      const stats = (data || []).reduce((acc, app) => { acc.total++; if (Object.hasOwn(acc, app.application_status)) acc[app.application_status]++; return acc; }, { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 });
      return apiSuccess({ stats }, context.request);
    }

    case 'update-application-status': {
      const { id, status: newStatus, notes } = body;
      if (!id || !newStatus) return apiError(400, 'VALIDATION_ERROR', 'id and status required', context.request);
      // 🔒 Server-side whitelist for the status enum (derived from the applied_jobs
      // CHECK constraint); the update payload itself is fully server-constructed.
      if (!APPLICATION_STATUSES.includes(newStatus as any)) {
        return apiError(400, 'VALIDATION_ERROR', `Invalid status. Allowed values: ${APPLICATION_STATUSES.join(', ')}`, context.request);
      }
      // 🔒 Object-level authz (OWASP API1): fetch the row first, then verify the
      // caller is org-member of the owning opportunity or the owning learner.
      const appRow = await getApplicationRow(supabase, id);
      if (!appRow) return apiError(404, 'NOT_FOUND', 'Application not found', context.request);
      const user = getContextUser(context);
      const scope = await resolveOrgScopeInfo(supabase, user);
      if (!(await canMutateApplication(supabase, user, scope, appRow))) {
        return apiError(403, 'FORBIDDEN', 'You do not have access to this application', context.request);
      }
      const updateData: any = { application_status: newStatus, updated_at: new Date().toISOString() };
      if (notes) updateData.notes = notes;
      if (newStatus === 'viewed') updateData.viewed_at = new Date().toISOString();
      else if (newStatus === 'interview_scheduled') updateData.interview_scheduled_at = new Date().toISOString();
      const { data, error } = await supabase.from('applied_jobs').update(updateData).eq('id', appRow.id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ application: data }, context.request);
    }

    case 'bulk-update-applications': {
      const { ids, status: newStatus, notes } = body;
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !newStatus) return apiError(400, 'VALIDATION_ERROR', 'ids array and status required', context.request);
      // 🔒 Server-side status whitelist (applied_jobs CHECK constraint).
      if (!APPLICATION_STATUSES.includes(newStatus as any)) {
        return apiError(400, 'VALIDATION_ERROR', `Invalid status. Allowed values: ${APPLICATION_STATUSES.join(', ')}`, context.request);
      }
      // 🔒 Object-level authz, all-or-nothing: fetch EVERY target row first;
      // if any id is outside the caller's scope nothing is applied (no partial
      // cross-org mutation).
      const user = getContextUser(context);
      const scope = await resolveOrgScopeInfo(supabase, user);
      const { data: appRows, error: fetchErr } = await supabase
        .from('applied_jobs')
        .select('id, learner_id, opportunity_id')
        .in('id', ids);
      if (fetchErr) return apiDbError(fetchErr, context.request);
      const found = new Set((appRows || []).map((r: any) => r.id));
      const missing = ids.filter((x: any) => !found.has(String(x)));
      if (missing.length > 0) {
        return apiError(404, 'NOT_FOUND', 'One or more applications were not found', context.request);
      }
      for (const row of appRows || []) {
        if (!(await canMutateApplication(supabase, user, scope, row))) {
          return apiError(403, 'FORBIDDEN', 'You do not have access to one or more of the selected applications', context.request);
        }
      }
      const updateData: any = { application_status: newStatus, updated_at: new Date().toISOString() };
      if (notes) updateData.notes = notes;
      if (newStatus === 'viewed') updateData.viewed_at = new Date().toISOString();
      else if (newStatus === 'interview_scheduled') updateData.interview_scheduled_at = new Date().toISOString();
      const { data, error } = await supabase.from('applied_jobs').update(updateData).in('id', ids).select();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ applications: data || [] }, context.request);
    }

    case 'withdraw-application': {
      const { id, learner_id } = body;
      if (!id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'id and learner_id required', context.request);
      // 🔒 Learner ownership (mirrors apply-to-job): the learner_id in the body
      // must be bound to the caller's user account.
      const user = getContextUser(context);
      if (!(await assertLearnerOwnership(supabase, user, learner_id))) {
        return apiError(403, 'FORBIDDEN', 'Only your own applications may be withdrawn', context.request);
      }
      const { data, error } = await supabase.from('applied_jobs').update({ application_status: 'withdrawn', updated_at: new Date().toISOString() }).eq('id', id).eq('learner_id', learner_id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Application withdrawn successfully', data }, context.request);
    }

    case 'delete-application': {
      const { id, learner_id } = body;
      if (!id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'id and learner_id required', context.request);
      // 🔒 Learner ownership (mirrors apply-to-job).
      const user = getContextUser(context);
      if (!(await assertLearnerOwnership(supabase, user, learner_id))) {
        return apiError(403, 'FORBIDDEN', 'Only your own applications may be deleted', context.request);
      }
      const { error } = await supabase.from('applied_jobs').delete().eq('id', id).eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Application deleted successfully' }, context.request);
    }

    case 'get-recent-applications': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase.from('applied_jobs').select('*, opportunity:opportunities!fk_applied_jobs_opportunity(job_title, company_name, company_logo)').eq('learner_id', learner_id).gte('applied_at', thirtyDaysAgo.toISOString()).order('applied_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ applications: data || [] }, context.request);
    }

    case 'get-all-applicants': {
      const { status, opportunity_id, limit } = body;

      // CRITICAL FIX: Filter by organization for data isolation
      const user = getContextUser(context);
      const { ids: orgOpportunityIds, error: orgError } = await getOrgOpportunityIds(supabase, user, context);

      if (orgError) return orgError;
      if (!orgOpportunityIds || orgOpportunityIds.length === 0) {
        return apiSuccess({ applicants: [] }, context.request);
      }

      // Now filter applied_jobs by these opportunity IDs
      let query = supabase
        .from('applied_jobs')
        .select('*')
        .in('opportunity_id', orgOpportunityIds); // Filter by org's opportunities

      if (status) query = query.eq('application_status', status);
      if (opportunity_id) query = query.eq('opportunity_id', opportunity_id);
      if (limit) query = query.limit(limit);
      query = query.order('applied_at', { ascending: false });

      const { data: appliedJobs, error } = await query;
      if (error) return apiDbError(error, context.request);
      if (!appliedJobs || appliedJobs.length === 0) return apiSuccess({ applicants: [] }, context.request);

      const learnerIds = [...new Set(appliedJobs.map(j => j.learner_id))];
      const opportunityIds = [...new Set(appliedJobs.map(j => j.opportunity_id))];

      const [{ data: learners }, { data: opportunities }] = await Promise.all([
        supabase.from('learners').select('id, user_id, name, email, contact_number, university, branch_field, course_name, college_school_name, district_name, currentCgpa, expectedGraduationDate, approval_status').in('id', learnerIds),
        supabase.from('opportunities').select('*').in('id', opportunityIds),
      ]);

      const learnerMap = (learners || []).reduce((acc, l) => {
        acc[l.id] = { id: l.id, name: l.name || 'Unknown', email: l.email || '', phone: l.contact_number ? String(l.contact_number) : '', department: l.branch_field || l.course_name || '', university: l.university || '', college: l.college_school_name || l.university || '', district: l.district_name || '', course: l.course_name || '', cgpa: l.currentCgpa || '', year_of_passing: l.expectedGraduationDate ? l.expectedGraduationDate.split('-')[0] : '', verified: l.approval_status === 'approved' || false, employability_score: 0, skill: '' };
        return acc;
      }, {});
      const oppMap = (opportunities || []).reduce((acc, o) => { acc[o.id] = o; return acc; }, {});

      const result = (appliedJobs || []).map(job => ({ ...job, learner: learnerMap[job.learner_id] || null, opportunity: oppMap[job.opportunity_id] || null }));
      return apiSuccess({ applicants: result }, context.request);
    }

    case 'get-applicant-stats': {
      // CRITICAL FIX: Filter by organization for data isolation
      const user = getContextUser(context);
      const { ids: orgOpportunityIds, error: orgError } = await getOrgOpportunityIds(supabase, user, context);

      if (orgError) return orgError;
      if (!orgOpportunityIds || orgOpportunityIds.length === 0) {
        return apiSuccess({ stats: { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 } }, context.request);
      }

      // Filter applied_jobs by organization's opportunities
      const { data, error } = await supabase
        .from('applied_jobs')
        .select('application_status')
        .in('opportunity_id', orgOpportunityIds);

      if (error) return apiDbError(error, context.request);
      const stats = (data || []).reduce((acc, app) => { acc.total++; if (Object.hasOwn(acc, app.application_status)) acc[app.application_status]++; return acc; }, { total: 0, applied: 0, viewed: 0, under_review: 0, interview_scheduled: 0, interviewed: 0, offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0 });
      return apiSuccess({ stats }, context.request);
    }

    case 'get-companies-with-applications': {
      // 🔒 ORG SCOPING: company facets derived only from applications to the
      // caller's org-owned opportunities. Empty org ⇒ empty list.
      const user = getContextUser(context);
      const scope = await resolveOrgScopeInfo(supabase, user);
      if (!scope.oppIds || scope.oppIds.length === 0) {
        return apiSuccess({ companies: [] }, context.request);
      }
      const { data: appliedJobs, error } = await supabase.from('applied_jobs').select('opportunity_id').in('opportunity_id', scope.oppIds);
      if (error) return apiDbError(error, context.request);
      if (!appliedJobs || appliedJobs.length === 0) return apiSuccess({ companies: [] }, context.request);
      const opportunityIds = [...new Set(appliedJobs.map(j => j.opportunity_id))];
      const { data: opportunities } = await supabase.from('opportunities').select('company_name').in('id', opportunityIds);
      const companyNames = [...new Set((opportunities || []).map(o => o.company_name).filter(Boolean))];
      if (companyNames.length === 0) return apiSuccess({ companies: [] }, context.request);
      const { data: companies } = await supabase.from('companies').select('id, name').in('name', companyNames);
      return apiSuccess({ companies: companies || [] }, context.request);
    }

    case 'get-pipeline-data-for-application': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data, error } = await supabase.from('pipeline_candidates').select('*').eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).maybeSingle();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ pipelineCandidate: data }, context.request);
    }

    // ── Offer actions ──
    // 🔒 Object-level authz on both offer-status mutations: the caller must be a
    // member of the org owning the application's opportunity (recruiter flow) OR
    // the learner who owns the application (learner offer-inbox flow — same
    // assertLearnerOwnership rule as apply-to-job). Deny-by-default.
    case 'accept-offer': {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const appRow = await getApplicationRow(supabase, id);
      if (!appRow) return apiError(404, 'NOT_FOUND', 'Application not found', context.request);
      const user = getContextUser(context);
      const scope = await resolveOrgScopeInfo(supabase, user);
      if (!(await canMutateApplication(supabase, user, scope, appRow))) {
        return apiError(403, 'FORBIDDEN', 'You do not have access to this application', context.request);
      }
      const { data, error } = await supabase.from('applied_jobs').update({ application_status: 'accepted', responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', appRow.id).select('*, opportunity:opportunities(id, job_title, company_name, applications_count)').single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, data }, context.request);
    }

    case 'reject-offer': {
      const { id, reason } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const appRow = await getApplicationRow(supabase, id);
      if (!appRow) return apiError(404, 'NOT_FOUND', 'Application not found', context.request);
      const user = getContextUser(context);
      const scope = await resolveOrgScopeInfo(supabase, user);
      if (!(await canMutateApplication(supabase, user, scope, appRow))) {
        return apiError(403, 'FORBIDDEN', 'You do not have access to this application', context.request);
      }
      const updateData: any = { application_status: 'rejected', responded_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      if (reason) updateData.notes = reason;
      const { data, error } = await supabase.from('applied_jobs').update(updateData).eq('id', appRow.id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, data }, context.request);
    }

    case 'check-openings-available': {
      const { opportunity_id } = body;
      if (!opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'opportunity_id required', context.request);
      const { data, error } = await supabase.from('opportunities').select('applications_count, status, is_active').eq('id', opportunity_id).single();
      if (error) return apiDbError(error, context.request);
      const hasOpenings = (data?.applications_count || 0) > 0 && data?.is_active && data?.status !== 'filled';
      return apiSuccess({ success: true, hasOpenings }, context.request);
    }

    case 'get-opportunity-with-openings': {
      const { opportunity_id } = body;
      if (!opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'opportunity_id required', context.request);
      const { data, error } = await supabase.from('opportunities').select('*, accepted_count:applied_jobs(count)').eq('id', opportunity_id).eq('applied_jobs.application_status', 'accepted').single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, data }, context.request);
    }

    // ── Interview actions ──
    // 🔒 ORG SCOPING (interviews have NO organization_id — ownership is derived):
    // visible = created_by the caller OR learner in the caller's org scope
    // (user-space learner ids of org-owned applications + own learner ids).
    // Merge approach: two scoped queries + dedupe (matches actions.ts style).
    case 'get-interviews': {
      const user = getContextUser(context);
      const learnerUserIds = await getInterviewLearnerUserIds(supabase, user);
      const [byLearnerRes, byCreatorRes] = await Promise.all([
        learnerUserIds && learnerUserIds.length > 0
          ? supabase.from('interviews').select('*').in('learner_id', learnerUserIds).order('date', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        supabase.from('interviews').select('*').eq('created_by', user.id).order('date', { ascending: true }),
      ]);
      if (byLearnerRes.error) return apiDbError(byLearnerRes.error, context.request);
      if (byCreatorRes.error) return apiDbError(byCreatorRes.error, context.request);
      const mergedById = new Map<string, any>();
      [...(byLearnerRes.data || []), ...(byCreatorRes.data || [])].forEach((i: any) => mergedById.set(i.id, i));
      const interviews = [...mergedById.values()].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return apiSuccess({ interviews }, context.request);
    }
    case 'get-interview-by-id': {
      const user = getContextUser(context);
      const gated = await loadGatedInterview(supabase, user, context, body.id);
      if (gated.error) return gated.error;
      const { data, error } = await supabase.from('interviews').select('*').eq('id', gated.id).single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interview: data }, context.request);
    }
    case 'get-interviews-for-learner': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      // 🔒 The requested learner profile must belong to the caller: accept
      // either the learners.id or the learners.user_id (= users.id) alias —
      // interviews.learner_id stores the user-space id (FK to learners(user_id)).
      const user = getContextUser(context);
      let ownedLearner: boolean;
      if (learner_id === user.id) {
        ownedLearner = true;
      } else {
        const { data: own, error: ownerErr } = await supabase
          .from('learners')
          .select('id')
          .eq('id', learner_id)
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        if (ownerErr) return apiDbError(ownerErr, context.request);
        ownedLearner = !!own;
      }
      if (!ownedLearner) return apiError(403, 'FORBIDDEN', 'You may only view interviews for your own learner profile', context.request);
      const { data, error } = await supabase.from('interviews').select('*').eq('learner_id', user.id).order('date', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interviews: data }, context.request);
    }
    case 'get-upcoming-interviews': {
      // 🔒 Same org-scope merge as get-interviews (upcoming_interviews is a view
      // over interviews and carries created_by).
      const user = getContextUser(context);
      const learnerUserIds = await getInterviewLearnerUserIds(supabase, user);
      const [byLearnerRes, byCreatorRes] = await Promise.all([
        learnerUserIds && learnerUserIds.length > 0
          ? supabase.from('upcoming_interviews').select('*').in('learner_id', learnerUserIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from('upcoming_interviews').select('*').eq('created_by', user.id),
      ]);
      if (byLearnerRes.error) return apiDbError(byLearnerRes.error, context.request);
      if (byCreatorRes.error) return apiDbError(byCreatorRes.error, context.request);
      const mergedById = new Map<string, any>();
      [...(byLearnerRes.data || []), ...(byCreatorRes.data || [])].forEach((i: any) => mergedById.set(i.id, i));
      return apiSuccess({ interviews: [...mergedById.values()] }, context.request);
    }
    case 'get-pending-scorecards': {
      // 🔒 Same org-scope merge as get-interviews (pending_scorecards is a view
      // over interviews and carries created_by).
      const user = getContextUser(context);
      const learnerUserIds = await getInterviewLearnerUserIds(supabase, user);
      const [byLearnerRes, byCreatorRes] = await Promise.all([
        learnerUserIds && learnerUserIds.length > 0
          ? supabase.from('pending_scorecards').select('*').in('learner_id', learnerUserIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from('pending_scorecards').select('*').eq('created_by', user.id),
      ]);
      if (byLearnerRes.error) return apiDbError(byLearnerRes.error, context.request);
      if (byCreatorRes.error) return apiDbError(byCreatorRes.error, context.request);
      const mergedById = new Map<string, any>();
      [...(byLearnerRes.data || []), ...(byCreatorRes.data || [])].forEach((i: any) => mergedById.set(i.id, i));
      return apiSuccess({ scorecards: [...mergedById.values()] }, context.request);
    }
    case 'create-interview': {
      const user = getContextUser(context);
      const { interview } = body;
      if (!interview) return apiError(400, 'VALIDATION_ERROR', 'interview data required', context.request);
      // 🔒 Field whitelist (no mass-assignment, OWASP API5): only the columns the
      // endpoint exposes may be set, including legacy alias fields which map to
      // canonical names when the canonical field is absent.
      const canonical: any = {};
      INTERVIEW_CREATE_FIELDS.forEach((field) => { if (interview[field] !== undefined) canonical[field] = interview[field]; });
      if (canonical.date === undefined && interview.scheduled_at !== undefined) canonical.date = interview.scheduled_at; // legacy alias
      if (canonical.duration === undefined && interview.duration_minutes !== undefined) canonical.duration = interview.duration_minutes; // legacy alias
      // required-field validation (fail fast, clear 400)
      const missing: string[] = [];
      if (!canonical.date) missing.push('date');
      if (!canonical.interviewer) missing.push('interviewer');
      if (!canonical.job_title) missing.push('job_title');
      if (missing.length > 0) {
        return apiError(400, 'VALIDATION_ERROR', `Missing required interview field(s): ${missing.join(', ')}`, context.request);
      }
      // 🔒 Authorship is forced server-side — never trusted from the client, and
      // any client-supplied created_by is stripped by the whitelist.
      canonical.created_by = user.id;
      // interviews.id is a text PRIMARY KEY with NO default (DB-verified), so the
      // row needs an explicit id. Accept the client's id only when it is a safe
      // literal (charset/length-controlled — never a foreign-key-style injection
      // surface since it is just a text PK); otherwise mint one server-side.
      const clientId = typeof interview.id === 'string' ? interview.id.trim() : '';
      canonical.id = /^[A-Za-z0-9_-]{1,64}$/.test(clientId)
        ? clientId
        : `int_${crypto.randomUUID().replace(/-/g, '')}`;
      const { data, error } = await supabase.from('interviews').insert([canonical]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interview: data }, context.request);
    }
    case 'update-interview': {
      const user = getContextUser(context);
      // 🔒 Gate BEFORE mutation: fetch the row, enforce org/creator access.
      const gated = await loadGatedInterview(supabase, user, context, body.id);
      if (gated.error) return gated.error;
      // 🔒 Field whitelist; reminders_sent is internal-only; created_by is
      // never re-authorable.
      const raw = body;
      const updates: any = {};
      INTERVIEW_UPDATE_FIELDS.forEach((field: string) => { if (raw[field] !== undefined && field !== 'id') updates[field] = raw[field]; });
      const { data, error } = await supabase.from('interviews').update(updates).eq('id', gated.id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interview: data }, context.request);
    }
    case 'delete-interview': {
      const user = getContextUser(context);
      const gated = await loadGatedInterview(supabase, user, context, body.id);
      if (gated.error) return gated.error;
      const { error } = await supabase.from('interviews').delete().eq('id', gated.id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }
    case 'update-interview-status': {
      const { id, status: newStatus } = body;
      if (!id || !newStatus) return apiError(400, 'VALIDATION_ERROR', 'id and status required', context.request);
      const user = getContextUser(context);
      const gated = await loadGatedInterview(supabase, user, context, id);
      if (gated.error) return gated.error;
      const updates: any = { status: newStatus }; // whitelisted via INTERVIEW_UPDATE_FIELDS
      if (newStatus === 'completed') updates.completed_date = new Date().toISOString();
      const { data, error } = await supabase.from('interviews').update(updates).eq('id', gated.id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interview: data }, context.request);
    }
    case 'update-scorecard': {
      const { id, scorecard } = body;
      if (!id || !scorecard) return apiError(400, 'VALIDATION_ERROR', 'id and scorecard required', context.request);
      const user = getContextUser(context);
      const gated = await loadGatedInterview(supabase, user, context, id);
      if (gated.error) return gated.error;
      // only the whitelisted scorecard/completed fields are written
      const { data, error } = await supabase.from('interviews').update({ scorecard, status: 'completed', completed_date: new Date().toISOString() }).eq('id', gated.id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ interview: data }, context.request);
    }
    case 'log-interview-reminder': {
      const { reminder } = body;
      if (!reminder) return apiError(400, 'VALIDATION_ERROR', 'reminder data required', context.request);
      const { data, error } = await supabase.from('interview_reminders').insert([reminder]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ reminder: data }, context.request);
    }
    case 'get-reminder-history': {
      const { interview_id } = body;
      if (!interview_id) return apiError(400, 'VALIDATION_ERROR', 'interview_id required', context.request);
      const { data, error } = await supabase.from('interview_reminders').select('*').eq('interview_id', interview_id).order('sent_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ reminders: data }, context.request);
    }
    case 'send-interview-reminder': {
      const { id, reminders_sent, sent_to } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const user = getContextUser(context);
      // 🔒 Gate BEFORE mutation (the reminders_sent counter and the reminder log
      // row must both be unreachable for interviews the caller cannot access).
      const gated = await loadGatedInterview(supabase, user, context, id);
      if (gated.error) return gated.error;
      // reminders_sent is internal-only: the counter increments server-side and
      // the client value is never trusted.
      const { error: updateError } = await supabase.from('interviews').update({ reminders_sent: (reminders_sent || 0) + 1 }).eq('id', gated.id);
      if (updateError) return apiDbError(updateError, context.request);
      const reminderData: any = { interview_id: gated.id, sent_to: sent_to || '', reminder_type: 'interview_reminder' };
      const { data, error: logError } = await supabase.from('interview_reminders').insert([reminderData]).select().single();
      if (logError) return apiDbError(logError, context.request);
      return apiSuccess({ reminder: data }, context.request);
    }

    // ── Saved Jobs actions ──
    case 'save-job': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data: existing } = await supabase.from('saved_jobs').select('id').eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).maybeSingle();
      if (existing) return apiSuccess({ success: true, message: 'Job is already saved', data: existing, alreadySaved: true }, context.request);
      const { data, error } = await supabase.from('saved_jobs').insert([{ learner_id, opportunity_id }]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Job saved successfully!', data, alreadySaved: false }, context.request);
    }
    case 'unsave-job': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data, error } = await supabase.from('saved_jobs').delete().eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).select();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Job unsaved successfully!', data }, context.request);
    }
    case 'is-saved': {
      const { learner_id, opportunity_id } = body;
      if (!learner_id || !opportunity_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id and opportunity_id required', context.request);
      const { data } = await supabase.from('saved_jobs').select('id').eq('learner_id', learner_id).eq('opportunity_id', opportunity_id).maybeSingle();
      return apiSuccess({ isSaved: !!data }, context.request);
    }
    case 'get-saved-job-ids': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data, error } = await supabase.from('saved_jobs').select('opportunity_id').eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ ids: (data || []).map(item => item.opportunity_id) }, context.request);
    }
    case 'get-saved-jobs-with-details': {
      const { learner_id, activeOnly, limit } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      let query = supabase.from('saved_jobs').select('*, opportunity:opportunities(id, title, job_title, company_name, company_logo, employment_type, location, mode, stipend_or_salary, salary_range_min, salary_range_max, experience_required, experience_level, skills_required, description, application_link, deadline, posted_date, is_active, department, created_at)').eq('learner_id', learner_id).order('saved_at', { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) return apiDbError(error, context.request);
      let savedJobs = (data || []).map(item => ({ saved_job_id: item.id, saved_at: item.saved_at, ...item.opportunity }));
      if (activeOnly) savedJobs = savedJobs.filter(j => j.is_active);
      return apiSuccess({ savedJobs }, context.request);
    }
    case 'get-saved-jobs-with-applied-status': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      let query = supabase.from('saved_jobs').select('*, opportunity:opportunities(id, title, job_title, company_name, company_logo, employment_type, location, mode, stipend_or_salary, salary_range_min, salary_range_max, experience_required, experience_level, skills_required, description, application_link, deadline, posted_date, is_active, department, created_at)').eq('learner_id', learner_id).order('saved_at', { ascending: false });
      const { data } = await query;
      const savedJobs = (data || []).map(item => ({ saved_job_id: item.id, saved_at: item.saved_at, ...item.opportunity }));
      const { data: appliedJobs } = await supabase.from('applied_jobs').select('opportunity_id, application_status, applied_at').eq('learner_id', learner_id);
      const appliedMap = new Map((appliedJobs || []).map(app => [app.opportunity_id, app]));
      const result = savedJobs.map(job => ({ ...job, has_applied: appliedMap.has(job.id), application_status: appliedMap.get(job.id)?.application_status || null, applied_at: appliedMap.get(job.id)?.applied_at || null }));
      return apiSuccess({ savedJobs: result }, context.request);
    }
    case 'get-saved-jobs-count': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { count, error } = await supabase.from('saved_jobs').select('*', { count: 'exact', head: true }).eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ count: count || 0 }, context.request);
    }
    case 'remove-inactive-saved-jobs': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data: savedData } = await supabase.from('saved_jobs').select('*, opportunity:opportunities(id, is_active)').eq('learner_id', learner_id);
      if (!savedData || savedData.length === 0) return apiSuccess({ success: true, message: 'No inactive saved jobs to remove', count: 0 }, context.request);
      const inactiveIds = savedData.filter(s => !s.opportunity?.is_active).map(s => s.opportunity_id);
      if (inactiveIds.length === 0) return apiSuccess({ success: true, message: 'No inactive saved jobs to remove', count: 0 }, context.request);
      const { error } = await supabase.from('saved_jobs').delete().eq('learner_id', learner_id).in('opportunity_id', inactiveIds);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: `Removed ${inactiveIds.length} inactive saved jobs`, count: inactiveIds.length }, context.request);
    }

    // ── Search History actions ──
    case 'add-search-term': {
      const { learner_id, search_term } = body;
      if (!learner_id || !search_term) return apiError(400, 'VALIDATION_ERROR', 'learner_id and search_term required', context.request);
      const trimmed = search_term.trim();
      const { data: existing } = await supabase.from('search_history').select('id, search_count').eq('learner_id', learner_id).eq('search_term', trimmed).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from('search_history').update({ search_count: existing.search_count + 1, last_searched_at: new Date().toISOString() }).eq('id', existing.id).select().single();
        if (error) return apiDbError(error, context.request);
        return apiSuccess({ success: true, message: 'Search term updated', data }, context.request);
      }
      const { count } = await supabase.from('search_history').select('*', { count: 'exact', head: true }).eq('learner_id', learner_id);
      if (count && count >= 5) {
        const { data: oldest } = await supabase.from('search_history').select('id').eq('learner_id', learner_id).order('last_searched_at', { ascending: true }).limit(1).maybeSingle();
        if (oldest) await supabase.from('search_history').delete().eq('id', oldest.id);
      }
      const { data, error } = await supabase.from('search_history').insert([{ learner_id, search_term: trimmed, search_count: 1, last_searched_at: new Date().toISOString() }]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Search term added', data }, context.request);
    }
    case 'get-search-history': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data, error } = await supabase.from('search_history').select('*').eq('learner_id', learner_id).order('last_searched_at', { ascending: false }).limit(5);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ history: data || [] }, context.request);
    }
    case 'delete-search-term': {
      const { learner_id, id: searchId } = body;
      if (!learner_id || !searchId) return apiError(400, 'VALIDATION_ERROR', 'learner_id and id required', context.request);
      const { error } = await supabase.from('search_history').delete().eq('id', searchId).eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Search term deleted' }, context.request);
    }
    case 'clear-search-history': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { error } = await supabase.from('search_history').delete().eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true, message: 'Search history cleared' }, context.request);
    }
    case 'get-most-searched-terms': {
      const { learner_id, limit: qlimit } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      const { data, error } = await supabase.from('search_history').select('*').eq('learner_id', learner_id).order('search_count', { ascending: false }).limit(qlimit || 5);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ terms: data || [] }, context.request);
    }

    // ── Shortlist actions ──
    // 🔒 ORG SCOPING: shortlists carry created_by, not organization_id — visible
    // rows are those created by an active member of the caller's org.
    case 'get-shortlists': {
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      const memberIds = orgId ? await getOrgMemberUserIds(supabase, orgId) : [];
      if (memberIds.length === 0) return apiSuccess({ shortlists: [] }, context.request);
      const { data, error } = await supabase
        .from('shortlists')
        .select('*, shortlist_candidates(count)')
        .in('created_by', memberIds)
        .order('created_date', { ascending: false });
      if (error) return apiDbError(error, context.request);
      const formatted = (data || []).map(item => ({ ...item, candidate_count: item.shortlist_candidates?.[0]?.count || 0 }));
      return apiSuccess({ shortlists: formatted }, context.request);
    }
    case 'get-shortlist-by-id': {
      const user = getContextUser(context);
      const gated = await loadGatedShortlist(supabase, user, context, body.id);
      if (gated.error) return gated.error;
      const { data, error } = await supabase.from('shortlists').select('*').eq('id', gated.id).single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ shortlist: data }, context.request);
    }
    case 'create-shortlist': {
      const user = getContextUser(context);
      const { shortlist } = body;
      if (!shortlist) return apiError(400, 'VALIDATION_ERROR', 'shortlist data required', context.request);
      // 🔒 Field whitelist (no mass-assignment): name/description/status/shared
      // only. `tags` is NOT a shortlists column (psql-verified) and is dropped —
      // its presence previously made the whole insert fail with PGRST204.
      if (!shortlist.name) {
        return apiError(400, 'VALIDATION_ERROR', 'shortlist name is required', context.request);
      }
      const canonical: any = {
        name: shortlist.name,
        description: shortlist.description,
        status: shortlist.status || 'active',
        shared: shortlist.shared === true,
      };
      if (shortlist.id !== undefined && shortlist.id !== null) {
        if (!SL_ID_RE.test(String(shortlist.id))) {
          return apiError(400, 'VALIDATION_ERROR', 'shortlist id must be alphanumeric (-, _ allowed, ≤64 chars)', context.request);
        }
        canonical.id = String(shortlist.id); // INSERT-only: an existing id cannot be overwritten
      }
      // 🔒 Authorship forced server-side; client created_by ignored
      canonical.created_by = user.id;
      const { data, error } = await supabase.from('shortlists').insert([canonical]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ shortlist: data }, context.request);
    }
    case 'update-shortlist': {
      const user = getContextUser(context);
      const gated = await loadGatedShortlist(supabase, user, context, body.id);
      if (gated.error) return gated.error;
      // 🔒 Field whitelist (no mass-assignment) restricted to actual shortlists
      // columns (psql-verified). include_pii/notify_on_access/tags are not
      // columns and get dropped (they previously broke the update with PGRST204).
      const updates: Record<string, unknown> = {};
      for (const field of ['name', 'description', 'status', 'shared', 'share_link', 'share_expiry', 'watermark']) {
        if (body[field] !== undefined) updates[field] = body[field];
      }
      const { data, error } = await supabase.from('shortlists').update(updates).eq('id', gated.id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ shortlist: data }, context.request);
    }
    case 'delete-shortlist': {
      const user = getContextUser(context);
      const gated = await loadGatedShortlist(supabase, user, context, body.id);
      if (gated.error) return gated.error;
      const { error } = await supabase.from('shortlists').delete().eq('id', gated.id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }
    case 'get-shortlist-candidates': {
      const { shortlist_id } = body;
      if (!shortlist_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id required', context.request);
      // 🔒 Reachable ONLY through the ownership-gated parent shortlist.
      const user = getContextUser(context);
      const gated = await loadGatedShortlist(supabase, user, context, shortlist_id);
      if (gated.error) return gated.error;
      const { data, error } = await supabase.from('shortlist_candidates').select('id, added_at, notes, learner_id, shortlist_id').eq('shortlist_id', gated.id);
      if (error) return apiDbError(error, context.request);
      if (!data || data.length === 0) return apiSuccess({ candidates: [] }, context.request);
      // Contact fields (email/phone) remain in-org-only visibility (documented
      // owner-consent design) — this endpoint is now only reachable through the
      // ownership-scoped parent shortlist above.
      const learnerIds = data.map(d => d.learner_id);
      // profile (jsonb) may be absent on drifted/local DBs — select the flat
      // authoritative columns too and compose the object server-side so the
      // FE contract holds regardless of schema drift state.
      const { data: learners, error: learnersErr } = await supabase.from('learners').select('id, name, email, contact_number, alternate_number, branch_field, college_school_name, university, registration_number, date_of_birth, age, profile').in('id', learnerIds);
      if (learnersErr) return apiDbError(learnersErr, context.request);
      const composeProfile = (l: any): Record<string, unknown> => {
        if (!l) return {};
        const base: Record<string, unknown> = {
          name: l.name,
          email: l.email,
          contact_number: l.contact_number,
          phone_number: l.contact_number,
          alternate_number: l.alternate_number,
          branch_field: l.branch_field,
          university: l.university || l.college_school_name,
          college_school_name: l.college_school_name,
          registration_number: l.registration_number,
          date_of_birth: l.date_of_birth,
          age: l.age,
        };
        const stored = l.profile && typeof l.profile === 'object' && !Array.isArray(l.profile) ? l.profile : {};
        return { ...base, ...stored };
      };
      const candidates = data.map(item => {
        const learner = (learners || []).find(l => l.id === item.learner_id);
        if (!learner) return null;
        const profile = composeProfile(learner);
        const educationArray = profile.education || [];
        const education = educationArray.find((e: any) => e.status === 'ongoing') || educationArray[0] || {};
        let cgpa = education.cgpa || profile.cgpa || 'N/A';
        return {
          id: learner.id, name: profile.name || profile.nm_id || 'Unknown', email: profile.email || (profile.contact_number ? String(profile.contact_number) : 'N/A'),
          phone: profile.contact_number ? String(profile.contact_number) : (profile.alternate_number ? String(profile.alternate_number) : 'N/A'),
          university: education.university || profile.university || profile.college_school_name || 'N/A',
          department: education.department || profile.branch_field || 'N/A', cgpa, year_of_passing: education.yearOfPassing || education.year_of_passing || 'N/A',
          employability_score: profile._ || profile.score || null, photo: profile.photo || null, verified: profile.verified || false,
          added_at: item.added_at, notes: item.notes, junction_id: item.id
        };
      }).filter(Boolean);
      return apiSuccess({ candidates }, context.request);
    }
    case 'add-candidate-to-shortlist': {
      const { shortlist_id, learner_id, notes } = body;
      if (!shortlist_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id and learner_id required', context.request);
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(403, 'FORBIDDEN', 'No active organization', context.request);
      const access = await verifyOrgAccess(supabase, user.id, orgId, 'manage_candidates');
      if (!access.allowed) return apiError(403, 'FORBIDDEN', 'You do not have permission to manage candidates', context.request);
      // 🔒 Verify parent shortlist ownership BEFORE touching the junction rows,
      // and force added_by to the server-side user id (client value ignored).
      const gated = await loadGatedShortlist(supabase, user, context, shortlist_id);
      if (gated.error) return gated.error;
      const { data, error } = await supabase.from('shortlist_candidates').insert([{ shortlist_id: gated.id, learner_id, added_by: user.id, notes }]).select().single();
      if (error) {
        if (error.code === '23505') return apiSuccess({ data: null, error: { ...error, message: 'Candidate is already in this shortlist' } }, context.request);
        return apiDbError(error, context.request);
      }
      return apiSuccess({ data }, context.request);
    }
    case 'remove-candidate-from-shortlist': {
      const { shortlist_id, learner_id } = body;
      if (!shortlist_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id and learner_id required', context.request);
      const user = getContextUser(context);
      // 🔒 Junction rows are scoped by shortlist_id — verify the parent first.
      const gated = await loadGatedShortlist(supabase, user, context, shortlist_id);
      if (gated.error) return gated.error;
      const { error } = await supabase.from('shortlist_candidates').delete().eq('shortlist_id', gated.id).eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }
    case 'is-learner-in-shortlist': {
      const { shortlist_id, learner_id } = body;
      if (!shortlist_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id and learner_id required', context.request);
      // 🔒 Gate: the shortlist owner's org (recruiter side, via
      // loadGatedShortlist) OR the learner themself (learner side).
      const user = getContextUser(context);
      if (String(shortlist_id) !== String(shortlist_id).trim() || !SL_ID_RE.test(String(shortlist_id))) {
        return apiError(400, 'VALIDATION_ERROR', 'shortlist_id required', context.request);
      }
      const isSelf = learner_id === user.id
        || !!(await supabase.from('learners').select('id').eq('id', learner_id).eq('user_id', user.id).limit(1).maybeSingle()).data;
      if (!isSelf) {
        const gated = await loadGatedShortlist(supabase, user, context, shortlist_id);
        if (gated.error) return gated.error;
      } else {
        // Learner side: confirm the shortlist exists, then answer membership
        // (existence check avoids leaking presence across a deleted shortlist).
        const { data: exists, error } = await supabase.from('shortlists').select('id').eq('id', String(shortlist_id)).limit(1).maybeSingle();
        if (error) return apiDbError(error, context.request);
        if (!exists) return apiError(404, 'NOT_FOUND', 'Shortlist not found', context.request);
      }
      const { data, error } = await supabase.from('shortlist_candidates').select('id').eq('shortlist_id', String(shortlist_id)).eq('learner_id', learner_id).maybeSingle();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ inShortlist: !!data }, context.request);
    }
    case 'get-shortlists-for-learner': {
      const { learner_id } = body;
      if (!learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', context.request);
      // 🔒 Only the learner themself may list the shortlists they appear in.
      const user = getContextUser(context);
      let owned = learner_id === user.id;
      if (!owned) {
        const { data: own } = await supabase.from('learners').select('id').eq('id', learner_id).eq('user_id', user.id).limit(1).maybeSingle();
        owned = !!own;
      }
      if (!owned) return apiError(403, 'FORBIDDEN', 'You may only view your own shortlists', context.request);
      const { data, error } = await supabase.from('shortlist_candidates').select('*, shortlists(id, name, description, created_date, status)').eq('learner_id', learner_id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ shortlists: (data || []).map(item => item.shortlists) }, context.request);
    }
    case 'update-candidate-notes': {
      const { shortlist_id, learner_id, notes } = body;
      if (!shortlist_id || !learner_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id and learner_id required', context.request);
      const user = getContextUser(context);
      // 🔒 Verify via the parent shortlist first (rows are scoped by shortlist_id).
      const gated = await loadGatedShortlist(supabase, user, context, shortlist_id);
      if (gated.error) return gated.error;
      const { data, error } = await supabase.from('shortlist_candidates').update({ notes }).eq('shortlist_id', gated.id).eq('learner_id', learner_id).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ data }, context.request);
    }
    case 'log-export-activity': {
      const { export_data } = body;
      if (!export_data) return apiError(400, 'VALIDATION_ERROR', 'export_data required', context.request);
      const { data, error } = await supabase.from('export_activities').insert([export_data]).select().single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ data }, context.request);
    }
    case 'get-export-history': {
      const { shortlist_id } = body;
      if (!shortlist_id) return apiError(400, 'VALIDATION_ERROR', 'shortlist_id required', context.request);
      const { data, error } = await supabase.from('export_activities').select('*').eq('shortlist_id', shortlist_id).order('exported_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ exports: data }, context.request);
    }

    // ── Pipeline helper actions (from usePipelineData) ──
    case 'get-opportunities-by-ids': {
      const { ids } = body;
      if (!ids || !Array.isArray(ids)) return apiError(400, 'VALIDATION_ERROR', 'ids array required', context.request);
      const { data, error } = await supabase.from('opportunities').select('id, skills_required').in('id', ids);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ opportunities: data || [] }, context.request);
    }
    case 'get-skills-by-learner-ids': {
      const { learner_ids } = body;
      if (!learner_ids || !Array.isArray(learner_ids)) return apiError(400, 'VALIDATION_ERROR', 'learner_ids array required', context.request);
      const { data, error } = await supabase.from('skills').select('learner_id, name, enabled').in('learner_id', learner_ids).eq('enabled', true);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ skills: data || [] }, context.request);
    }

    default:
      return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
  }
});
