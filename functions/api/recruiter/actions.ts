import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';
import { notifyLearnersOfNewOpportunity } from '../../lib/newOpportunityNotifications';
import { verifyOrgAccess } from '../../lib/permissions';

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

  const { action } = body;

  // Auth-derived tenant resolution (H1): the client-supplied organizationId must NOT be
  // trusted — the JWT org claim (or the user's active membership row) decides the tenant.
  const resolveOrgId = async (): Promise<string | null> => {
    if (user?.org_id) return user.org_id;
    const { data: mem, error: memErr } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (memErr) {
      console.error('[actions] Failed to resolve organization membership:', memErr);
      return null;
    }
    return mem?.organization_id ?? null;
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
      const { p_user_id, p_org_id, p_required_permission } = body;
      const targetUserId = p_user_id || user.id;

      const { data, error } = await supabase.rpc('has_recruitment_permission', {
        p_user_id: targetUserId,
        p_org_id,
        p_required_permission,
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
      const { data, error } = await supabase
        .from('recruiters')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'list-interviews') {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .order('date', { ascending: true });
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'update-interview') {
      const { id, ...updates } = body;

      // 🔒 Ownership: only the creator may edit an interview record
      const { data: existing, error: exErr } = await supabase
        .from('interviews')
        .select('id, created_by')
        .eq('id', id)
        .maybeSingle();
      if (exErr) return apiDbError(exErr, context.request);
      if (!existing) return apiError(404, 'NOT_FOUND', 'Interview not found', context.request);
      if (existing.created_by && existing.created_by !== user.id) {
        return apiError(403, 'FORBIDDEN', 'You do not have access to this interview', context.request);
      }

      delete updates.created_by; // never allow re-authoring via the payload
      const { data, error } = await supabase
        .from('interviews')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
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
      const organizationId = user?.org_id;

      console.log('[recruiter/actions] list-recruiters called:', {
        userId: user.id,
        userEmail: user.email,
        organizationId,
        hasOrgId: !!organizationId
      });

      if (!organizationId) {
        console.error('[recruiter/actions] list-recruiters: organizationId not found', {
          userId: user.id,
          userOrgId: user?.org_id
        });
        return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      }

      // Step 1: Get all active recruiters
      const { data: allRecruiters, error: recruitersError } = await supabase
        .from('recruiters')
        .select('id, name, email, user_id')
        .eq('isactive', true)
        .order('name');

      if (recruitersError) {
        console.error('[recruiter/actions] ❌ Error fetching recruiters:', {
          error: recruitersError,
          code: recruitersError.code,
          message: recruitersError.message
        });
        return apiDbError(recruitersError, context.request);
      }

      console.log('[recruiter/actions] ✓ Fetched all recruiters from DB:', {
        count: allRecruiters?.length || 0,
        recruiters: allRecruiters?.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          user_id: r.user_id
        }))
      });

      // If no recruiters at all, return empty
      if (!allRecruiters || allRecruiters.length === 0) {
        console.log('[recruiter/actions] No recruiters found in database');
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
        console.error('[recruiter/actions] ❌ Error fetching organization members:', {
          error: membersError,
          code: membersError.code,
          message: membersError.message,
          organizationId
        });
        return apiDbError(membersError, context.request);
      }

      console.log('[recruiter/actions] ✓ Organization members found:', {
        count: orgMembers?.length || 0,
        members: orgMembers?.map((m: any) => ({
          userId: m.user_id,
          email: m.users?.email,
          role: m.role,
          status: m.status
        }))
      });

      // Step 3: Create a set of user_ids that belong to this organization
      const orgUserIds = new Set((orgMembers || []).map((m: any) => m.user_id));

      console.log('[recruiter/actions] Organization user IDs:', {
        userIds: Array.from(orgUserIds),
        count: orgUserIds.size
      });

      // Step 4: Filter recruiters - match by user_id (direct match)
      const filteredRecruiters = (allRecruiters || []).filter(r => {
        const matches = r.user_id && orgUserIds.has(r.user_id);
        console.log('[recruiter/actions] Checking recruiter:', {
          recruiterId: r.id,
          recruiterUserId: r.user_id,
          recruiterEmail: r.email,
          inOrg: matches
        });
        return matches;
      });

      console.log('[recruiter/actions] ✅ Final filtered recruiters:', {
        totalRecruiters: allRecruiters?.length || 0,
        orgMembers: orgUserIds.size,
        filteredCount: filteredRecruiters.length,
        filteredRecruiters: filteredRecruiters.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          user_id: r.user_id
        }))
      });

      return apiSuccess(filteredRecruiters, context.request);
    }

    if (action === 'get-current-recruiter') {
      const { email } = body;
      const { data, error } = await supabase
        .from('recruiters')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
    }

    if (action === 'list-opportunities') {
      const {
        searchQuery,
        statusFilter,
        advancedFilters = {},
        sortField = 'created_at',
        sortDirection = 'desc',
        currentPage = 1,
        itemsPerPage = 8,
      } = body;

      // 🔒 SECURITY: Get organization_id from authenticated user
      const organizationId = user?.org_id;

      if (!organizationId) {
        return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      }

      let query = supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId); // 🔒 Filter by user's organization

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,department.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
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
        const { checkEntitlement } = await import('../../shared/lib/entitlement-service');
        const entitlement = await checkEntitlement(supabase, orgId, 'active_job_posts');
        if (entitlement && typeof entitlement.limit === 'number') {
          const { count, error: countErr } = await supabase
            .from('opportunities')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .or('is_active.eq.true,status.eq.open');

          if (!countErr && typeof count === 'number' && count >= entitlement.limit) {
            return apiError(
              402,
              'QUOTA_EXCEEDED',
              `Your current plan allows up to ${entitlement.limit} active job posts. You currently have ${count} active posts. Please upgrade your recruiter plan to publish more opportunities.`,
              context.request
            );
          }
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

      // Publishing a draft must respect the active_job_posts plan quota (H4 bypass fix)
      const currentlyVisible = existing.status === 'open' || existing.is_active === true;
      const becomesVisible = !currentlyVisible && (updates.status === 'open' || updates.is_active === true);
      if (becomesVisible && existing.organization_id) {
        const { checkEntitlement } = await import('../../shared/lib/entitlement-service');
        const entitlement = await checkEntitlement(supabase, existing.organization_id, 'active_job_posts');
        if (entitlement && typeof entitlement.limit === 'number') {
          const { count, error: countErr } = await supabase
            .from('opportunities')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', existing.organization_id)
            .neq('id', existing.id)
            .or('is_active.eq.true,status.eq.open');
          if (!countErr && typeof count === 'number' && count >= entitlement.limit) {
            return apiError(
              402,
              'QUOTA_EXCEEDED',
              `Your current plan allows up to ${entitlement.limit} active job posts. You currently have ${count} active posts. Please upgrade your recruiter plan to publish more opportunities.`,
              context.request
            );
          }
        }
      }

      const { data, error } = await supabase
        .from('opportunities')
        .update({ ...updates, updated_at: new Date().toISOString() })
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
          id,
          email,
          profile
        )
      `)
        .eq('opportunity_id', opportunityId)
        .order('applied_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess(data, context.request);
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

      // 🔒 SECURITY: Get organization_id from authenticated user
      const organizationId = user?.org_id;

      if (!organizationId) {
        console.error('[recruiter/actions] import-requisitions: organizationId not found', {
          userId: user.id,
          userOrgId: user?.org_id
        });
        return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      }

      const recruiterEmails = [...new Set((rows || []).map((r: any) => r.recruiter_email).filter(Boolean))];
      let recruiterMap: Record<string, string> = {};
      if (recruiterEmails.length) {
        const { data: recruiters, error: recError } = await supabase
          .from('recruiters')
          .select('id, email')
          .in('email', recruiterEmails);
        if (recError) return apiDbError(recError, context.request);
        for (const r of (recruiters || [])) {
          recruiterMap[r.email] = r.id;
        }
      }

      // 🔒 Quota (L fix): imported requisitions can open job posts too, so the
      // active_job_posts limit applies. Count the current visible posts once,
      // then stop granting visibility once the plan limit is reached — rows
      // beyond it are recorded as failures instead of silently exceeding.
      const { checkEntitlement } = await import('../../shared/lib/entitlement-service');
      const entitlement = await checkEntitlement(supabase, organizationId, 'active_job_posts');
      let openInserted = 0;
      let quotaLimit: number | null = null;
      if (entitlement && typeof entitlement.limit === 'number') {
        const { count, error: countErr } = await supabase
          .from('opportunities')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .or('is_active.eq.true,status.eq.open');
        if (!countErr && typeof count === 'number') {
          quotaLimit = entitlement.limit;
        }
      }

      let success = 0;
      let failed = 0;
      const errors: Array<{ row: number; error: string }> = [];
      for (let i = 0; i < (rows || []).length; i++) {
        const row = rows[i];
        const rowOpens = row.status === 'open';
        if (rowOpens && quotaLimit !== null && openInserted + 1 > quotaLimit) {
          failed++;
          errors.push({ row: i, error: 'QUOTA_EXCEEDED: active job post limit reached' });
          continue;
        }
        try {
          const { error: insError } = await supabase.from('opportunities').insert({
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
            applications_count: row.applications_count ? Number(row.applications_count) : 0,
            messages_count: 0,
            views_count: 0,
            posted_date: row.posted_date || new Date().toISOString(),
            status: row.status,
            organization_id: organizationId, // 🔒 Set organization_id from context
            created_by: user.id,
            is_active: row.status === 'open',
            recruiter_id: row.recruiter_email ? recruiterMap[row.recruiter_email] : null,
          });
          if (insError) {
            failed++;
            errors.push({ row: i, error: insError.message });
          } else {
            if (rowOpens) openInserted++;
            success++;
          }
        } catch (e: any) {
          failed++;
          errors.push({ row: i, error: e.message });
        }
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

    if (action === 'create-requisition') {
      const { requisitionData } = body;
      if (!requisitionData) return apiError(400, 'VALIDATION_ERROR', 'Missing requisitionData', context.request);

      // 🔒 SECURITY: Get organization_id from authenticated user
      const organizationId = user?.org_id;

      if (!organizationId) {
        console.error('[recruiter/actions] create-requisition: organizationId not found', {
          userId: user.id,
          userOrgId: user?.org_id
        });
        return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      }

      // 🔒 Publishing via create-requisition must respect active_job_posts
      // quota (parity with create-opportunity; this was a bypass alias).
      const becomesVisible = requisitionData.status === 'open' || requisitionData.is_active === true;
      if (becomesVisible) {
        const { checkEntitlement } = await import('../../shared/lib/entitlement-service');
        const entitlement = await checkEntitlement(supabase, organizationId, 'active_job_posts');
        if (entitlement && typeof entitlement.limit === 'number') {
          const { count, error: countErr } = await supabase
            .from('opportunities')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .or('is_active.eq.true,status.eq.open');
          if (!countErr && typeof count === 'number' && count >= entitlement.limit) {
            return apiError(
              402,
              'QUOTA_EXCEEDED',
              `Your current plan allows up to ${entitlement.limit} active job posts. You currently have ${count} active posts. Please upgrade your recruiter plan to publish more opportunities.`,
              context.request
            );
          }
        }
      }

      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          ...requisitionData,
          organization_id: organizationId, // 🔒 Set organization_id from context
          messages_count: 0,
          views_count: 0,
          posted_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return apiDbError(error, context.request);
      await notifyLearnersOfNewOpportunity(supabase, data);
      return apiSuccess(data || {}, context.request);
    }

    if (action === 'update-requisition') {
      const { id, ...updates } = body;
      if (!id || !updates || typeof updates !== 'object') return apiError(400, 'VALIDATION_ERROR', 'Missing id or updates', context.request);

      // 🔒 Never allow the update payload to re-own or re-author the row
      delete updates.organization_id;
      delete updates.created_by;
      delete updates.id;
      delete updates.created_at;

      // 🔒 Ownership check via JWT-resolved org. (context.data.organizationId was
      // never populated by withAuth, so the old eq.undefined filter always failed.)
      const { data: existing, error: exErr } = await supabase
        .from('opportunities')
        .select('id, organization_id, created_by, status, is_active')
        .eq('id', id)
        .maybeSingle();
      if (exErr) return apiDbError(exErr, context.request);
      if (!existing) return apiError(404, 'NOT_FOUND', 'Requisition not found', context.request);

      const orgId = await resolveOrgId();
      const owns = existing.organization_id ? existing.organization_id === orgId : existing.created_by === user.id;
      if (!owns) return apiError(403, 'FORBIDDEN', 'You do not have access to this requisition', context.request);

      // Publishing a draft must respect the active_job_posts plan quota (parity with update-opportunity)
      const currentlyVisible = existing.status === 'open' || existing.is_active === true;
      const becomesVisible = !currentlyVisible && (updates.status === 'open' || updates.is_active === true);
      if (becomesVisible && existing.organization_id) {
        const { checkEntitlement } = await import('../../shared/lib/entitlement-service');
        const entitlement = await checkEntitlement(supabase, existing.organization_id, 'active_job_posts');
        if (entitlement && typeof entitlement.limit === 'number') {
          const { count, error: countErr } = await supabase
            .from('opportunities')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', existing.organization_id)
            .neq('id', existing.id)
            .or('is_active.eq.true,status.eq.open');
          if (!countErr && typeof count === 'number' && count >= entitlement.limit) {
            return apiError(
              402,
              'QUOTA_EXCEEDED',
              `Your current plan allows up to ${entitlement.limit} active job posts. You currently have ${count} active posts. Please upgrade your recruiter plan to publish more opportunities.`,
              context.request
            );
          }
        }
      }

      const { data, error } = await supabase
        .from('opportunities')
        .update({ ...updates, updated_at: new Date().toISOString() })
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

      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', existing.id);

      if (error) return apiDbError(error, context.request);
      return apiSuccess({ success: true }, context.request);
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
          id,
          email,
          profile
        )
      `)
        .eq('opportunity_id', opportunityId)
        .order('applied_at', { ascending: false });

      if (error) return apiDbError(error, context.request);
      return apiSuccess(data || [], context.request);
    }

    return apiError(400, 'BAD_REQUEST', `Unknown action: ${action}`, context.request);
  } catch (error: any) {
    console.error(`[recruiter/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request);
  }
});
