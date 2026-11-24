/**
 * Recruiter Copilot API
 * POST: Action-based dispatch for recruiter AI operations
 */
import { withAuth, getContextUser } from '../lib/auth';
import { getServiceClient } from '../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../lib/response';
import { getActiveOrgId, getOrgOwnedOpportunityIds } from '../lib/org-ownership';
import { requireSubscriptionAccess, readRecruiterContactPermissions, recruiterCandidateView, prepareRecruiterSubscriptionCredit } from '../shared/lib/subscription-access';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from '../lib/types';

// Shortlist generation writes the credit ledger; company actions persist resources.
const SUBSCRIPTION_WRITE_ACTIONS = new Set([
  'semantic-find-for-opportunity', 'companies-add', 'companies-update',
  'companies-update-status', 'companies-delete',
]);

/**
 * Helper function to validate and extract college ID from authenticated user
 * @returns collegeId if valid, or error response if missing
 */
function validateCollegeId(user: any, request: any, startTime: number) {
  const collegeId = user.org_id;
  if (!collegeId) {
    return { error: apiError(400, 'VALIDATION_ERROR', 'Missing college organization ID', request, { startTime }) };
  }
  return { collegeId };
}

// Bound PostgREST filters and response pages independently of business entitlements.
const DISCLOSURE_PAGE_SIZE = 250;
const DISCLOSURE_PAGE_BUDGET = 100;
async function allDisclosureRows(query: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>) {
  const rows: Record<string, unknown>[] = [];
  for (let page = 0; page < DISCLOSURE_PAGE_BUDGET; page++) {
    const result = await query(page * DISCLOSURE_PAGE_SIZE, (page + 1) * DISCLOSURE_PAGE_SIZE - 1);
    if (result.error) throw new Error('Candidate aggregate unavailable');
    const batch = z.array(z.record(z.unknown())).max(DISCLOSURE_PAGE_SIZE).parse(result.data);
    rows.push(...batch);
    if (batch.length < DISCLOSURE_PAGE_SIZE) return rows;
  }
  throw new Error('Candidate aggregate exceeds inspection budget');
}
const candidateIdentity = z.object({ id: z.string().uuid(), user_id: z.string().uuid() }).passthrough();
type DisclosureInput = { database: SupabaseClient; env: PagesEnv; request: Request; actorId: string; organizationId: string };
/** Resolve RPC/child aliases through the filtered owner before applying current consent. */
async function candidateViews(input: DisclosureInput, values: unknown[], child = false): Promise<{ source: Record<string, unknown>; candidate: ReturnType<typeof recruiterCandidateView> }[]> {
  const rows = z.array(z.record(z.unknown())).parse(values);
  if (rows.length > DISCLOSURE_PAGE_SIZE) {
    const result: Awaited<ReturnType<typeof candidateViews>> = [];
    for (let offset = 0; offset < rows.length; offset += DISCLOSURE_PAGE_SIZE) {
      result.push(...await candidateViews(input, rows.slice(offset, offset + DISCLOSURE_PAGE_SIZE), child));
    }
    return result;
  }
  const references = rows.map(row => z.string().uuid().parse(child ? row.learner_id : row.id ?? row.user_id));
  const column = child || rows.every(row => row.id !== undefined) ? 'id' : 'user_id';
  let canonical: z.infer<typeof candidateIdentity>[] = [];
  if (references.length) {
    const result = await input.database.from('zoho_recruiter_learners').select('id,user_id,name,email,contact_number,university,universityId,branch_field,college_school_name,course_name,city,state,country,district_name,currentCgpa,expectedGraduationDate,created_at,updated_at,approval_status,college_id').in(column, references);
    if (result.error) throw new Error('Candidate identity unavailable');
    canonical = z.array(candidateIdentity).parse(result.data);
    if (new Set(canonical.map(row => row.id)).size !== canonical.length
      || canonical.some(row => !references.includes(String(row[column])))) throw new Error('Candidate identity scope differs');
  }
  const permissions = await readRecruiterContactPermissions(input, canonical, 'discovery');
  if (permissions instanceof Response) throw permissions;
  return rows.flatMap((row, index) => {
    const candidate = canonical.find(item => item[column] === references[index]);
    const permission = candidate && permissions.get(candidate.id);
    if (!candidate || !permission?.visible) return [];
    return [{ source: row, candidate: recruiterCandidateView(candidate, permission) }];
  });
}

