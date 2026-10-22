import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';
import { notifyLearnersOfNewOpportunity } from '../../lib/newOpportunityNotifications';
import { verifyOrgAccess, PERMISSIONS, getUserRecruitmentRoles } from '../../lib/permissions';
import { reviewApplicationSchema } from '../../../src/shared/schemas/applicationReview';
import { createRequisitionSchema, updateRequisitionSchema, validSalaryRange } from '../../lib/requisitionValidation';
import { LearningError, validateLearningRequirements } from '../../lib/learning-eligibility';
import {
  getActiveOrgId,
  getOrgMemberUserIds,
  getOrgOwnedOpportunityIds,
  assertInterviewAccess,
  getInterviewRow,
  ALLOWED_REQUISITION_STATUSES,
} from '../../lib/org-ownership';

/** Flat learner columns that ALWAYS exist (schema.sql) — supplementary to the
 * legacy `learners.profile` jsonb, whose presence differs between prod (has it,
 * populated) and pre-drift local builds (absent until migration
 * 20261019130000 is applied). */
const LEARNER_DIRECT_COLS =
  'id, name, email, contact_number, alternate_number, branch_field, college_school_name, university, registration_number, date_of_birth, age, profile' as string;

/**
 * Compose the learner `profile` object the FE contract expects:
 *   base = authoritative flat columns, overridden by the jsonb `profile`
 *   (when populated — prod). Guarantees `learners.profile` is a usable object
 *   even when the column is missing/null on a drifted database.
 */
function composeLearnerProfile(l: any): Record<string, unknown> {
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
}

/** Post-process applied_jobs rows so `learners.profile` is always composed. */
function injectComposedProfiles(rows: any[]): any[] {
  return (rows || []).map((r: any) =>
    r?.learners ? { ...r, learners: { ...r.learners, profile: composeLearnerProfile(r.learners) } } : r
  );
}

