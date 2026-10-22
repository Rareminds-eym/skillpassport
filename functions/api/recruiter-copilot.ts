/**
 * Recruiter Copilot API
 * POST: Action-based dispatch for recruiter AI operations
 */
import { withAuth, getContextUser } from '../lib/auth';
import { getServiceClient } from '../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../lib/response';
import { getActiveOrgId, getOrgOwnedOpportunityIds } from '../lib/org-ownership';

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

/**
 * C4 completion: candidate discovery surfaces must not expose contact details
 * for locked candidates. Rows are matched to the caller's unlock ledger by
 * canonical learners.id (or the user_id alias, resolved server-side); contact
 * fields return null unless that org has physically unlocked the candidate.
 * Everything is masked when no org context or no ids are available (fail-closed).
 */
async function maskLockedContacts(supabase: any, orgId: string | null | undefined, rows: any[]): Promise<any[]> {
  const safe = rows || [];
  if (!orgId || safe.length === 0) {
    return safe.map((r) => ({ ...r, email: null, contact_number: null, phone: null }));
  }

  const directIds = [...new Set(safe.map((r: any) => r?.id).filter(Boolean))];
  const userIds = [...new Set(safe.filter((r: any) => !r?.id && r?.user_id).map((r: any) => r.user_id))];
  let aliasIdByUserId = new Map<string, string>();
  if (userIds.length) {
    const { data: aliasRows } = await supabase
      .from('learners')
      .select('id, user_id')
      .in('user_id', userIds);
    aliasIdByUserId = new Map((aliasRows || []).map((r: any) => [r.user_id, r.id]));
    directIds.push(...(aliasRows || []).map((r: any) => r.id));
  }

  const unlockedIds = new Set<string>();
  if (directIds.length) {
    const { data: unlockedRows, error } = await supabase
      .from('candidate_contact_unlocks')
      .select('candidate_id')
      .eq('organization_id', orgId)
      .in('candidate_id', directIds);
    if (!error) for (const r of (unlockedRows || [])) unlockedIds.add(r.candidate_id);
  }

  return safe.map((r: any) => {
    const canonical = r?.id || (r?.user_id ? aliasIdByUserId.get(r.user_id) : null);
    if (canonical && unlockedIds.has(canonical)) return r;
    return { ...r, email: null, contact_number: null, phone: null };
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
        const masked = await maskLockedContacts(supabase, user.org_id, data || []);
        return apiSuccess(masked, context.request, { startTime });
      }

      case 'semantic-find-for-opportunity': {
        const { opportunity_id, match_count = 20, min_similarity = 0.65 } = params;
        if (!user.org_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing college organization ID', context.request, { startTime });
        }

        // Ownership: a shortlist can only be generated for the caller's own opening
        const { data: opp, error: oppError } = await supabase
          .from('opportunities')
          .select('embedding, title')
          .eq('id', opportunity_id)
          .eq('organization_id', user.org_id)
          .maybeSingle();
        if (oppError) return apiDbError(oppError, context.request, { startTime });
        if (!opp) {
          return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request, { startTime });
        }
        if (!opp?.embedding) return apiSuccess([], context.request, { startTime });
        const { data, error } = await supabase.rpc('match_candidates_to_opportunity', {
          opportunity_embedding: opp.embedding,
          match_count,
          min_similarity,
        });
        if (error) return apiDbError(error, context.request, { startTime });
        if (!data || data.length === 0) return apiSuccess([], context.request, { startTime });

        // AI shortlist is a metered credit (spec §6): 1 ai_credits per generated
        // shortlist. Charged only after a successful match — an RPC failure must not
        // burn a credit. Free/Lite tenants (0 balance) get 402; included plans pay
        // from their plan allocation; add-on packs top the same pool.
        //
        // IDEMPOTENCY (Stripe/IETF Idempotency-Key pattern): the client may send a
        // requestId per logical shortlist operation. The reference_id below keys the
        // consumption ledger row and ux_credit_ledger_consumption_ref makes replays
        // un-insertable; without requestId, each run gets a fresh reference so
        // per-run charging is preserved.
        const requestId = params?.requestId;
        if (
          requestId !== undefined &&
          (typeof requestId !== 'string' || requestId.length === 0 || requestId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(requestId))
        ) {
          return apiError(400, 'VALIDATION_ERROR', 'requestId must be a UUID-like string of at most 64 characters', context.request, { startTime });
        }
        const creditReference = requestId
          ? requestId
          : `sf-${opportunity_id}-${crypto.randomUUID()}`;
        // Payload binding: ledger notes carry the logical operation so a replayed
        // key + DIFFERENT payload can be detected (same key + other payload = invalid).
        const consumptionNotes = JSON.stringify({ generated_by: user.id, role: opp.title || null, opportunity_id });

        const { enforceAndConsumeCredits } = await import('../shared/lib/credit-middleware');

        // Cheap pre-check: a ledger row with this reference means the operation
        // was already charged — replay the same result instead of double-charging.
        const findConsumption = () =>
          supabase
            .from('credit_ledger')
            .select('id, notes')
            .eq('tenant_id', user.org_id)
            .eq('feature_key', 'ai_credits')
            .eq('transaction_type', 'consumption')
            .eq('reference_id', creditReference)
            .limit(1)
            .maybeSingle();

        let charged = false;
        // Same idempotency key + a different logical operation = invalid request
        // (Stripe analog of its 422 "idempotency key was used with a different body").
        const detectPayloadConflict = (row: any): boolean => {
          let priorOppId: any = null;
          if (typeof row?.notes === 'string') {
            try { priorOppId = JSON.parse(row.notes)?.opportunity_id; } catch { /* legacy notes */ }
          }
          return typeof priorOppId === 'string' && priorOppId !== opportunity_id;
        };

        const resolveExisting = async () => {
          const { data: existing } = await findConsumption();
          return existing || null;
        };

        const existingCharge = await resolveExisting();
        let credit: any;
        if (existingCharge) {
          if (detectPayloadConflict(existingCharge)) {
            return apiError(409, 'IDEMPOTENCY_CONFLICT', 'requestId already used for a different shortlist request', context.request, { startTime });
          }
          console.info('[recruiter-copilot] idempotent replay: consumption already recorded, skipping charge', {
            action: 'semantic-find-for-opportunity',
            reference_id: creditReference,
          });
        } else {
          credit = await enforceAndConsumeCredits(
            supabase,
            user.org_id,
            'ai_credits',
            1,
            creditReference,
            consumptionNotes,
            context.request
          );
          if (credit.allowed && credit.success) {
            charged = true;
          } else {
            // Race window: a concurrent retry may have just committed the same
            // consumption reference (23505 on ux_credit_ledger_consumption_ref).
            // Re-check the ledger before failing the request — treat it exactly
            // like the pre-check replay above.
            const concurrent = await resolveExisting();
            if (concurrent) {
              if (detectPayloadConflict(concurrent)) {
                return apiError(409, 'IDEMPOTENCY_CONFLICT', 'requestId already used for a different shortlist request', context.request, { startTime });
              }
              console.info('[recruiter-copilot] idempotent replay: concurrent consumption won, skipping charge', {
                action: 'semantic-find-for-opportunity',
                reference_id: creditReference,
              });
            } else {
              return credit.errorResponse || credit.response || apiError(
                402,
                'INSUFFICIENT_CREDITS',
                'Insufficient AI shortlist credits. Upgrade your plan or purchase the AI shortlist pack.',
                context.request
              );
            }
          }
        }

        // C4: mask contact fields on shortlist rows for candidates this org
        // has not unlocked (the shortlist still conveys the match ranking).
        // CHARGE-WINDOW COMPENSATION: everything after the credit was consumed
        // (masking + serialization) can still fail; on throw, refund the charge
        // so a failed shortlist never burns a credit (best-effort, fail-soft).
        let masked: any[];
        try {
          masked = await maskLockedContacts(supabase, user.org_id, data);
        } catch (postChargeError) {
          if (charged) {
            try {
              await supabase.from('credit_ledger').insert({
                tenant_id: user.org_id,
                feature_key: 'ai_credits',
                transaction_type: 'refund',
                amount: 1,
                reference_id: creditReference,
                notes: JSON.stringify({ reason: 'compensation: post-charge failure', generated_by: user.id, opportunity_id }),
              });
            } catch (refundErr) {
              console.warn('[recruiter-copilot] Failed to refund credit after post-charge failure:', {
                reference_id: creditReference,
                error: refundErr instanceof Error ? refundErr.message : String(refundErr),
              });
            }
          }
          throw postChargeError;
        }
        return apiSuccess(masked, context.request, { startTime });
      }

      // ── Learners ──
      case 'fetch-learners': {
        const { learner_ids, name_filter, limit = 50 } = params;
        let query = supabase.from('learners').select('*');
        if (learner_ids) query = query.in('user_id', learner_ids);
        if (name_filter) query = query.ilike('name', `%${name_filter}%`);
        query = query.not('name', 'is', null).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        // C4: discovery surface — contact details only for unlocked candidates
        const masked = await maskLockedContacts(supabase, user.org_id, data || []);
        return apiSuccess(masked, context.request, { startTime });
      }

      case 'fetch-learners-basic': {
        const { learner_ids, name_filter, limit = 50 } = params;
        let query = supabase
          .from('learners')
          .select('id, user_id, name, email, university, branch_field, city, state, currentCgpa, expectedGraduationDate, updated_at, resumeUrl');
        if (learner_ids) query = query.in('user_id', learner_ids);
        if (name_filter) query = query.ilike('name', `%${name_filter}%`);
        query = query.not('name', 'is', null).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const masked = await maskLockedContacts(supabase, user.org_id, data || []);
        return apiSuccess(masked, context.request, { startTime });
      }

      case 'fetch-learners-with-location': {
        const { data, error } = await supabase
          .from('learners')
          .select('city, state')
          .not('city', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-university': {
        const { data, error } = await supabase
          .from('learners')
          .select('university')
          .not('university', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-grad-years': {
        const { data, error } = await supabase
          .from('learners')
          .select('expectedGraduationDate');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-learners-enriched': {
        const { limit = 50 } = params;
        const { data, error } = await supabase
          .from('learners')
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

        const masked = await maskLockedContacts(supabase, user.org_id, data || []);
        return apiSuccess(masked, context.request, { startTime });
      }

      case 'count-learners': {
        const { error, count } = await supabase
          .from('learners')
          .select('user_id', { count: 'exact', head: true })
          .not('name', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'count-learners-with-location': {
        const { error, count } = await supabase
          .from('learners')
          .select('user_id', { count: 'exact', head: true })
          .not('name', 'is', null)
          .not('city', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'count-learners-with-cgpa': {
        const { error, count } = await supabase
          .from('learners')
          .select('user_id', { count: 'exact', head: true })
          .not('name', 'is', null)
          .not('currentCgpa', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      // ── Skills ──
      case 'fetch-skills': {
        const { learner_ids, skill_name_filter, limit = 100 } = params;
        let query = supabase.from('skills').select('*').eq('enabled', true);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (skill_name_filter) query = query.ilike('name', `%${skill_name_filter}%`);
        if (limit) query = query.limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-skills-learner-ids': {
        const { data, error } = await supabase
          .from('skills')
          .select('learner_id')
          .eq('enabled', true);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-skills-names': {
        const { data, error } = await supabase
          .from('skills')
          .select('name')
          .eq('enabled', true);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'count-skills': {
        const { error, count } = await supabase
          .from('skills')
          .select('id', { count: 'exact', head: true })
          .eq('enabled', true);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'count-skill-by-name': {
        const { skill_name } = params;
        const { count } = await supabase
          .from('skills')
          .select('id', { count: 'exact', head: true })
          .eq('enabled', true)
          .ilike('name', `%${skill_name}%`);
        return apiSuccess((count || 0) > 0, context.request, { startTime });
      }

      // ── Trainings ──
      case 'fetch-trainings': {
        const { learner_ids } = params;
        let query = supabase.from('trainings').select('learner_id, trainingName, organization, completedDate');
        if (learner_ids) query = query.in('learner_id', learner_ids);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'count-trainings': {
        const { learner_id } = params;
        const { count } = await supabase
          .from('trainings')
          .select('id', { count: 'exact', head: true })
          .eq('learner_id', learner_id);
        return apiSuccess(count || 0, context.request, { startTime });
      }

      // ── Certificates ──
      case 'fetch-certificates': {
        const { learner_ids } = params;
        let query = supabase.from('certificates').select('learner_id, title, issuer, issued_on, level, enabled');
        if (learner_ids) query = query.in('learner_id', learner_ids);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'count-certificates': {
        const { learner_id } = params;
        const { count } = await supabase
          .from('certificates')
          .select('id', { count: 'exact', head: true })
          .eq('learner_id', learner_id)
          .eq('enabled', true);
        return apiSuccess(count || 0, context.request, { startTime });
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
        let query = supabase.from('pipeline_candidates').select('*');
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
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-pipeline-with-learners': {
        const { opportunity_ids, limit = 50 } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        const { data, error } = await supabase
          .from('pipeline_candidates')
          .select('*, learners:learner_id ( name, email, university, currentCgpa )')
          .in('opportunity_id', opportunity_ids)
          .in('opportunity_id', orgIds) // org gate
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-pipeline-with-opportunities': {
        const { opportunity_ids, learner_ids, stage, status, limit = 50 } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        let query = supabase
          .from('pipeline_candidates')
          .select('*, opportunities:opportunity_id ( job_title, company_name )');
        if (opportunity_ids) query = query.in('opportunity_id', opportunity_ids);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (stage) query = query.eq('stage', stage);
        if (status) query = query.eq('status', status);
        query = query.in('opportunity_id', orgIds); // org gate
        query = query.order('stage_changed_at', { ascending: false }).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'fetch-pipeline-needs-action': {
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('pipeline_candidates')
          .select('*, opportunities:opportunity_id ( job_title, company_name )')
          .eq('status', 'active')
          .in('opportunity_id', orgIds) // org gate
          .or(`next_action_date.lte.${today},next_action_date.is.null`)
          .not('next_action', 'is', null);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Applied Jobs ──
      case 'fetch-applied-jobs': {
        const { opportunity_ids, learner_ids, statuses, limit = 50 } = params;
        const orgIds = await getOrgOpportunityScope(supabase, user);
        if (!orgIds || orgIds.length === 0) return apiSuccess([], context.request, { startTime });
        let query = supabase
          .from('applied_jobs')
          .select('*, learners:learner_id ( user_id, name, email, university, currentCgpa, city, state, resumeUrl )');
        if (opportunity_ids) query = query.in('opportunity_id', opportunity_ids);
        if (learner_ids) query = query.in('learner_id', learner_ids);
        if (statuses) query = query.in('application_status', statuses);
        query = query.in('opportunity_id', orgIds); // org gate
        query = query.order('applied_at', { ascending: false }).limit(limit);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
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
    console.error(`[recruiter-copilot] Action "${action}" failed:`, error?.message || error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