/** Opportunity lists must never exceed this many ids in a single PostgREST `.in()` filter. */
const ORG_SCOPE_ID_CAP = 500;

/**
 * Org gate (OWASP object-level authorization / BOLA mitigation): the set of
 * opportunity ids owned by the caller's ACTIVE organization, derived from the
 * DB — never from client input. Returns `null` when no active org can be
 * resolved at all, which every caller treats as "empty result set".
 */
async function getOrgOpportunityScope(supabase: any, user: any): Promise<string[] | null> {
  const orgId = await getActiveOrgId(supabase, user);
  if (!orgId) {
    console.warn(JSON.stringify({
      message: 'recruiter-copilot: org scope unresolved; returning empty results',
      userId: user?.id,
      service: 'recruiter-copilot',
    }));
    return null;
  }
  let ids = await getOrgOwnedOpportunityIds(supabase, orgId);
  if (ids.length > ORG_SCOPE_ID_CAP) {
    console.warn(JSON.stringify({
      message: 'recruiter-copilot: org opportunity scope capped for .in() filter',
      orgId,
      total: ids.length,
      cap: ORG_SCOPE_ID_CAP,
      service: 'recruiter-copilot',
    }));
    ids = ids.slice(0, ORG_SCOPE_ID_CAP);
  }
  return ids;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const supabase = getServiceClient(context.env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    const organizationId = await getActiveOrgId(supabase, user);
    if (!organizationId) return apiError(403, 'FORBIDDEN', 'An active recruitment organization is required', context.request);
    const access = await requireSubscriptionAccess({ env: context.env as PagesEnv, request: context.request,
      actorId: user.id, subject: { kind: 'organization', id: organizationId },
      mode: SUBSCRIPTION_WRITE_ACTIONS.has(action) ? 'write' : 'read' });
    if (access instanceof Response) return access;
    const disclosure: DisclosureInput = { database: supabase, env: context.env as PagesEnv,
      request: context.request, actorId: user.id, organizationId };
    const visibleCandidates = async (rows: unknown[]) => (await candidateViews(disclosure, rows)).map(row => row.candidate);
    const visibleChildren = async (rows: unknown[], fields: readonly string[], nested = false): Promise<Record<string, unknown>[]> =>
      (await candidateViews(disclosure, rows, true)).map(({ source, candidate }) => ({
        ...Object.fromEntries(fields.filter(key => Object.hasOwn(source, key)).map(key => [key, source[key]])),
        ...(nested ? { learners: candidate } : {}),
        ...(nested && source.opportunities && typeof source.opportunities === 'object' && !Array.isArray(source.opportunities)
          ? { opportunities: z.object({ job_title: z.string().nullable().optional(), company_name: z.string().nullable().optional() }).strip().parse(source.opportunities) } : {}),
      }));
    switch (action) {
      // ── Semantic Search ──
      case 'semantic-search-candidates': {
        // NOTE: intentionally NOT metered. This powers the basic_candidate_search
        // entitlement (public candidate discovery), unlike semantic-find-for-opportunity
        // which is a metered ai_credits shortlist. Never add charging here.
        const rawCount = Number(params?.match_count ?? 10);
        const rawThreshold = Number(params?.match_threshold ?? 0.7);
        const match_count = Math.min(50, Math.max(1, Number.isFinite(rawCount) ? Math.floor(rawCount) : 10));
        const match_threshold = Math.min(0.95, Math.max(0.2, Number.isFinite(rawThreshold) ? rawThreshold : 0.7));

        // Input validation (OWASP): the embedding is client-supplied before it
        // reaches the RPC — bound its shape there. No text inputs exist on this
        // action; query_embedding is the only client-controlled payload.
        const query_embedding = params?.query_embedding;
        const isValidEmbedding =
          Array.isArray(query_embedding) &&
          query_embedding.length > 0 &&
          query_embedding.length <= 4096 &&
          query_embedding.every((v: any) => typeof v === 'number' && Number.isFinite(v));
        if (!isValidEmbedding) {
          return apiError(
            400,
            'VALIDATION_ERROR',
            'query_embedding must be a non-empty numeric array with at most 4096 dimensions',
            context.request,
            { startTime }
          );
        }

        const { data, error } = await supabase.rpc('search_candidates_by_embedding', {
          query_embedding,
          match_threshold,
          match_count,
        });
        if (error) return apiDbError(error, context.request, { startTime });

        // C4: the RPC's returned columns are not repo-guaranteed — mask any
        // contact fields before they reach the browser.
        const masked = (await candidateViews(disclosure, data || [])).map(({ source, candidate }) => ({ ...candidate,
          ...(source.similarity === undefined ? {} : { similarity: z.number().finite().parse(source.similarity) }) }));
        return apiSuccess(masked, context.request, { startTime });
      }

      case 'semantic-find-for-opportunity': {
        const parsed = z.object({ opportunity_id: z.number().int().positive(), match_count: z.number().int().min(1).max(50).default(20),
          min_similarity: z.number().finite().min(0).max(1).default(0.65), requestId: z.string().uuid().optional() }).strict().safeParse(params);
        if (!parsed.success) return apiError(400, 'VALIDATION_ERROR', 'Invalid shortlist request', context.request, { startTime });
        const operationId = parsed.data.requestId ?? crypto.randomUUID();
        const prepared = await prepareRecruiterSubscriptionCredit(disclosure, 'recruiter.shortlist.generate', operationId);
        if (prepared instanceof Response) return prepared;
        const { requestId: _requestId, ...query } = parsed.data;
        // Matching, current consent checks, debit and durable result share one transaction.
        // A retry returns this operation's retained candidate identities, never a new paid search.
        const result = await supabase.rpc('generate_subscription_recruiter_shortlist', {
          p_actor_id: user.id, p_organization_id: organizationId, p_query: query,
          p_credit_command: prepared.command, p_authorization: prepared.authorization,
        });
        if (result.error) {
          if (result.error.code === '42501') return apiError(403, 'FORBIDDEN', 'Shortlist access denied', context.request, { startTime });
          if (result.error.code === '22023') return apiError(409, 'IDEMPOTENCY_CONFLICT', 'Shortlist operation identity differs', context.request, { startTime });
          if (String(result.error.message).includes('INSUFFICIENT_SUBSCRIPTION_CREDITS')) return apiError(402, 'INSUFFICIENT_CREDITS', 'Insufficient shortlist credits', context.request, { startTime });
          return apiDbError(result.error, context.request, { startTime });
        }
        const receipt = z.object({ operationId: z.string().uuid(), query: z.object({ opportunity_id: z.number().int(), match_count: z.number().int(),
          min_similarity: z.number() }).strict(), candidates: z.array(z.object({ id: z.string().uuid(), similarity: z.number().finite() }).strict()).max(50) }).strict().parse(result.data);
        if (receipt.operationId !== operationId || receipt.query.opportunity_id !== query.opportunity_id
          || receipt.query.match_count !== query.match_count || receipt.query.min_similarity !== query.min_similarity) throw new Error('Shortlist acknowledgement differs');
        const projected = await candidateViews(disclosure, receipt.candidates);
        return apiSuccess(projected.map(({ source, candidate }) => ({ ...candidate, similarity: z.number().finite().parse(source.similarity) })), context.request, { startTime });
      }

      // ── Learners ──
      case 'fetch-learners': {
        const { learner_ids, name_filter, limit = 50 } = params;
        let query = supabase.from('zoho_recruiter_learners').select('*');
        if (learner_ids) query = query.in('user_id', learner_ids);
        if (name_filter) query = query.ilike('name', `%${name_filter}%`);
        query = query.not('name', 'is', null).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        // C4: discovery surface — contact details only for unlocked candidates
        const masked = await visibleCandidates(data || []);
        return apiSuccess(masked, context.request, { startTime });
      }

      case 'fetch-learners-basic': {
        const { learner_ids, name_filter, limit = 50 } = params;
        let query = supabase
          .from('zoho_recruiter_learners')
          .select('id, user_id, name, email, university, branch_field, city, state, currentCgpa, expectedGraduationDate, updated_at, resumeUrl');
        if (learner_ids) query = query.in('user_id', learner_ids);
        if (name_filter) query = query.ilike('name', `%${name_filter}%`);
        query = query.not('name', 'is', null).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const masked = await visibleCandidates(data || []);
        return apiSuccess(masked, context.request, { startTime });
      }

      case 'fetch-learners-with-location': {
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_learners')
          .select('id,user_id,city,state')
          .not('city', 'is', null).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleCandidates(data || [])).flatMap(row => row.city == null ? [] : [{ city: row.city, state: row.state }]), context.request, { startTime });
      }

      case 'fetch-learners-university': {
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_learners')
          .select('id,user_id,university')
          .not('university', 'is', null).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleCandidates(data || [])).map(row => ({ university: row.university })), context.request, { startTime });
      }

      case 'fetch-learners-grad-years': {
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_learners')
          .select('id,user_id,expectedGraduationDate').order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleCandidates(data || [])).map(row => ({ expectedGraduationDate: row.expectedGraduationDate })), context.request, { startTime });
      }

      case 'fetch-learners-enriched': {
        const { limit = 50 } = params;
        const { data, error } = await supabase
          .from('zoho_recruiter_learners')
          .select(`
            id, user_id, name, email, university, branch_field,
            currentCgpa, expectedGraduationDate, city, state, country,
            resumeUrl, githubUrl, linkedinUrl, portfolioUrl,
            created_at, updated_at
          `)
          .not('name', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });

        const masked = await visibleCandidates(data || []);
        return apiSuccess(masked, context.request, { startTime });
      }

      case 'count-learners': {
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_learners')
          .select('id,user_id,name,city,currentCgpa')
          .not('name', 'is', null).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleCandidates(data || [])).length, context.request, { startTime });
      }

      case 'count-learners-with-location': {
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_learners')
          .select('id,user_id,name,city,currentCgpa')
          .not('name', 'is', null)
          .not('city', 'is', null).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleCandidates(data || [])).filter(row => row.city != null).length, context.request, { startTime });
      }

      case 'count-learners-with-cgpa': {
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_learners')
          .select('id,user_id,name,city,currentCgpa')
          .not('name', 'is', null)
          .not('currentCgpa', 'is', null).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleCandidates(data || [])).length, context.request, { startTime });
      }

      // ── Skills ──
      case 'fetch-skills': {
        const { learner_ids, skill_name_filter, limit = 100 } = params;
        let query = supabase.from('zoho_recruiter_skills').select('*').eq('enabled', true);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (skill_name_filter) query = query.ilike('name', `%${skill_name_filter}%`);
        if (limit) query = query.limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(await visibleChildren(data || [], ['id','learner_id','name','type','level','enabled','verified']), context.request, { startTime });
      }

      case 'fetch-skills-learner-ids': {
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_skills')
          .select('id,learner_id')
          .eq('enabled', true).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleChildren(data || [], ['learner_id'])).map(row => ({ learner_id: row.learner_id })), context.request, { startTime });
      }

      case 'fetch-skills-names': {
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_skills')
          .select('id,learner_id,name')
          .eq('enabled', true).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleChildren(data || [], ['name'])).map(row => ({ name: row.name })), context.request, { startTime });
      }

      case 'count-skills': {
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_skills')
          .select('id,learner_id')
          .eq('enabled', true).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleChildren(data || [], ['id'])).length, context.request, { startTime });
      }

      case 'count-skill-by-name': {
        const { skill_name } = params;
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_skills')
          .select('id,learner_id')
          .eq('enabled', true)
          .ilike('name', `%${skill_name}%`).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleChildren(data || [], ['id'])).length > 0, context.request, { startTime });
      }

      // ── Trainings ──
      case 'fetch-trainings': {
        const { learner_ids } = params;
        let query = supabase.from('zoho_recruiter_trainings').select('learner_id, trainingName, organization, completedDate');
        if (learner_ids) query = query.in('learner_id', learner_ids);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(await visibleChildren(data || [], ['learner_id','trainingName','organization','completedDate']), context.request, { startTime });
      }

      case 'count-trainings': {
        const { learner_id } = params;
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_trainings')
          .select('id,learner_id')
          .eq('learner_id', learner_id).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleChildren(data || [], ['id'])).length, context.request, { startTime });
      }

      // ── Certificates ──
      case 'fetch-certificates': {
        const { learner_ids } = params;
        let query = supabase.from('zoho_recruiter_certificates').select('learner_id, title, issuer, issued_on, level, enabled');
        if (learner_ids) query = query.in('learner_id', learner_ids);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(await visibleChildren(data || [], ['learner_id','title','issuer','issued_on','level','enabled']), context.request, { startTime });
      }

      case 'count-certificates': {
        const { learner_id } = params;
        const data = await allDisclosureRows((from, to) => supabase
          .from('zoho_recruiter_certificates')
          .select('id,learner_id')
          .eq('learner_id', learner_id)
          .eq('enabled', true).order('id', { ascending: true }).range(from, to));
        return apiSuccess((await visibleChildren(data || [], ['id'])).length, context.request, { startTime });
      }

      // ── Opportunities ──
      // Every action below is org-gated: results derive from the caller's ACTIVE
      // organization via getOrgOpportunityScope() (DB-derived, never client input).
      // Pre-existing per-action semantics (recruiter_id filters, etc.) are kept and
      // the org scope is AND-ed on top. No unresolved org → empty result, never a
      // global dump.
      case 'fetch-opportunities': {
        const { recruiter_id, opp_ids, is_active, job_title_filter, limit = 10 } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        let query = supabase.from('opportunities').select('*');
        if (recruiter_id) query = query.eq('recruiter_id', recruiter_id);
        if (opp_ids) query = query.in('id', opp_ids);
        if (is_active !== undefined) query = query.eq('is_active', is_active);
        if (job_title_filter) query = query.ilike('job_title', `%${job_title_filter}%`);
        query = query.in('id', orgIds); // org gate (AND-ed with caller filters above)
        query = query.order('created_at', { ascending: false }).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-opportunities-basic': {
        const { recruiter_id } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        let query = supabase.from('opportunities').select('id, job_title, company_name');
        if (recruiter_id) query = query.eq('recruiter_id', recruiter_id);
        query = query.in('id', orgIds); // org gate
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-opportunities-departments': {
        const { recruiter_id } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        let query = supabase.from('opportunities').select('department').not('department', 'is', null);
        if (recruiter_id) query = query.eq('recruiter_id', recruiter_id);
        query = query.in('id', orgIds); // org gate
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-opportunities-recent': {
        const { recruiter_id, limit = 5 } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        const { data, error } = await supabase
          .from('opportunities')
          .select('job_title, company_name, employment_type, posted_date, status')
          .eq('recruiter_id', recruiter_id)
          .in('id', orgIds) // org gate
          .order('posted_date', { ascending: false })
          .limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'count-active-opportunities': {
        const { recruiter_id } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess(0, context.request, { startTime });
        const { count } = await supabase
          .from('opportunities')
          .select('id', { count: 'exact', head: true })
          .eq('recruiter_id', recruiter_id)
          .in('id', orgIds) // org gate
          .eq('is_active', true);
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'fetch-opportunity-by-id': {
        const { id } = params;
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        // Org gate: object-level authorization — the row must belong to the
        // caller's active organization or it does not exist for this caller.
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || !orgIds.includes(String(data?.id))) {
          return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request, { startTime });
        }
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Pipeline Candidates ──
      case 'fetch-pipeline-candidates': {
        const { opportunity_ids, learner_ids, stage, status, days_stuck } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        let query = supabase.from('zoho_recruiter_pipeline_candidates').select('*');
        if (opportunity_ids) query = query.in('opportunity_id', opportunity_ids);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (stage) query = query.eq('stage', stage);
        if (status) query = query.eq('status', status);
        if (days_stuck) {
          const threshold = new Date();
          threshold.setDate(threshold.getDate() - days_stuck);
          query = query.lt('stage_changed_at', threshold.toISOString());
        }
        query = query.in('opportunity_id', orgIds); // org gate
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(await visibleChildren(data || [], ['id','learner_id','opportunity_id','stage','status','stage_changed_at','created_at','updated_at','application_status','applied_at','next_action_date'], true), context.request, { startTime });
      }

      case 'fetch-pipeline-with-learners': {
        const { opportunity_ids, limit = 50 } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        const { data, error } = await supabase
          .from('zoho_recruiter_pipeline_candidates')
          .select('*, learners:learner_id ( name, email, university, currentCgpa )')
          .in('opportunity_id', opportunity_ids)
          .in('opportunity_id', orgIds) // org gate
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(await visibleChildren(data || [], ['id','learner_id','opportunity_id','stage','status','stage_changed_at','created_at','updated_at','application_status','applied_at','next_action_date'], true), context.request, { startTime });
      }

      case 'fetch-pipeline-with-opportunities': {
        const { opportunity_ids, learner_ids, stage, status, limit = 50 } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        let query = supabase
          .from('zoho_recruiter_pipeline_candidates')
          .select('*, opportunities:opportunity_id ( job_title, company_name )');
        if (opportunity_ids) query = query.in('opportunity_id', opportunity_ids);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (stage) query = query.eq('stage', stage);
        if (status) query = query.eq('status', status);
        query = query.in('opportunity_id', orgIds); // org gate
        query = query.order('stage_changed_at', { ascending: false }).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(await visibleChildren(data || [], ['id','learner_id','opportunity_id','stage','status','stage_changed_at','created_at','updated_at','application_status','applied_at','next_action_date'], true), context.request, { startTime });
      }

      case 'fetch-pipeline-needs-action': {
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('zoho_recruiter_pipeline_candidates')
          .select('*, opportunities:opportunity_id ( job_title, company_name )')
          .eq('status', 'active')
          .in('opportunity_id', orgIds) // org gate
          .or(`next_action_date.lte.${today},next_action_date.is.null`)
          .not('next_action', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(await visibleChildren(data || [], ['id','learner_id','opportunity_id','stage','status','stage_changed_at','created_at','updated_at','application_status','applied_at','next_action_date'], true), context.request, { startTime });
      }

      // ── Applied Jobs ──
      case 'fetch-applied-jobs': {
        const { opportunity_ids, learner_ids, statuses, limit = 50 } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        let query = supabase
          .from('zoho_recruiter_applied_jobs')
          .select('*, learners:learner_id ( user_id, name, email, university, currentCgpa, city, state, resumeUrl )');
        if (opportunity_ids) query = query.in('opportunity_id', opportunity_ids);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (statuses) query = query.in('application_status', statuses);
        query = query.in('opportunity_id', orgIds); // org gate
        query = query.order('applied_at', { ascending: false }).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(await visibleChildren(data || [], ['id','learner_id','opportunity_id','stage','status','stage_changed_at','created_at','updated_at','application_status','applied_at','next_action_date'], true), context.request, { startTime });
      }

      // ── Recruiters ──
      case 'fetch-recruiter-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase
          .from('recruiters')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'fetch-recruiter-by-user-id': {
        const { user_id } = params;
        if (!user_id) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('recruiters')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'fetch-recruiter-by-id': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        const { data, error } = await supabase
          .from('recruiters')
          .select('id, name, email, phone, state, website, isactive')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Companies ──
      case 'companies-get-all': {
        const validation = validateCollegeId(user, context.request, startTime);
        if (validation.error) return validation.error;
        const collegeId = validation.collegeId!;
        
        const { data, error } = await supabase
          .from('college_placement_companies')
          .select('*')
          .eq('college_id', collegeId)
          .order('createdAt', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'companies-get-filtered': {
        const validation = validateCollegeId(user, context.request, startTime);
        if (validation.error) return validation.error;
        const collegeId = validation.collegeId!;
        
        const { search_term, industry, company_size, account_status } = params;
        let query = supabase.from('college_placement_companies').select('*').eq('college_id', collegeId);
        if (search_term) query = query.or(`name.ilike.%${search_term}%,code.ilike.%${search_term}%,industry.ilike.%${search_term}%`);
        if (industry) query = query.eq('industry', industry);
        if (company_size) query = query.eq('companySize', company_size);
        if (account_status) query = query.eq('accountStatus', account_status);
        query = query.order('createdAt', { ascending: false });
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'companies-add': {
        const validation = validateCollegeId(user, context.request, startTime);
        if (validation.error) return validation.error;
        const collegeId = validation.collegeId!;
        
        const { name, code, industry, companySize, establishedYear, hqAddress, hqCity, hqState, hqCountry, hqPincode, phone, email, website, contactPersonName, contactPersonDesignation, contactPersonEmail, contactPersonPhone, companyDescription, specialRequirements } = params;
        const newCompany = {
          college_id: collegeId,
          created_by: user.id,
          name,
          code,
          industry,
          companySize,
          establishedYear: establishedYear ? parseInt(establishedYear) : null,
          hqAddress, hqCity, hqState, hqCountry, hqPincode,
          phone, email, website,
          contactPersonName, contactPersonDesignation, contactPersonEmail, contactPersonPhone,
          accountStatus: 'pending',
          approvalStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            companyDescription: companyDescription || '',
            specialRequirements: specialRequirements || '',
            registrationDate: new Date().toISOString(),
          },
        };
        const { data, error } = await supabase.from('college_placement_companies').insert([newCompany]).select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'companies-update': {
        const validation = validateCollegeId(user, context.request, startTime);
        if (validation.error) return validation.error;
        const collegeId = validation.collegeId!;
        
        const { id, companyDescription, specialRequirements, ...regularFields } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        
        const updateData: any = { 
          ...regularFields, 
          updated_by: user.id,
          updatedAt: new Date().toISOString() 
        };
        if (regularFields.establishedYear) updateData.establishedYear = parseInt(regularFields.establishedYear);
        if (companyDescription !== undefined || specialRequirements !== undefined) {
          const { data: current } = await supabase
            .from('college_placement_companies')
            .select('metadata')
            .eq('id', id)
            .eq('college_id', collegeId)
            .single();
          const currentMetadata = current?.metadata || {};
          updateData.metadata = {
            ...currentMetadata,
            ...(companyDescription !== undefined && { companyDescription }),
            ...(specialRequirements !== undefined && { specialRequirements }),
          };
        }
        
        // IDOR protection: Update only if belongs to this college
        const { data, error } = await supabase
          .from('college_placement_companies')
          .update(updateData)
          .eq('id', id)
          .eq('college_id', collegeId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'companies-update-status': {
        const validation = validateCollegeId(user, context.request, startTime);
        if (validation.error) return validation.error;
        const collegeId = validation.collegeId!;
        
        const { id, status } = params;
        if (!id || !status) return apiError(400, 'VALIDATION_ERROR', 'Missing id or status', context.request, { startTime });
        
        // IDOR protection: Update only if belongs to this college
        const { data, error } = await supabase
          .from('college_placement_companies')
          .update({ 
            accountStatus: status, 
            updated_by: user.id,
            updatedAt: new Date().toISOString() 
          })
          .eq('id', id)
          .eq('college_id', collegeId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'companies-delete': {
        const validation = validateCollegeId(user, context.request, startTime);
        if (validation.error) return validation.error;
        const collegeId = validation.collegeId!;
        
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        
        // IDOR protection: Delete only if belongs to this college
        const { error } = await supabase
          .from('college_placement_companies')
          .delete()
          .eq('id', id)
          .eq('college_id', collegeId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      case 'companies-get-by-id': {
        const validation = validateCollegeId(user, context.request, startTime);
        if (validation.error) return validation.error;
        const collegeId = validation.collegeId!;
        
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        
        // IDOR protection: Get only if belongs to this college
        const { data, error } = await supabase
          .from('college_placement_companies')
          .select('*')
          .eq('id', id)
          .eq('college_id', collegeId)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'companies-stats': {
        const validation = validateCollegeId(user, context.request, startTime);
        if (validation.error) return validation.error;
        const collegeId = validation.collegeId!;
        
        const { data, error } = await supabase
          .from('college_placement_companies')
          .select('accountStatus')
          .eq('college_id', collegeId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Market Intelligence (from opportunities) ──
      // Scans opportunities globally by design of the earlier implementation;
      // now org-gated like every other opportunity surface (an org without
      // postings gets an empty intelligence set, never other tenants' data).
      case 'fetch-active-opportunities': {
        const { limit = 100 } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        const { data, error } = await supabase
          .from('opportunities')
          .select('skills_required, job_title')
          .eq('is_active', true)
          .in('id', orgIds) // org gate
          .limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'UNKNOWN_ACTION', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error(`[recruiter-copilot] Action "${action}" failed:`, error?.message || error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