export const onRequest = async (context: any) => {
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  // Compatibility aliases use the exact same permission and integrity checks.
  const action = body.action === 'delete-opportunity' ? 'delete-requisition' : body.action;

  // Auth-derived tenant resolution (H1): the client-supplied organizationId must NOT be
  // trusted — the JWT org claim (or the user's ACTIVE membership row) decides the tenant.
  // Delegates to the shared org-ownership helper: active-status filter + ordered
  // limit(1) so .maybeSingle() can never synthesize PGRST116 on multi-memberships.
  const resolveOrgId = async (): Promise<string | null> => getActiveOrgId(supabase, user as any);

  const validateAssignee = async (recruiterId: string, orgId: string): Promise<true | Response> => {
    const { data: recruiter, error } = await supabase.from('recruiters').select('user_id').eq('id', recruiterId).eq('isactive', true).maybeSingle();
    if (error) return apiDbError(error, context.request);
    const members = await getOrgMemberUserIds(supabase, orgId);
    if (!recruiter?.user_id || !members.includes(recruiter.user_id)) return apiError(400, 'VALIDATION_ERROR', 'Choose an active recruiter from your organization', context.request);
    return true;
  };

  // Candidates may be referenced by learners.id OR users.id; resolve to the canonical
  // learners.id so unlock ledger rows stay unique per candidate (H2 alias double-charge).
  const resolveCanonicalCandidate = async (candidateId: string) => {
    let { data, error } = await supabase
      .from('learners')
      .select('id, name, email, contact_number')
      .eq('id', candidateId)
      .maybeSingle();
    if (!error && !data) {
      const res = await supabase
        .from('learners')
        .select('id, name, email, contact_number')
        .eq('user_id', candidateId)
        .maybeSingle();
      data = res.data;
      error = res.error;
    }
    return { data, error };
  };

  // Emails the caller may look recruiters up by: their own email or the email
  // of an active member of their organization. Returns null on lookup failure
  // (fail-closed — the caller then gets a 500, never a broad result set).
  const resolveAllowedEmails = async (): Promise<Set<string> | null> => {
    const allowed = new Set<string>();
    if (user?.email) allowed.add(String(user.email).trim().toLowerCase());
    const orgId = await resolveOrgId();
    if (orgId) {
      const memberIds = await getOrgMemberUserIds(supabase, orgId);
      if (memberIds.length) {
        const { data: memberUsers, error } = await supabase
          .from('users')
          .select('email')
          .in('id', memberIds);
        if (error) {
          console.error('[actions] Failed to resolve member emails for access gate:', error.code);
          return null;
        }
        for (const u of (memberUsers || [])) {
          if ((u as any)?.email) allowed.add(String((u as any).email).trim().toLowerCase());
        }
      }
    }
    return allowed;
  };

  try {
    // ── Candidate Contact Unlocks (Spec Sections 6 & 9) ──
    if (action === 'check-candidate-unlocked') {
      const { candidateId } = body;
      if (!candidateId) return apiError(400, 'VALIDATION_ERROR', 'candidateId required', context.request);

      const orgId = await resolveOrgId();
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'organizationId required', context.request);

      const { data: canonical } = await resolveCanonicalCandidate(String(candidateId));
      if (!canonical) return apiSuccess({ isUnlocked: false, unlockedAt: null }, context.request);

      const { data, error } = await supabase
        .from('candidate_contact_unlocks')
        .select('id, created_at')
        .eq('organization_id', orgId)
        .eq('candidate_id', canonical.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        return apiDbError(error, context.request);
      }

      if (data) {
        return apiSuccess({
          isUnlocked: true,
          unlockedAt: data.created_at,
          candidate: {
            id: canonical.id,
            name: canonical.name,
            email: canonical.email,
            phone: canonical.contact_number,
          },
        }, context.request);
      }

      return apiSuccess({ isUnlocked: false, unlockedAt: null }, context.request);
    }

    if (action === 'unlock-candidate-contact') {
      const { candidateId } = body;
      if (!candidateId) return apiError(400, 'VALIDATION_ERROR', 'candidateId required', context.request);

      const orgId = await resolveOrgId();
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'organizationId required', context.request);

      // Resolve and 404 BEFORE any charge so nonexistent candidates cannot consume credits
      const { data: canonical, error: candErr } = await resolveCanonicalCandidate(String(candidateId));
      if (candErr) return apiDbError(candErr, context.request);
      if (!canonical) return apiError(404, 'NOT_FOUND', 'Candidate not found', context.request);

      // Atomic claim-then-charge via SECURITY DEFINER RPC (H2):
      // the unlock row insert and the credit debit commit or roll back together.
      const { data: result, error: rpcError } = await supabase.rpc('unlock_candidate_contact', {
        p_organization_id: orgId,
        p_candidate_id: canonical.id,
        p_unlocked_by: user.id,
      });

      if (rpcError) {
        console.error('[actions] unlock_candidate_contact failed:', rpcError);
        if (String(rpcError.message).includes('INSUFFICIENT_CREDITS')) {
          return apiError(402, 'INSUFFICIENT_CREDITS', 'Insufficient contact unlock credits. Please upgrade your plan or purchase a credit top-up.', context.request);
        }
        return apiDbError(rpcError, context.request);
      }

      const parsed = result as { success?: boolean; error?: string; candidate?: Record<string, unknown> } | null;
      if (!parsed?.success) {
        if (parsed?.error === 'CANDIDATE_NOT_FOUND') {
          return apiError(404, 'NOT_FOUND', 'Candidate not found', context.request);
        }
        return apiError(500, 'UNLOCK_FAILED', parsed?.error || 'Failed to unlock candidate', context.request);
      }

      const c = parsed.candidate || {};
      return apiSuccess({
        unlocked: true,
        candidate: {
          id: c.id || canonical.id,
          name: c.name || canonical.name,
          email: c.email || canonical.email,
          phone: c.contact_number || canonical.contact_number,
        },
      }, context.request);
    }

    // ── Org Context & Permissions ──
    if (action === 'get-user-org-context') {
      const { p_user_id } = body;
      // Fallback to currently authenticated user if not provided (or for security)
      const targetUserId = p_user_id || user.id;

      // Only allow querying own context unless admin (simplified for now to own context)
      if (targetUserId !== user.id) {
        return apiError(403, 'FORBIDDEN', 'Can only query own organization context', context.request);
      }

      const { data, error } = await supabase.rpc('get_user_org_context', {
        p_user_id: targetUserId,
      });

      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'has-recruitment-permission') {
      const { p_user_id, p_org_id, p_permission } = body;
      // 🔒 IDOR fix: the caller may only probe their OWN permission set.
      // (Previously any authenticated user could query any user/org pair.)
      const targetUserId = p_user_id || user.id;
      if (targetUserId !== user.id) {
        return apiError(403, 'FORBIDDEN', 'user_id must match the authenticated user', context.request);
      }
      // 🔒 p_org_id must be the caller's own org (or one they hold verified access to)
      if (p_org_id) {
        const ownOrgId = await resolveOrgId();
        if (p_org_id !== ownOrgId) {
          const access = await verifyOrgAccess(supabase, user.sub, String(p_org_id), undefined);
          if (!access.allowed) {
            return apiError(403, 'FORBIDDEN', 'Access denied to this organization', context.request);
          }
        }
      }

      const { data, error } = await supabase.rpc('has_recruitment_permission', {
        p_user_id: targetUserId,
        p_org_id,
        p_permission,
      });

      if (error) return apiDbError(error, context.request);
      return apiSuccess({ hasPermission: data }, context.request);
    }

    if (action === 'get-org-email-templates') {
      // 🔒 Org templates are org-private: resolve from the JWT, ignore the body value
      const orgId = await resolveOrgId();
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'organizationId required', context.request);

      const { data, error } = await supabase
        .from('organization_email_templates')
        .select('*')
        .eq('organization_id', orgId);

      if (error && error.code !== 'PGRST116') return apiDbError(error, context.request);
      return apiSuccess(data || [], context.request);
    }

    if (action === 'upsert-org-email-template') {
      const { template_type, name, subject, body: emailBody } = body;
      if (!template_type) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request);

      // 🔒 Same scoping: templates may only be created/edited for the caller's org
      const orgId = await resolveOrgId();
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'organizationId required', context.request);

      const { error } = await supabase
        .from('organization_email_templates')
        .upsert({
          organization_id: orgId,
          template_type,
          name,
          subject,
          body: emailBody,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id,template_type',
        });

      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true }, context.request);
    }

    // ── Opportunities ──
    if (action === 'list-opportunities-skills') {
      const { opportunityIds } = body;
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, skills_required')
        .in('id', opportunityIds);
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'get-recruiter-profile') {
      const { email } = body;
      const requested = String(email || '').trim().toLowerCase();
      if (!requested) return apiError(400, 'VALIDATION_ERROR', 'email required', context.request);

      // 🔒 IDOR fix: a caller may only resolve profiles for their own email or
      // the email of an active member of their organization (prevents
      // recruiter-row enumeration across organizations).
      const allowed = await resolveAllowedEmails();
      if (!allowed) {
        return apiError(500, 'INTERNAL_ERROR', 'Failed to validate access scope', context.request);
      }
      if (!allowed.has(requested)) {
        return apiError(403, 'FORBIDDEN', 'You can only look up profiles within your organization', context.request);
      }

      const { data, error } = await supabase
        .from('recruiters')
        .select('*')
        .eq('email', requested)
        .maybeSingle();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'list-interviews') {
      const orgId = await resolveOrgId();
      if (!orgId) return apiError(403, 'FORBIDDEN', 'An active organization is required', context.request);
      const access = await verifyOrgAccess(supabase, user.id, orgId, PERMISSIONS.VIEW_CANDIDATES);
      if (!access.allowed) return apiError(403, 'FORBIDDEN', 'You cannot view interviews', context.request);
      const { data, error } = await supabase.from('interviews').select('*').eq('organization_id', orgId).order('date');
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data || [], context.request);
    }

    if (action === 'update-interview') {
      const { id } = body;
      const updates: Record<string, unknown> = {};
      for (const field of ['scorecard', 'status', 'completed_date', 'date', 'duration', 'type', 'meeting_type', 'meeting_link', 'meeting_notes', 'interviewer', 'interviewer_email']) {
        if (body[field] !== undefined) updates[field] = body[field];
      }
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing interview id', context.request);

      // 🔒 Ownership: creator OR a learner scoped to the caller's org. This
      // closes the NULL-created_by bypass — previously any authenticated user
      // could edit rows whose created_by was never populated.
      const interview = await getInterviewRow(supabase, String(id));
      if (!interview) return apiError(404, 'NOT_FOUND', 'Interview not found', context.request);
      const iOrgId = await resolveOrgId();
      const allowed = await assertInterviewAccess(supabase, user as any, iOrgId, interview);
      if (!allowed) {
        return apiError(403, 'FORBIDDEN', 'You do not have access to this interview', context.request);
      }

      const permission = iOrgId && await verifyOrgAccess(supabase, user.id, iOrgId, PERMISSIONS.MANAGE_CANDIDATES);
      if (!permission || !permission.allowed) return apiError(403, 'FORBIDDEN', 'You cannot update interviews', context.request);
      const { data, error } = await supabase
        .from('interviews')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', String(id))
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'list-learners') {
      const { data, error } = await supabase.from('learners').select('*');
      if (error) return apiDbError(error, context.request);

      // Spec §6/§9: contact details are unlocked, not included by default (C4 — the
      // unlock must gate the PII server-side, since list-learners hands rows to the UI).
      const orgId = await resolveOrgId();
      let unlocked = new Set<string>();
      if (orgId) {
        const { data: unlockedRows, error: unlockErr } = await supabase
          .from('candidate_contact_unlocks')
          .select('candidate_id')
          .eq('organization_id', orgId);
        if (unlockErr && unlockErr.code !== 'PGRST116') {
          console.error('[actions] Error querying unlocks for list-learners masking:', unlockErr);
          return apiDbError(unlockErr, context.request);
        }
        unlocked = new Set((unlockedRows || []).map((u: any) => String(u.candidate_id)));
      }

      const masked = (data || []).map((l: any) => {
        if (unlocked.has(String(l.id))) return l;
        const { email, contact_number, ...rest } = l;
        return { ...rest, email: null, contact_number: null };
      });

      return apiSuccess(masked, context.request);
    }

    if (action === 'get-learner') {
      const { learnerId } = body;
      const orgId = await resolveOrgId();

      // Whole row minus the gated contact fields; only surfaced for unlocked candidates
      const { data, error } = await supabase
        .from('learners')
        .select('*')
        .eq('id', learnerId)
        .single();
      if (error) return apiDbError(error, context.request);

      if (orgId) {
        const { data: unlock, error: unlockErr } = await supabase
          .from('candidate_contact_unlocks')
          .select('id')
          .eq('organization_id', orgId)
          .eq('candidate_id', String(learnerId))
          .maybeSingle();
        if (unlockErr && unlockErr.code !== 'PGRST116') {
          console.error('[actions] Error checking unlock for get-learner:', unlockErr);
          return apiDbError(unlockErr, context.request);
        }
        if (unlock) return apiSuccess(data, context.request);
      }

      const { email, contact_number, ...rest } = data;
      return apiSuccess({ ...rest, email: null, contact_number: null }, context.request);
    }

    // ── Requisitions (opportunities) ──
    if (action === 'list-recruiters') {
      // 🔒 SECURITY: Get organization_id from authenticated user
      const organizationId = await resolveOrgId();

      // 🔒 Logging hygiene: no member/recruiter emails or identity lists in
      // logs — only concise first-arg operational context.
      console.log('[recruiter/actions] list-recruiters called:', {
        userId: user.id,
        organizationId,
      });

      if (!organizationId) {
        console.error('[recruiter/actions] list-recruiters: organizationId not found', { userId: user.id });
        return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      }

      // Step 1: Get all active recruiters
      const { data: allRecruiters, error: recruitersError } = await supabase
        .from('recruiters')
        .select('id, name, email, user_id')
        .eq('isactive', true)
        .order('name');

      if (recruitersError) {
        console.error('[recruiter/actions] Error fetching recruiters:', recruitersError.message);
        return apiDbError(recruitersError, context.request);
      }

      // If no recruiters at all, return empty
      if (!allRecruiters || allRecruiters.length === 0) {
        return apiSuccess([], context.request);
      }

      // Step 2: Get organization members for this org
      const { data: orgMembers, error: membersError } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          status,
          users!inner(id, email)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      if (membersError) {
        console.error('[recruiter/actions] Error fetching organization members:', membersError.message);
        return apiDbError(membersError, context.request);
      }

      // Steps 3 & 4: filter recruiters to those whose user_id belongs to this
      // organization's active members (member identity data is never logged).
      const orgUserIds = new Set((orgMembers || []).map((m: any) => m.user_id));
      const filteredRecruiters = (allRecruiters || []).filter(r => !!r.user_id && orgUserIds.has(r.user_id));

      console.log('[recruiter/actions] list-recruiters filtered:', {
        totalRecruiters: allRecruiters.length,
        filteredCount: filteredRecruiters.length,
      });

      return apiSuccess(filteredRecruiters, context.request);
    }

    if (action === 'get-current-recruiter') {
      const { email } = body;
      const requested = String(email || user?.email || '').trim().toLowerCase();
      if (!requested) return apiError(400, 'VALIDATION_ERROR', 'email required', context.request);

      // 🔒 Same org-scoped email gate as get-recruiter-profile
      const allowed = await resolveAllowedEmails();
      if (!allowed) {
        return apiError(500, 'INTERNAL_ERROR', 'Failed to validate access scope', context.request);
      }
      if (!allowed.has(requested)) {
        return apiError(403, 'FORBIDDEN', 'You can only look up profiles within your organization', context.request);
      }

      const { data, error } = await supabase
        .from('recruiters')
        .select('id')
        .eq('email', requested)
        .maybeSingle();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'list-opportunities') {
      const {
        searchQuery,
        statusFilter,
        advancedFilters = {},
        currentPage = 1,
        itemsPerPage = 8,
      } = body;

      // 🔒 Query-injection hardening: the search term is embedded raw into a
      // PostgREST or() filter — strip or()-metacharacters and cap its length.
      const sanitizedSearch = String(searchQuery || '')
        .replace(/[\\(),%"']/g, '')
        .trim()
        .slice(0, 100);

      // 🔒 Order-injection hardening: only whitelisted sort fields/directions
      // reach the .order() call (unknown values fall back to safe defaults).
      const SORTABLE_FIELDS = [
        'title', 'job_title', 'department', 'location', 'posted_date',
        'applications_count', 'salary_range_min', 'salary_range_max', 'created_at', 'status',
      ];
      const rawSortField = String(body.sortField || '');
      const sortField = SORTABLE_FIELDS.includes(rawSortField) ? rawSortField : 'posted_date';
      const rawSortDirection = String(body.sortDirection || '');
      const sortDirection = rawSortDirection === 'asc' ? 'asc' : 'desc';

      // 🔒 SECURITY: Get organization_id from authenticated user
      const organizationId = await resolveOrgId();

      if (!organizationId) {
        return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      }

      let query = supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId); // 🔒 Filter by user's organization

      if (sanitizedSearch) {
        query = query.or(`title.ilike.%${sanitizedSearch}%,department.ilike.%${sanitizedSearch}%,location.ilike.%${sanitizedSearch}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (advancedFilters.status?.length > 0) query = query.in('status', advancedFilters.status);
      if (advancedFilters.departments?.length > 0) query = query.in('department', advancedFilters.departments);
      if (advancedFilters.locations?.length > 0) query = query.in('location', advancedFilters.locations);
      if (advancedFilters.employmentTypes?.length > 0) query = query.in('employment_type', advancedFilters.employmentTypes);
      if (advancedFilters.experienceLevels?.length > 0) query = query.in('experience_level', advancedFilters.experienceLevels);

      if (advancedFilters.salaryRange?.min) query = query.gte('salary_range_min', advancedFilters.salaryRange.min);
      if (advancedFilters.salaryRange?.max) query = query.lte('salary_range_max', advancedFilters.salaryRange.max);

      if (advancedFilters.applicationCountRange && advancedFilters.applicationCountRange !== 'all') {
        const rangeMap: Record<string, { min: number; max: number | null }> = {
          '0': { min: 0, max: 0 },
          '1-5': { min: 1, max: 5 },
          '6-20': { min: 6, max: 20 },
          '21-50': { min: 21, max: 50 },
          '50+': { min: 51, max: null },
        };
        const range = rangeMap[advancedFilters.applicationCountRange];
        if (range) {
          query = query.gte('applications_count', range.min);
          if (range.max !== null) query = query.lte('applications_count', range.max);
        }
      }

      if (advancedFilters.dateRange?.startDate) query = query.gte('posted_date', advancedFilters.dateRange.startDate);
      if (advancedFilters.dateRange?.endDate) query = query.lte('posted_date', advancedFilters.dateRange.endDate);

      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) return apiDbError(error, context.request);

      const transformed = (data || []).map((opp: any) => ({
        ...opp,
        job_title: opp.title || opp.job_title || '',
        requirements: opp.requirements || [],
        responsibilities: opp.responsibilities || [],
        benefits: opp.benefits || [],
        applications_count: opp.applications_count || 0,
        messages_count: opp.messages_count || 0,
        views_count: opp.views_count || 0,
        employment_type: opp.employment_type || 'Full-time',
        experience_level: opp.experience_level || 'Mid',
        status: opp.status || 'draft',
      }));

      return apiSuccess({ data: transformed, total: count }, context.request);
    }

    if (action === 'create-opportunity') {
      if(body.data?.learning_requirements!==undefined)body.data.learning_requirements=await validateLearningRequirements(supabase,context.env as any,body.data.learning_requirements);
      let orgId = (user as any)?.org_id || body.data?.organization_id;
      if (!orgId) {
        const { data: mem } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        orgId = mem?.organization_id;
      }

      // 🔒 Fail-closed (E2): a JWT-org-empty caller with no membership can no
      // longer attribute a posting to a foreign organization from the body.
      if (!orgId) {
        return apiError(400, 'VALIDATION_ERROR', 'organizationId is required', context.request);
      }

      // 🔒 Authority check: a non-JWT organization (client-named or resolved
      // from membership) requires verified access before use
      if ((user as any)?.org_id !== orgId) {
        const access = await verifyOrgAccess(supabase, user.sub, orgId, undefined);
        if (!access.allowed) {
          return access.error || apiError(403, 'FORBIDDEN', 'Access denied to this organization', context.request);
        }
      }

      if (orgId) {
        // 🔒 Fail-closed quota gate via the lightweight numeric-limit resolver:
        // an unresolvable plan or a disabled feature blocks publishing, and a
        // counting DB error is a 500 — never a silent over-quota insert.
        const { getNumericLimit } = await import('../../shared/lib/entitlement-service');
        const quota = await getNumericLimit(supabase, orgId, 'active_job_posts');
        if (!quota) {
          return apiError(402, 'QUOTA_EXCEEDED', 'Active job post limit is not configured for your plan. Please contact support.', context.request);
        }
        if (!quota.enabled) {
          return apiError(402, 'QUOTA_EXCEEDED', 'Active job posts are not included in your current plan. Please upgrade your plan to publish opportunities.', context.request);
        }
        const { count, error: countErr } = await supabase
          .from('opportunities')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .or('is_active.eq.true,status.eq.open');

        if (countErr) return apiDbError(countErr, context.request);
        if (typeof quota.limit === 'number' && (count ?? 0) >= quota.limit) {
          return apiError(
            402,
            'QUOTA_EXCEEDED',
            `Your current plan allows up to ${quota.limit} active job posts. You currently have ${count} active posts. Please upgrade your recruiter plan to publish more opportunities.`,
            context.request
          );
        }
      }

      const { data, error } = await supabase
        .from('opportunities')
        .insert({ ...body.data, organization_id: orgId, created_by: user.id, posted_date: new Date().toISOString() })
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'update-opportunity') {
      const { id, ...updates } = body;

      // 🔒 Ownership + authority check (H4): only the owning organization may modify a
      // posting; otherwise any authenticated user could edit or publish past the quota.
      const { data: existing, error: exErr } = await supabase
        .from('opportunities')
        .select('id, organization_id, created_by, status, is_active')
        .eq('id', id)
        .maybeSingle();
      if (exErr) return apiDbError(exErr, context.request);
      if (!existing) return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request);

      const orgId = await resolveOrgId();
      const owns = existing.organization_id ? existing.organization_id === orgId : existing.created_by === user.id;
      if (!owns) return apiError(403, 'FORBIDDEN', 'You do not have access to this opportunity', context.request);

      // 🔒 Mass-assignment hardening (r2 audit residual found in this legacy
      // alias): the unhardened spread previously let an authenticated caller
      // re-own a row to a foreign organization_id, fake authorship and spoof
      // counters, and bypass the quota via a fail-open entitlement check.
      // Whitelisted fields only; ownership keys and server-owned counters are
      // always dropped; visibility mirrors status exactly like
      // update-requisition/create-requisition do.
      const ALLOWED_OPPORTUNITY_UPDATE_FIELDS = new Set([
        'title', 'job_title', 'company_name', 'company_logo', 'department', 'location', 'mode',
        'employment_type', 'experience_level', 'experience_required', 'skills_required',
        'requirements', 'responsibilities', 'benefits', 'salary_range_min', 'salary_range_max',
        'deadline', 'status', 'stipend_or_salary', 'application_link', 'description', 'sector',
        'exposure_type', 'total_hours', 'duration_weeks', 'duration_days', 'schedule_note',
        'learning_requirements', 'learning_requirements_version',
        'what_youll_learn', 'what_youll_do',
      ]);
      const sanitizedUpdates: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates as Record<string, any>)) {
        if (ALLOWED_OPPORTUNITY_UPDATE_FIELDS.has(key)) sanitizedUpdates[key] = value;
      }
      if(sanitizedUpdates.learning_requirements!==undefined){
        if(!Number.isSafeInteger(sanitizedUpdates.learning_requirements_version)||sanitizedUpdates.learning_requirements_version<1)return apiError(400,'VALIDATION_ERROR','Provide the current learning requirements version before editing.',context.request);
        sanitizedUpdates.learning_requirements=await validateLearningRequirements(supabase,context.env as any,sanitizedUpdates.learning_requirements);
      }
      if (sanitizedUpdates.status !== undefined) {
        const nextStatus = String(sanitizedUpdates.status).trim().toLowerCase();
        if (!(ALLOWED_REQUISITION_STATUSES as readonly string[]).includes(nextStatus)) {
          return apiError(
            400,
            'VALIDATION_ERROR',
            `Invalid status '${sanitizedUpdates.status}'. Allowed values: ${ALLOWED_REQUISITION_STATUSES.join(', ')}`,
            context.request
          );
        }
        sanitizedUpdates.status = nextStatus;
        // 🔒 Server-owned visibility: mirrors the enforced status transition.
        sanitizedUpdates.is_active = sanitizedUpdates.status === 'open';
      }

      // 🔒 Publishing a draft must respect the active_job_posts plan quota
      // (fail-CLOSED parity with update-requisition above: the old
      // checkEntitlement-based branch silently continued on entitlement or
      // counting errors — an unresolvable plan could not be distinguished from
      // "allowed",which is a quota bypass).
      const currentlyVisible = existing.status === 'open' || existing.is_active === true;
      const becomesVisible = !currentlyVisible && (sanitizedUpdates.status === 'open' || sanitizedUpdates.is_active === true);
      if (becomesVisible && existing.organization_id) {
        const { getNumericLimit } = await import('../../shared/lib/entitlement-service');
        const quota = await getNumericLimit(supabase, existing.organization_id, 'active_job_posts');
        if (!quota) {
          return apiError(402, 'QUOTA_EXCEEDED', 'Active job post limit is not configured for your plan. Please contact support.', context.request);
        }
        if (!quota.enabled) {
          return apiError(402, 'QUOTA_EXCEEDED', 'Active job posts are not included in your current plan. Please upgrade your plan to publish opportunities.', context.request);
        }
        const { count, error: countErr } = await supabase
          .from('opportunities')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', existing.organization_id)
          .neq('id', existing.id)
          .or('is_active.eq.true,status.eq.open');
        if (countErr) return apiDbError(countErr, context.request);
        if (typeof quota.limit === 'number' && (count ?? 0) >= quota.limit) {
          return apiError(
            402,
            'QUOTA_EXCEEDED',
            `Your current plan allows up to ${quota.limit} active job posts. You currently have ${count} active posts. Please upgrade your recruiter plan to publish more opportunities.`,
            context.request
          );
        }
      }

      const { data, error } = await supabase
        .from('opportunities')
        .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'delete-opportunity') {
      const { id } = body;

      // 🔒 Ownership check: only the owning organization (or author) may delete
      const { data: existing, error: exErr } = await supabase
        .from('opportunities')
        .select('id, organization_id, created_by')
        .eq('id', id)
        .maybeSingle();
      if (exErr) return apiDbError(exErr, context.request);
      if (!existing) return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request);

      const orgId = await resolveOrgId();
      const owns = existing.organization_id ? existing.organization_id === orgId : existing.created_by === user.id;
      if (!owns) return apiError(403, 'FORBIDDEN', 'You do not have access to this opportunity', context.request);

      const { error } = await supabase.from('opportunities').delete().eq('id', existing.id);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }

    if (action === 'list-applications') {
      const { opportunityId } = body;
      if (!opportunityId) return apiError(400, 'VALIDATION_ERROR', 'Missing opportunityId', context.request);

      // 🔒 IDOR fix: applications (and the learner PII they carry) may only be
      // listed for opportunities owned by the caller's organization.
      const { data: opp, error: oppErr } = await supabase
        .from('opportunities')
        .select('id, organization_id, created_by')
        .eq('id', opportunityId)
        .maybeSingle();
      if (oppErr) return apiDbError(oppErr, context.request);
      if (!opp) return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request);
      const orgId = await resolveOrgId();
      const owns = opp.organization_id ? opp.organization_id === orgId : opp.created_by === user.id;
      if (!owns) return apiError(403, 'FORBIDDEN', 'You do not have access to this opportunity', context.request);

      const { data, error } = await supabase
        .from('applied_jobs')
        .select(`
        id,
        application_status,
        applied_at,
        viewed_at,
        interview_scheduled_at,
        updated_at,
        learners (
          ${LEARNER_DIRECT_COLS}
        )
      `)
        .eq('opportunity_id', opportunityId)
        .order('applied_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      // `learners.profile` may not exist on drifted local DBs — compose it from
      // the verified flat columns so the FE contract holds either way.
      return apiSuccess(injectComposedProfiles(data || []), context.request);
    }

    if (action === 'fetch-shortlist-tags') {
      const { data, error } = await supabase
        .from('shortlists')
        .select('tags')
        .not('tags', 'is', null);
      if (error) return apiDbError(error, context.request);
      const allTags = [...new Set((data || []).flatMap((r: any) => r.tags || []))].sort();
      return apiSuccess(allTags, context.request);
    }

    if (action === 'fetch-shortlist-creators') {
      const { data, error } = await supabase
        .from('shortlists')
        .select('created_by')
        .not('created_by', 'is', null);
      if (error) return apiDbError(error, context.request);
      const creators = [...new Set((data || []).map((r: any) => r.created_by))].sort();
      return apiSuccess(creators, context.request);
    }

    if (action === 'fetch-departments') {
      const { data, error } = await supabase
        .from('opportunities')
        .select('department')
        .not('department', 'is', null);
      if (error) return apiDbError(error, context.request);
      const departments = [...new Set((data || []).map((r: any) => r.department))].sort();
      return apiSuccess(departments, context.request);
    }

    if (action === 'fetch-locations') {
      const { data, error } = await supabase
        .from('opportunities')
        .select('location')
        .not('location', 'is', null);
      if (error) return apiDbError(error, context.request);
      const locations = [...new Set((data || []).map((r: any) => r.location))].sort();
      return apiSuccess(locations, context.request);
    }

    if (action === 'import-requisitions') {
      const { rows } = body;

      // 🔒 SECURITY: organization_id resolved from the authenticated user
      const organizationId = await resolveOrgId();

      if (!organizationId) {
        console.error('[recruiter/actions] import-requisitions: organizationId not found', { userId: user.id });
        return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      }

      // 🔒 recruiter_email → recruiter_id mapping is scoped to THIS org's
      // members (previously a global email match could attribute imports to
      // recruiters of a foreign organization).
      const recruiterEmails = [...new Set(((rows || []) as any[]).map((r) => r.recruiter_email).filter(Boolean))];
      let recruiterMap: Record<string, string> = {};
      if (recruiterEmails.length) {
        const memberUserIds = await getOrgMemberUserIds(supabase, organizationId);
        if (memberUserIds.length) {
          const { data: recruiters, error: recError } = await supabase
            .from('recruiters')
            .select('id, email')
            .in('user_id', memberUserIds)
            .in('email', recruiterEmails);
          if (recError) return apiDbError(recError, context.request);
          for (const r of (recruiters || [])) {
            recruiterMap[r.email] = r.id;
          }
        }
      }

      // 🔒 Quota (L fix, fail-closed): imported requisitions can open job posts
      // too, so the active_job_posts limit applies. The pre-existing visible
      // count is fetched ONCE — a counting DB error aborts the whole import
      // (it must never silently exceed the plan). Remaining open slots shrink
      // with every inserted open row; rows beyond the budget are recorded as
      // failures instead of silently exceeding.
      const { getNumericLimit } = await import('../../shared/lib/entitlement-service');
      const quota = await getNumericLimit(supabase, organizationId, 'active_job_posts');
      const { count: preExistingOpen, error: quotaCountErr } = await supabase
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .or('is_active.eq.true,status.eq.open');
      if (quotaCountErr) return apiDbError(quotaCountErr, context.request);

      let openBudget = quota && quota.enabled && typeof quota.limit === 'number'
        ? Math.max(0, quota.limit - (preExistingOpen ?? 0))
        : 0; // fail-closed when unresolvable/disabled

      let success = 0;
      let failed = 0;
      const openInsertedRows: any[] = [];
      const errors: Array<{ row: number; error: string }> = [];
      for (let i = 0; i < (rows || []).length; i++) {
        const row = rows[i];
        const normalizedStatus = String(row.status || '').trim().toLowerCase();
        const rowOpens = normalizedStatus === 'open';
        const safeStatus = (ALLOWED_REQUISITION_STATUSES as readonly string[]).includes(normalizedStatus)
          ? normalizedStatus
          : 'draft';
        if (rowOpens && openBudget <= 0) {
          failed++;
          errors.push({ row: i, error: 'QUOTA_EXCEEDED: active job post limit reached' });
          continue;
        }
        try {
          const { data: inserted, error: insError } = await supabase.from('opportunities').insert({
            title: row.job_title || row.title,
            job_title: row.job_title,
            company_name: row.company_name || 'Not Specified',
            company_logo: null,
            department: row.department,
            location: row.location,
            mode: row.mode || null,
            employment_type: row.employment_type,
            experience_level: row.experience_level,
            experience_required: row.experience_required,
            salary_range_min: row.salary_range_min ? Number(row.salary_range_min) : null,
            salary_range_max: row.salary_range_max ? Number(row.salary_range_max) : null,
            description: row.description || '',
            requirements: row.requirements || null,
            responsibilities: row.responsibilities || null,
            skills_required: row.skills_required || null,
            benefits: row.benefits || null,
            deadline: row.deadline ? new Date(row.deadline).toISOString() : null,
            // 🔒 Server-owned counters: never trust an imported count value
            applications_count: 0,
            messages_count: 0,
            views_count: 0,
            posted_date: row.posted_date || new Date().toISOString(),
            status: safeStatus,
            organization_id: organizationId, // 🔒 Set organization_id from context
            created_by: user.id, // 🔒 Force server-side authorship
            is_active: rowOpens,
            recruiter_id: row.recruiter_email ? recruiterMap[row.recruiter_email] : null,
          })
            .select('id, title, job_title, company_name, location, salary_range_min, salary_range_max, is_active');
          // 🔒 Error masking: no raw PG/PostgREST text reaches the client
          if (insError) {
            console.error('[recruiter/actions] import-requisitions row insert failed:', { code: insError.code });
            failed++;
            errors.push({ row: i, error: `Row ${i + 1}: invalid data` });
          } else if (inserted && inserted.length > 0) {
            if (rowOpens && openBudget > 0) openBudget--;
            if (rowOpens) openInsertedRows.push(inserted[0]);
            success++;
          } else {
            failed++;
            errors.push({ row: i, error: `Row ${i + 1}: invalid data` });
          }
        } catch (e: any) {
          failed++;
          errors.push({ row: i, error: `Row ${i + 1}: invalid data` });
        }
      }

      // Notify learners about the freshly OPENED rows (fail-soft by design —
      // the helper never throws, and each notification runs after its row
      // insert already succeeded).
      for (const insertedRow of openInsertedRows) {
        await notifyLearnersOfNewOpportunity(supabase, insertedRow);
      }

      return apiSuccess({ success, failed, errors }, context.request);
    }

    if (action === 'get-opportunities-skills') {
      const { opportunityIds } = body;
      if (!opportunityIds || !Array.isArray(opportunityIds)) return apiError(400, 'VALIDATION_ERROR', 'Missing or invalid opportunityIds', context.request);

      const { data, error } = await supabase
        .from('opportunities')
        .select('id, skills_required')
        .in('id', opportunityIds);

      if (error) return apiDbError(error, context.request);
      return apiSuccess(data || [], context.request);
    }

    if (action === 'get-learner-info') {
      const { learnerId } = body;
      if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request);

      const orgId = await resolveOrgId();
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'organizationId required', context.request);

      // C4: alias-resolution + unlock gate — this endpoint returned raw
      // email/contact for ANY learnerId, defeating the list-learners masking
      // one HTTP call away. Contact details require an unlock row.
      const { data: canonical, error: candErr } = await resolveCanonicalCandidate(String(learnerId));
      if (candErr) return apiDbError(candErr, context.request);
      if (!canonical) return apiSuccess(null, context.request);

      const { data: unlocked, error: unlockErr } = await supabase
        .from('candidate_contact_unlocks')
        .select('id')
        .eq('organization_id', orgId)
        .eq('candidate_id', canonical.id)
        .maybeSingle();
      if (unlockErr && unlockErr.code !== 'PGRST116') return apiDbError(unlockErr, context.request);

      if (unlocked) {
        return apiSuccess({ id: canonical.id, name: canonical.name, email: canonical.email, contact_number: canonical.contact_number, unlocked: true }, context.request);
      }
      // Contact withheld until unlocked; name/presence still resolvable.
      return apiSuccess({ id: canonical.id, name: canonical.name, email: null, contact_number: null, unlocked: false }, context.request);
    }

    if (action === 'get-requisition-permissions') {
      const orgId = await resolveOrgId();
      if (!orgId) return apiError(403, 'FORBIDDEN', 'No active organization', context.request);
      const roles = await getUserRecruitmentRoles(supabase, user.id, orgId);
      return apiSuccess({
        create: roles.some(role => role.can_create_jobs),
        edit: roles.some(role => role.can_edit_jobs),
        delete: roles.some(role => role.can_delete_jobs),
        manageCandidates: roles.some(role => role.can_manage_candidates),
      }, context.request);
    }

    if (action === 'create-requisition') {
      const parsed = createRequisitionSchema.safeParse(body.requisitionData);
      if (!parsed.success) return apiError(400, 'VALIDATION_ERROR', parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '), context.request);
      const requisitionData = parsed.data;
      if (requisitionData.learning_requirements !== undefined) requisitionData.learning_requirements = await validateLearningRequirements(supabase, context.env as any, requisitionData.learning_requirements);
      if (!validSalaryRange(requisitionData)) return apiError(400, 'VALIDATION_ERROR', 'Maximum salary must be greater than or equal to minimum salary', context.request);

      // 🔒 SECURITY: Get organization_id from authenticated user
      const organizationId = await resolveOrgId();

      if (!organizationId) {
        console.error('[recruiter/actions] create-requisition: organizationId not found', { userId: user.id });
        return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      }

      const access = await verifyOrgAccess(supabase, user.id, organizationId, PERMISSIONS.CREATE_JOBS);
      if (!access.allowed) return apiError(403, 'FORBIDDEN', 'You do not have permission to create requisitions', context.request);
      if (requisitionData.recruiter_id) {
        const valid = await validateAssignee(requisitionData.recruiter_id, organizationId);
        if (valid !== true) return valid;
      }

      // 🔒 Status whitelist (server-enforced, superset of the live DB enum)
      const requestedStatus = String(requisitionData.status || 'draft').trim().toLowerCase();
      if (!(ALLOWED_REQUISITION_STATUSES as readonly string[]).includes(requestedStatus)) {
        return apiError(
          400,
          'VALIDATION_ERROR',
          `Invalid status '${requisitionData.status}'. Allowed values: ${ALLOWED_REQUISITION_STATUSES.join(', ')}`,
          context.request
        );
      }

      // 🔒 Fail-closed quota gate (parity with create-opportunity; this was a
      // bypass alias). Publishing an active post must respect active_job_posts:
      // unresolvable/disabled entitlements are 402, a counting DB error is a
      // 500 and NEVER proceeds.
      if (requestedStatus === 'open') {
        const { getNumericLimit } = await import('../../shared/lib/entitlement-service');
        const quota = await getNumericLimit(supabase, organizationId, 'active_job_posts');
        if (!quota) {
          return apiError(402, 'QUOTA_EXCEEDED', 'Active job post limit is not configured for your plan. Please contact support.', context.request);
        }
        if (!quota.enabled) {
          return apiError(402, 'QUOTA_EXCEEDED', 'Active job posts are not included in your current plan. Please upgrade your plan to publish opportunities.', context.request);
        }
        const { count, error: countErr } = await supabase
          .from('opportunities')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .or('is_active.eq.true,status.eq.open');
        if (countErr) return apiDbError(countErr, context.request);
        if (typeof quota.limit === 'number' && (count ?? 0) >= quota.limit) {
          return apiError(
            402,
            'QUOTA_EXCEEDED',
            `Your current plan allows up to ${quota.limit} active job posts. You currently have ${count} active posts. Please upgrade your recruiter plan to publish more opportunities.`,
            context.request
          );
        }
      }

      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          ...requisitionData,
          title: requisitionData.job_title,
          status: requestedStatus,
          // 🔒 Server-forced fields: visibility mirrors the status (never a
          // client-supplied is_active), authorship and counters are server-owned
          is_active: requestedStatus === 'open',
          created_by: user.id,
          applications_count: 0,
          messages_count: 0,
          views_count: 0,
          organization_id: organizationId, // 🔒 Set organization_id from context
          posted_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return apiDbError(error, context.request);
      await notifyLearnersOfNewOpportunity(supabase, data);
      return apiSuccess(data || {}, context.request);
    }

    if (action === 'update-requisition') {
      // Shape contract: the request body is { action, id, updates:{...} }.
      // (The old destructure `const { id, ...updates } = body` nested the real
      // update keys under a top-level `updates` key, so EVERY edit failed
      // downstream with PGRST204.)
      const { id, updates } = body;
      if (!id || !updates || typeof updates !== 'object') return apiError(400, 'VALIDATION_ERROR', 'Missing id or updates', context.request);

      const parsed = updateRequisitionSchema.safeParse(updates);
      if (!parsed.success) return apiError(400, 'VALIDATION_ERROR', parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '), context.request);
      const sanitizedUpdates: Record<string, any> = parsed.data;
      if (sanitizedUpdates.learning_requirements !== undefined) sanitizedUpdates.learning_requirements = await validateLearningRequirements(supabase, context.env as any, sanitizedUpdates.learning_requirements);
      if (sanitizedUpdates.job_title !== undefined) sanitizedUpdates.title = sanitizedUpdates.job_title;
      if (Object.keys(sanitizedUpdates).length === 0) {
        return apiError(400, 'VALIDATION_ERROR', 'No updatable fields provided', context.request);
      }

      // 🔒 Status whitelist
      if (sanitizedUpdates.status !== undefined) {
        const nextStatus = String(sanitizedUpdates.status).trim().toLowerCase();
        if (!(ALLOWED_REQUISITION_STATUSES as readonly string[]).includes(nextStatus)) {
          return apiError(
            400,
            'VALIDATION_ERROR',
            `Invalid status '${sanitizedUpdates.status}'. Allowed values: ${ALLOWED_REQUISITION_STATUSES.join(', ')}`,
            context.request
          );
        }
        sanitizedUpdates.status = nextStatus;
        // 🔒 Server-owned visibility (E2 parity with create-requisition):
        // is_active always mirrors the enforced status transition —
        // `is_active` was removed from the whitelist above so visibility has a
        // single authoritative source. This closes a consistency hole where a
        // raw API consumer could publish status='open' while the row stayed
        // hidden (status was quota-gated, is_active wasn't).
        sanitizedUpdates.is_active = sanitizedUpdates.status === 'open';
      }

      // 🔒 Never allow the update payload to re-own or re-author the row
      delete sanitizedUpdates.organization_id;
      delete sanitizedUpdates.created_by;
      delete sanitizedUpdates.id;
      delete sanitizedUpdates.created_at;

      // 🔒 Ownership check via JWT-resolved org. (context.data.organizationId was
      // never populated by withAuth, so the old eq.undefined filter always failed.)
      const { data: existing, error: exErr } = await supabase
        .from('opportunities')
        .select('id, organization_id, created_by, status, is_active, salary_range_min, salary_range_max, recruiter_id')
        .eq('id', id)
        .maybeSingle();
      if (exErr) return apiDbError(exErr, context.request);
      if (!existing) return apiError(404, 'NOT_FOUND', 'Requisition not found', context.request);

      const orgId = await resolveOrgId();
      const owns = existing.organization_id ? existing.organization_id === orgId : existing.created_by === user.id;
      if (!owns) return apiError(403, 'FORBIDDEN', 'You do not have access to this requisition', context.request);

      if (existing.organization_id) {
        const access = await verifyOrgAccess(supabase, user.id, existing.organization_id, PERMISSIONS.EDIT_JOBS);
        if (!access.allowed) return apiError(403, 'FORBIDDEN', 'You do not have permission to edit requisitions', context.request);
      }
      if (!validSalaryRange({ ...existing, ...sanitizedUpdates })) return apiError(400, 'VALIDATION_ERROR', 'Maximum salary must be greater than or equal to minimum salary', context.request);
      if (sanitizedUpdates.recruiter_id && sanitizedUpdates.recruiter_id !== existing.recruiter_id) {
        if (!orgId) return apiError(403, 'FORBIDDEN', 'No active organization for recruiter assignment', context.request);
        const valid = await validateAssignee(sanitizedUpdates.recruiter_id, orgId);
        if (valid !== true) return valid;
      }

      // 🔒 Publishing a draft must respect the active_job_posts plan quota
      // (parity with update-opportunity) — fail-CLOSED via the lightweight
      // resolver: unresolvable/disabled entitlements are 402, a counting DB
      // error is a 500 and never proceeds to the update.
      const currentlyVisible = existing.status === 'open' || existing.is_active === true;
      const becomesVisible = !currentlyVisible && (sanitizedUpdates.status === 'open' || sanitizedUpdates.is_active === true);
      if (becomesVisible && existing.organization_id) {
        const { getNumericLimit } = await import('../../shared/lib/entitlement-service');
        const quota = await getNumericLimit(supabase, existing.organization_id, 'active_job_posts');
        if (!quota) {
          return apiError(402, 'QUOTA_EXCEEDED', 'Active job post limit is not configured for your plan. Please contact support.', context.request);
        }
        if (!quota.enabled) {
          return apiError(402, 'QUOTA_EXCEEDED', 'Active job posts are not included in your current plan. Please upgrade your plan to publish opportunities.', context.request);
        }
        const { count, error: countErr } = await supabase
          .from('opportunities')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', existing.organization_id)
          .neq('id', existing.id)
          .or('is_active.eq.true,status.eq.open');
        if (countErr) return apiDbError(countErr, context.request);
        if (typeof quota.limit === 'number' && (count ?? 0) >= quota.limit) {
          return apiError(
            402,
            'QUOTA_EXCEEDED',
            `Your current plan allows up to ${quota.limit} active job posts. You currently have ${count} active posts. Please upgrade your recruiter plan to publish more opportunities.`,
            context.request
          );
        }
      }

      const { data, error } = await supabase
        .from('opportunities')
        .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return apiDbError(error, context.request);
      if (!data) return apiError(404, 'NOT_FOUND', 'Requisition not found or access denied', context.request);
      return apiSuccess(data || {}, context.request);
    }

    if (action === 'delete-requisition') {
      const { id } = body;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request);

      // 🔒 Ownership check: only the owning organization (or author) may delete
      const { data: existing, error: exErr } = await supabase
        .from('opportunities')
        .select('id, organization_id, created_by')
        .eq('id', id)
        .maybeSingle();
      if (exErr) return apiDbError(exErr, context.request);
      if (!existing) return apiError(404, 'NOT_FOUND', 'Requisition not found', context.request);

      const orgId = await resolveOrgId();
      const owns = existing.organization_id ? existing.organization_id === orgId : existing.created_by === user.id;
      if (!owns) return apiError(403, 'FORBIDDEN', 'You do not have access to this requisition', context.request);

      if (existing.organization_id) {
        const access = await verifyOrgAccess(supabase, user.id, existing.organization_id, PERMISSIONS.DELETE_JOBS);
        if (!access.allowed) return apiError(403, 'FORBIDDEN', 'You do not have permission to delete requisitions', context.request);
      }

      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', existing.id);

      if (error?.code === '23503') return apiError(409, 'REQUISITION_IN_USE', 'This requisition has linked applications or hiring records. Close the opening instead to preserve its history.', context.request);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true }, context.request);
    }

    if (action === 'review-application') {
      const parsed = reviewApplicationSchema.safeParse(body);
      if (!parsed.success) return apiError(400, 'VALIDATION_ERROR', parsed.error.issues.map(issue => issue.message).join('; '), context.request);
      const input = parsed.data;
      const orgId = await resolveOrgId();
      if (!orgId) return apiError(403, 'FORBIDDEN', 'No active organization', context.request);
      const access = await verifyOrgAccess(supabase, user.id, orgId, PERMISSIONS.MANAGE_CANDIDATES);
      if (!access.allowed) return apiError(403, 'FORBIDDEN', 'You do not have permission to manage applications', context.request);
      const { data: opportunity, error: opportunityError } = await supabase.from('opportunities').select('id').eq('id', input.opportunityId).eq('organization_id', orgId).maybeSingle();
      if (opportunityError) return apiDbError(opportunityError, context.request);
      if (!opportunity) return apiError(404, 'NOT_FOUND', 'Requisition not found', context.request);
      const { data: application, error: fetchError } = await supabase.from('applied_jobs').select('id, application_status, updated_at, notes, viewed_at').eq('id', input.id).eq('opportunity_id', opportunity.id).maybeSingle();
      if (fetchError) return apiDbError(fetchError, context.request);
      if (!application) return apiError(404, 'NOT_FOUND', 'Application not found', context.request);
      if (application.application_status !== input.expectedStatus || application.updated_at !== input.expectedUpdatedAt) return apiError(409, 'APPLICATION_CHANGED', 'This application changed. Close the status editor and refresh applications before retrying.', context.request);
      const now = new Date().toISOString();
      const entry = `[${now}] ${input.expectedStatus} → ${input.status} by ${user.email || user.id}${input.note ? ': ' + input.note : ''}`;
      const updates = {
        application_status: input.status,
        updated_by: user.id,
        updated_at: now,
        notes: [application.notes, entry].filter(Boolean).join('\n'),
        ...(input.status === 'viewed' && !application.viewed_at ? { viewed_at: now } : {}),
      };
      const { data, error } = await supabase.from('applied_jobs').update(updates).eq('id', application.id).eq('opportunity_id', opportunity.id).eq('application_status', input.expectedStatus).eq('updated_at', application.updated_at).select('id, application_status, updated_at, notes, viewed_at').maybeSingle();
      if (error) return apiDbError(error, context.request);
      if (!data) return apiError(409, 'APPLICATION_CHANGED', 'This application changed. Close the status editor and refresh applications before retrying.', context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'get-applications-by-opportunity') {
      const { opportunityId } = body;
      if (!opportunityId) return apiError(400, 'VALIDATION_ERROR', 'Missing opportunityId', context.request);

      // 🔒 IDOR fix (same as list-applications): ownership required before
      // returning applicant PII.
      const { data: opp, error: oppErr } = await supabase
        .from('opportunities')
        .select('id, organization_id, created_by')
        .eq('id', opportunityId)
        .maybeSingle();
      if (oppErr) return apiDbError(oppErr, context.request);
      if (!opp) return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request);
      const orgId = await resolveOrgId();
      const owns = opp.organization_id ? opp.organization_id === orgId : opp.created_by === user.id;
      if (!owns) return apiError(403, 'FORBIDDEN', 'You do not have access to this opportunity', context.request);

      if (opp.organization_id) {
        const access = await verifyOrgAccess(supabase, user.id, opp.organization_id, PERMISSIONS.VIEW_CANDIDATES);
        if (!access.allowed) return apiError(403, 'FORBIDDEN', 'You do not have permission to view applications', context.request);
      }
      const { data, error } = await supabase
        .from('applied_jobs')
        .select(`
        id,
        learner_id,
        notes,
        application_status,
        applied_at,
        viewed_at,
        interview_scheduled_at,
        updated_at,
        learners (
          ${LEARNER_DIRECT_COLS}
        )
      `)
        .eq('opportunity_id', opportunityId)
        .order('applied_at', { ascending: false });

      if (error) return apiDbError(error, context.request);
      // `learners.profile` may not exist on drifted local DBs — compose it from
      // the verified flat columns so the FE contract holds either way.
      return apiSuccess(injectComposedProfiles(data || []), context.request);
    }

    if (action === 'get-quota-usage') {
      // Quota snapshot contract:
      //   { used_active_posts: number,
      //     limit_active_posts: number | null,
      //     credits: { [featureKey]: { allocated, consumed, remaining } } }
      // featureKeys: contact_unlocks, job_boost_credits, ai_credits, candidate_invites
      const CREDIT_FEATURE_KEYS = ['contact_unlocks', 'job_boost_credits', 'ai_credits', 'candidate_invites'] as const;

      const orgId = await resolveOrgId();
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'organizationId required', context.request);

      // Live active-post count (single cheap head-count, fail-closed on error)
      const { count, error: countErr } = await supabase
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .or('is_active.eq.true,status.eq.open');
      if (countErr) return apiDbError(countErr, context.request);

      // active_job_posts numeric limit from the entitlement manifest
      const { getTenantEntitlements } = await import('../../shared/lib/entitlement-service');
      const manifest = await getTenantEntitlements(supabase, orgId).catch((err: any) => {
        console.error('[actions] get-quota-usage: entitlement manifest failed:', err?.message || err);
        return null;
      });
      if (!manifest) {
        return apiError(500, 'INTERNAL_ERROR', 'Failed to resolve plan entitlements', context.request);
      }
      const limit_active_posts = manifest.features?.['active_job_posts']?.limit ?? null;

      // Metered credit balances (all scoped to the caller's org)
      const credits: Record<string, { allocated: number; consumed: number; remaining: number }> = {};
      for (const featureKey of CREDIT_FEATURE_KEYS) {
        const mapped = manifest.features?.[featureKey];
        if (mapped && mapped.feature_type === 'metered') {
          credits[featureKey] = {
            allocated: Number(mapped.allocated ?? 0),
            consumed: Number(mapped.consumed ?? 0),
            remaining: Number(mapped.remaining ?? 0),
          };
          continue;
        }
        // Feature absent from the manifest catalog: query the ledger RPC directly
        const { data: bal, error: balErr } = await supabase.rpc('get_credit_balance', {
          p_tenant_id: orgId,
          p_feature_key: featureKey,
        });
        if (balErr) {
          console.error('[actions] get-quota-usage: credit balance query failed:', { featureKey });
          credits[featureKey] = { allocated: 0, consumed: 0, remaining: 0 };
          continue;
        }
        const row = (Array.isArray(bal) ? bal[0] : bal) as { allocated?: number; consumed?: number; remaining?: number } | undefined;
        credits[featureKey] = {
          allocated: Number(row?.allocated ?? 0),
          consumed: Number(row?.consumed ?? 0),
          remaining: Number(row?.remaining ?? 0),
        };
      }

      return apiSuccess(
        { used_active_posts: count ?? 0, limit_active_posts, credits },
        context.request
      );
    }

    return apiError(400, 'BAD_REQUEST', `Unknown action: ${action}`, context.request);
  } catch (error: any) {
    if (error instanceof LearningError) return apiError(error.status,error.code,error.message,context.request);
    console.error(`[recruiter/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request);
  }
});
