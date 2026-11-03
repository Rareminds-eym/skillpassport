import {verifyOrgAccess,PERMISSIONS} from '../../lib/permissions';
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';
import { notifyLearnerOfPipelineChange } from '../../lib/pipelineNotifications';
import {
  getActiveOrgId,
  getOrgMemberUserIds,
  getOrgOwnedOpportunityIds,
} from '../../lib/org-ownership';

// ── GET allowlist / 405 guard ────────────────────────────────────────────────
// Mutating actions must NEVER be reachable via GET dispatch.
const MUTATING_ACTIONS = new Set([
  'add-candidate-to-pipeline', 'move-candidate-to-stage', 'reject-candidate',
  'update-next-action', 'update-candidate-rating', 'assign-candidate',
  'remove-candidate-from-pipeline', 'bulk-move-candidates',
  'bulk-reject-candidates', 'log-pipeline-activity',
]);

// ── Per-user sliding-window rate limit (notification abuse vector) ──────────
// log-pipeline-activity can fan out learner notifications; cap at 20/min/user.
//
// 🔶RESIDUAL: in-memory Map is best-effort per isolate — Cloudflare's distributed
// isolates do not share this state, so the effective limit is per-isolate, not
// global. Cross-isolate aggregation needs Durable Objects / a rate-limit binding.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_WINDOW = 20;
const rateLimitTimestamps = new Map<string, number[]>();

function allowPipelineNotificationRate(userId: string): boolean {
  const now = Date.now();
  const active = (rateLimitTimestamps.get(userId) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (active.length >= RATE_LIMIT_MAX_PER_WINDOW) {
    rateLimitTimestamps.set(userId, active);
    return false;
  }
  active.push(now);
  rateLimitTimestamps.set(userId, active);
  return true;
}

export const onRequest = async (context: any) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

async function handleAction(context: AuthenticatedContext, supabase: any, params: Record<string, any>): Promise<Response> {
  const { action } = params;

  if(MUTATING_ACTIONS.has(action)){const user=getContextUser(context);const orgId=await getActiveOrgId(supabase,user);if(!orgId||!(await verifyOrgAccess(supabase,user.id,orgId,PERMISSIONS.MANAGE_CANDIDATES)).allowed)return apiError(403,'FORBIDDEN','Candidate management permission is required',context.request);}
  switch (action) {

    case 'get-requisitions': {
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(403, 'FORBIDDEN', 'An active organization is required', context.request);
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_date', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ requisitions: data || [] }, context.request);
    }

    case 'get-requisition-by-id': {
      const id = params.id;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(403, 'FORBIDDEN', 'An active organization is required', context.request);
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .eq('organization_id', orgId)
        .eq('id', id)
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ requisition: data }, context.request);
    }

    case 'get-opportunity-by-id': {
      const id = params.id;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      // 🔒 ORG SCOPING: readable only when owned by the caller's org.
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) return apiDbError(error, context.request);
      if (!data) return apiError(404, 'NOT_FOUND', 'Opportunity not found', context.request);
      return apiSuccess({ opportunity: data }, context.request);
    }

    case 'get-requisitions-with-stats': {
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(403, 'FORBIDDEN', 'An active organization is required', context.request);
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_date', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ requisitions: data || [] }, context.request);
    }

    case 'get-pipeline-candidates': {
      // 🔒 ORG SCOPING fix: pipeline_candidates_detailed has no organization_id
      // column, so scope via the org-owned opportunity ids (deny-by-default —
      // no org or no owned opportunities ⇒ empty list, never an org dump).
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      const orgOppIds = orgId ? await getOrgOwnedOpportunityIds(supabase, orgId) : [];
      if (orgOppIds.length === 0) return apiSuccess({ candidates: [] }, context.request);
      const opportunityId = params.opportunity_id;
      if (opportunityId && !orgOppIds.includes(String(opportunityId))) {
        return apiSuccess({ candidates: [] }, context.request);
      }
      let query = supabase.from('pipeline_candidates_detailed').select('*').in('opportunity_id', orgOppIds);
      if (opportunityId) query = query.eq('opportunity_id', opportunityId);
      const { data, error } = await query.order('added_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ candidates: data || [] }, context.request);
    }

    case 'get-pipeline-candidates-by-stage': {
      const opportunityId = params.opportunity_id;
      const stage = params.stage;
      if (!opportunityId || !stage) return apiError(400, 'VALIDATION_ERROR', 'opportunity_id and stage required', context.request);
      // 🔒 ORG SCOPING: the opportunity must belong to the caller's org
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const orgOppIds = await getOrgOwnedOpportunityIds(supabase, orgId);
      if (!orgOppIds.includes(String(opportunityId))) {
        return apiError(403, 'FORBIDDEN', 'This opportunity does not belong to your organization', context.request);
      }
      const { data: pipelineCandidates, error: pcError } = await supabase
        .from('pipeline_candidates')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .eq('organization_id', orgId)
        .eq('stage', stage)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });
      if (pcError) return apiDbError(pcError, context.request);
      if (!pipelineCandidates || pipelineCandidates.length === 0) {
        return apiSuccess({ candidates: [] }, context.request);
      }
      const learnerIds = [...new Set(pipelineCandidates.map((pc: any) => pc.learner_id))];
      const { data: learners } = await supabase
        .from('learners')
        .select(`
          user_id, id, name, email, contact_number,
          college_school_name, university, branch_field, course_name, district_name,
          skills!skills_learner_id_fkey(id, name, enabled, approval_status)
        `)
        .in('id', learnerIds);
      const learnersMap = new Map();
      (learners || []).forEach((learner: any) => {
        const enabledSkills = Array.isArray(learner.skills)
          ? learner.skills.filter((s: any) => s.enabled).map((s: any) => s.name)
          : [];
        learnersMap.set(learner.id, {
          ...learner,
          dept: learner.branch_field || learner.course_name,
          college: learner.college_school_name || learner.university,
          location: learner.district_name,
          ai_score_overall: 0,
          skills: enabledSkills,
        });
      });
      const data = pipelineCandidates.map((candidate: any) => ({
        ...candidate,
        learners: learnersMap.get(candidate.learner_id) || null,
      }));
      return apiSuccess({ candidates: data }, context.request);
    }

    case 'get-pipeline-candidates-with-filters': {
      const opportunityId = params.opportunity_id;
      if (!opportunityId) return apiError(400, 'VALIDATION_ERROR', 'opportunity_id required', context.request);

      // 🔒 ORG SCOPING: opportunity ownership check + organization_id filter
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const orgOppIds = await getOrgOwnedOpportunityIds(supabase, orgId);
      if (!orgOppIds.includes(String(opportunityId))) {
        return apiError(403, 'FORBIDDEN', 'This opportunity does not belong to your organization', context.request);
      }

      const stagesRaw = params.stages;
      const sourcesRaw = params.sources;
      const nextActionTypesRaw = params.next_action_types;
      const hasNextAction = params.has_next_action;
      const assignedToRaw = params.assigned_to;
      const dateAddedStart = params.date_added_start;
      const dateAddedEnd = params.date_added_end;
      const lastUpdatedStart = params.last_updated_start;
      const lastUpdatedEnd = params.last_updated_end;
      const sortField = params.sort_field || 'updated_at';
      const sortDirection = params.sort_direction || 'desc';

      let query = supabase
        .from('pipeline_candidates')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .eq('organization_id', orgId)
        .eq('status', 'active');

      if (stagesRaw) {
        const stages = stagesRaw.split(',');
        if (stages.length > 0) query = query.in('stage', stages);
      }
      if (sourcesRaw) {
        const sources = sourcesRaw.split(',');
        if (sources.length > 0) query = query.in('source', sources);
      }
      if (nextActionTypesRaw) {
        const types = nextActionTypesRaw.split(',');
        if (types.length > 0) query = query.in('next_action', types);
      }
      if (hasNextAction === 'true') {
        query = query.not('next_action', 'is', null);
      } else if (hasNextAction === 'false') {
        query = query.is('next_action', null);
      }
      if (assignedToRaw) {
        const assignedTo = assignedToRaw.split(',');
        if (assignedTo.length > 0) query = query.in('assigned_to', assignedTo);
      }
      if (dateAddedStart) query = query.gte('added_at', dateAddedStart);
      if (dateAddedEnd) query = query.lte('added_at', dateAddedEnd);
      if (lastUpdatedStart) query = query.gte('updated_at', lastUpdatedStart);
      if (lastUpdatedEnd) query = query.lte('updated_at', lastUpdatedEnd);

      const ascending = sortDirection === 'asc';
      query = query.order(sortField, { ascending, nullsFirst: sortField === 'next_action_date' ? !ascending : undefined });

      const { data: pipelineCandidates, error } = await query;
      if (error) return apiDbError(error, context.request);

      if (!pipelineCandidates || pipelineCandidates.length === 0) {
        return apiSuccess({ candidates: [] }, context.request);
      }

      const learnerIds = [...new Set(pipelineCandidates.map((pc: any) => pc.learner_id))];
      const { data: learners } = await supabase
        .from('learners')
        .select(`
          user_id, id, name, email, contact_number,
          college_school_name, university, branch_field, course_name, district_name,
          skills!skills_learner_id_fkey(id, name, enabled, approval_status)
        `)
        .in('id', learnerIds);

      const learnersMap = new Map();
      (learners || []).forEach((learner: any) => {
        const enabledSkills = Array.isArray(learner.skills)
          ? learner.skills.filter((s: any) => s.enabled).map((s: any) => s.name)
          : [];
        learnersMap.set(learner.id, {
          ...learner,
          dept: learner.branch_field || learner.course_name,
          college: learner.college_school_name || learner.university,
          location: learner.district_name,
          ai_score_overall: 0,
          skills: enabledSkills,
        });
      });

      const data = pipelineCandidates.map((candidate: any) => ({
        ...candidate,
        learners: learnersMap.get(candidate.learner_id) || null,
      }));

      return apiSuccess({ candidates: data }, context.request);
    }

    case 'get-all-pipeline-candidates-by-stage': {
      // 🔒 ORG SCOPING: detailed view scoped to org-owned opportunities.
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      const orgOppIds = orgId ? await getOrgOwnedOpportunityIds(supabase, orgId) : [];
      if (orgOppIds.length === 0) return apiSuccess({ grouped: { sourced: [], screened: [], interview_1: [], interview_2: [], offer: [], hired: [] } }, context.request);
      const opportunityId = params.opportunity_id;
      if (opportunityId && !orgOppIds.includes(String(opportunityId))) {
        return apiSuccess({ grouped: { sourced: [], screened: [], interview_1: [], interview_2: [], offer: [], hired: [] } }, context.request);
      }
      let query = supabase.from('pipeline_candidates_detailed').select('*').in('opportunity_id', orgOppIds);
      if (opportunityId) query = query.eq('opportunity_id', opportunityId);
      const { data, error } = await query.order('added_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      const grouped: Record<string, any[]> = {
        sourced: [], screened: [], interview_1: [], interview_2: [], offer: [], hired: [],
      };
      (data || []).forEach((candidate: any) => {
        if (grouped[candidate.stage]) grouped[candidate.stage].push(candidate);
      });
      return apiSuccess({ grouped }, context.request);
    }

    case 'get-candidate-activities': {
      const candidateId = params.candidate_id;
      if (!candidateId) return apiError(400, 'VALIDATION_ERROR', 'candidate_id required', context.request);
      // 🔒 ORG SCOPING: the candidate row must belong to the caller's org before
      // its activity trail is exposed.
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const { data: candidate, error: candError } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('id', String(candidateId))
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();
      if (candError) return apiDbError(candError, context.request);
      if (!candidate) return apiError(404, 'NOT_FOUND', 'Candidate not found', context.request);
      const { data, error } = await supabase
        .from('pipeline_activities')
        .select('*')
        .eq('candidate_uuid', candidate.id)
        .order('created_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ activities: data || [] }, context.request);
    }

    case 'get-top-skills-in-demand': {
      const rawLimit = parseInt(params.limit || '5', 10);
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('skills_required, job_title, id')
        .eq('is_active', true)
        .not('skills_required', 'is', null);
      if (error) return apiDbError(error, context.request);
      const skillCounts: Record<string, number> = {};
      (opportunities || []).forEach((opp: any) => {
        const skillsData = opp.skills_required;
        if (!skillsData) return;
        let skills: string[] = [];
        if (Array.isArray(skillsData)) {
          skills = skillsData.filter((s: any) => s && typeof s === 'string');
        } else if (typeof skillsData === 'string') {
          const separators = [',', ';', '|', '\n'];
          let bestSplit = [skillsData];
          for (const sep of separators) {
            if (skillsData.includes(sep)) {
              const split = skillsData.split(sep);
              if (split.length > bestSplit.length) bestSplit = split;
            }
          }
          skills = bestSplit.map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        }
        skills.forEach(skill => {
          const normalized = skill.trim();
          if (normalized) skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
        });
      });
      const topSkills = Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count, percentage: Math.round((count / (opportunities?.length || 1)) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, rawLimit);
      return apiSuccess({ skills: topSkills }, context.request);
    }

    case 'get-skills-demand-analysis': {
      const rawLimit = parseInt(params.limit || '5', 10);
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('skills_required, job_title, id')
        .eq('is_active', true)
        .not('skills_required', 'is', null);
      if (error) return apiDbError(error, context.request);
      const skillCounts: Record<string, number> = {};
      (opportunities || []).forEach((opp: any) => {
        const skillsData = opp.skills_required;
        if (!skillsData) return;
        let skills: string[] = [];
        if (Array.isArray(skillsData)) {
          skills = skillsData.filter((s: any) => s && typeof s === 'string');
        } else if (typeof skillsData === 'string') {
          const separators = [',', ';', '|', '\n'];
          let bestSplit = [skillsData];
          for (const sep of separators) {
            if (skillsData.includes(sep)) {
              const split = skillsData.split(sep);
              if (split.length > bestSplit.length) bestSplit = split;
            }
          }
          skills = bestSplit.map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        }
        skills.forEach(skill => {
          const normalized = skill.trim();
          if (normalized) skillCounts[normalized] = (skillCounts[normalized] || 0) + 1;
        });
      });
      const topSkills = Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count, percentage: Math.round((count / (opportunities?.length || 1)) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, rawLimit);
      const { count: totalOpportunities } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      return apiSuccess({
        topSkills,
        totalOpportunities: totalOpportunities || 0,
        analysis: {
          mostDemandedSkill: topSkills[0]?.skill || null,
          averageDemand: topSkills.length > 0
            ? Math.round(topSkills.reduce((sum: number, s: any) => sum + s.count, 0) / topSkills.length)
            : 0,
        },
      }, context.request);
    }

    case 'get-filter-options': {
      const [{ data: deptData }, { data: locData }, { data: titleData }] = await Promise.all([
        supabase.from('opportunities').select('department').not('department', 'is', null).order('department'),
        supabase.from('opportunities').select('location').not('location', 'is', null).order('location'),
        supabase.from('opportunities').select('title, job_title').order('title'),
      ]);
      const departments = [...new Set((deptData || []).map((d: any) => d.department).filter(Boolean))];
      const locations = [...new Set((locData || []).map((l: any) => l.location).filter(Boolean))];
      const titles = [...new Set((titleData || []).map((t: any) => t.title || t.job_title).filter(Boolean))];
      return apiSuccess({ departments, locations, titles }, context.request);
    }

    case 'get-learner-projects': {
      const learnerId = params.learnerId;
      if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId required', context.request);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('enabled', true)
        .in('approval_status', ['approved', 'verified'])
        .order('created_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ projects: data || [] }, context.request);
    }

    case 'get-learner-certificates': {
      const learnerId = params.learnerId;
      if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId required', context.request);
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('enabled', true)
        .in('approval_status', ['approved', 'verified'])
        .order('issued_on', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ certificates: data || [] }, context.request);
    }

    case 'get-learner-assignments': {
      const learnerId = params.learnerId;
      if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId required', context.request);
      const { data, error } = await supabase
        .from('learner_assignments')
        .select(`
          *,
          assignments (
            title, description, course_name, course_code,
            assignment_type, due_date, total_points, skill_outcomes, educator_name
          )
        `)
        .eq('learner_id', learnerId)
        .eq('is_deleted', false)
        .order('updated_date', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ assignments: data || [] }, context.request);
    }

    case 'get-pipeline-statistics': {
      // 🔒 ORG SCOPING: detailed view scoped to org-owned opportunities.
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      const orgOppIds = orgId ? await getOrgOwnedOpportunityIds(supabase, orgId) : [];
      if (orgOppIds.length === 0) {
        return apiSuccess({ stats: { total: 0, by_stage: {}, by_status: {} } }, context.request);
      }
      const opportunityId = params.opportunity_id;
      let query = supabase.from('pipeline_candidates_detailed').select('*').in('opportunity_id', orgOppIds);
      if (opportunityId) {
        if (!orgOppIds.includes(String(opportunityId))) return apiSuccess({ stats: { total: 0, by_stage: {}, by_status: {} } }, context.request);
        query = query.eq('opportunity_id', opportunityId);
      }
      const { data, error } = await query;
      if (error) return apiDbError(error, context.request);
      const candidates = data || [];
      const stats = {
        total: candidates.length,
        by_stage: {
          sourced: candidates.filter((c: any) => c.stage === 'sourced').length,
          screened: candidates.filter((c: any) => c.stage === 'screened').length,
          interview_1: candidates.filter((c: any) => c.stage === 'interview_1').length,
          interview_2: candidates.filter((c: any) => c.stage === 'interview_2').length,
          offer: candidates.filter((c: any) => c.stage === 'offer').length,
          hired: candidates.filter((c: any) => c.stage === 'hired').length,
          rejected: candidates.filter((c: any) => c.stage === 'rejected').length,
        },
        by_status: {
          active: candidates.filter((c: any) => c.status === 'active').length,
          rejected: candidates.filter((c: any) => c.status === 'rejected').length,
        },
      };
      return apiSuccess({ stats }, context.request);
    }

    case 'add-candidate-to-pipeline': {
      const {
        opportunity_id, learner_id, candidate_name, candidate_email, candidate_phone,
        stage, source, next_action, next_action_notes,
      } = params;
      if (!opportunity_id || !learner_id || !candidate_name) {
        return apiError(400, 'VALIDATION_ERROR', 'opportunity_id, learner_id, and candidate_name required', context.request);
      }
      const opportunityIdStr = String(opportunity_id);

      // 🔒 ORG SCOPING: the target opportunity must belong to the caller's active
      // org; the new row is always stamped with that org. Client `added_by` is
      // ignored — authorship is forced server-side.
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const orgOppIds = await getOrgOwnedOpportunityIds(supabase, orgId);
      if (!orgOppIds.includes(opportunityIdStr)) {
        return apiError(403, 'FORBIDDEN', 'This opportunity does not belong to your organization', context.request);
      }

      const { data: existingCandidate } = await supabase
        .from('pipeline_candidates')
        .select('id, stage, status')
        .eq('opportunity_id', opportunityIdStr)
        .eq('learner_id', learner_id)
        .maybeSingle();

      if (existingCandidate) {
        if (existingCandidate.status === 'active') {
          return apiSuccess({
            candidate: null,
            error: {
              code: 'DUPLICATE_CANDIDATE',
              message: `Candidate is already in this pipeline (${existingCandidate.stage} stage)`,
              details: existingCandidate,
            },
          }, context.request);
        }
        const { data: reactivated, error: reactivateError } = await supabase
          .from('pipeline_candidates')
          .update({ status: 'active', stage: stage || 'sourced', updated_at: new Date().toISOString() })
          .eq('id', existingCandidate.id)
          .select()
          .single();
        if (reactivateError) return apiDbError(reactivateError, context.request);
        return apiSuccess({ candidate: reactivated, message: 'Candidate reactivated in pipeline' }, context.request);
      }

      let aiScore = null;
      let employabilityScore = null;
      const { data: learnerData } = await supabase
        .from('learners')
        .select('ai_score_overall, employability_score')
        .eq('id', learner_id)
        .single();
      if (learnerData) {
        aiScore = learnerData.ai_score_overall || null;
        employabilityScore = learnerData.employability_score || null;
      }

      let recruiterNotes = '';
      if (aiScore !== null) recruiterNotes += `AI Match Score: ${aiScore}/100`;
      if (employabilityScore !== null) {
        recruiterNotes += recruiterNotes ? ` | Employability Score: ${employabilityScore}/100` : `Employability Score: ${employabilityScore}/100`;
      }

      const candidateStage = stage || 'sourced';
      const { data, error } = await supabase
        .from('pipeline_candidates')
        .insert([{
          opportunity_id: opportunityIdStr,
          learner_id,
          candidate_name,
          candidate_email: candidate_email || null,
          candidate_phone: candidate_phone || null,
          stage: candidateStage,
          source: source || 'talent_pool',
          status: 'active',
          added_by: user.id, // 🔒 server-forced (client added_by ignored)
          added_by_uuid: user.id, // FK'd shadow column
          organization_id: orgId, // 🔒 server-forced tenant stamp
          next_action: next_action || null,
          recruiter_notes: recruiterNotes || next_action_notes || null,
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return apiSuccess({
            candidate: null,
            error: { code: 'DUPLICATE_CANDIDATE', message: 'Candidate is already in this pipeline' },
          }, context.request);
        }
        return apiDbError(error, context.request);
      }

      const stageToStatusMap: Record<string, string> = {
        sourced: 'applied', screened: 'under_review', interview_1: 'interview_scheduled',
        interview_2: 'interviewed', offer: 'offer_received', hired: 'accepted', rejected: 'rejected',
      };
      const applicationStatus = stageToStatusMap[candidateStage];
      if (applicationStatus && learner_id && opportunityIdStr) {
        const { data: existingApp } = await supabase
          .from('applied_jobs')
          .select('id')
          .eq('learner_id', learner_id)
          .eq('opportunity_id', opportunityIdStr)
          .maybeSingle();
        if (existingApp) {
          await supabase
            .from('applied_jobs')
            .update({ application_status: applicationStatus, updated_at: new Date().toISOString() })
            .eq('id', existingApp.id);
        }
      }

      if (data) {
        try {
          await supabase
            .from('pipeline_activities')
            .insert([{
              candidate_uuid: data.id,
              activity_type: 'stage_change',
              from_stage: null,
              to_stage: data.stage,
              performed_by: user.id, // 🔒 server-forced actor
              learner_id: learner_id,
              activity_details: { ai_score: aiScore, employability_score: employabilityScore },
            }]);
        } catch (_) {}
      }

      return apiSuccess({ candidate: data }, context.request);
    }

    case 'move-candidate-to-stage': {
      const { candidate_id, stage: newStage, notes } = params;
      if (!candidate_id || !newStage) return apiError(400, 'VALIDATION_ERROR', 'candidate_id and stage required', context.request);
      const candidateIdStr = String(candidate_id);

      // 🔒 ORG SCOPING before mutation: candidate must belong to caller's org.
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const { data: fetched, error: fetchScopedErr } = await supabase
        .from('pipeline_candidates')
        .select('id, stage, learner_id, candidate_name, candidate_email, opportunity_id')
        .eq('id', candidateIdStr)
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();
      if (fetchScopedErr) return apiDbError(fetchScopedErr, context.request);
      if (!fetched) return apiError(404, 'NOT_FOUND', 'Candidate not found', context.request);
      const currentData = fetched;

      if (currentData.opportunity_id) {
        const { data: opportunityData } = await supabase
          .from('opportunities')
          .select('applications_count, status, job_title, company_name')
          .eq('id', currentData.opportunity_id)
          .single();
        if (opportunityData && (opportunityData.status === 'closed' || opportunityData.status === 'filled')) {
          return apiError(400, 'VALIDATION_ERROR',
            `Cannot move candidate: All openings for ${opportunityData.job_title} at ${opportunityData.company_name} have been filled.`,
            context.request);
        }
      }

      const previousStage = currentData.stage;
      const { data, error } = await supabase
        .from('pipeline_candidates')
        .update({
          stage: newStage,
          previous_stage: previousStage,
          stage_changed_at: new Date().toISOString(),
          stage_changed_by: user.id, // 🔒 server-forced actor
        })
        .eq('id', candidateIdStr)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);

      const stageToStatusMap: Record<string, string> = {
        sourced: 'applied', screened: 'under_review', interview_1: 'interview_scheduled',
        interview_2: 'interviewed', offer: 'offer_received', hired: 'accepted', rejected: 'rejected',
      };
      const applicationStatus = stageToStatusMap[newStage];
      if (applicationStatus && currentData.learner_id && currentData.opportunity_id) {
        const updateData: any = { application_status: applicationStatus, updated_at: new Date().toISOString() };
        if (applicationStatus === 'interview_scheduled') updateData.interview_scheduled_at = new Date().toISOString();
        await supabase
          .from('applied_jobs')
          .update(updateData)
          .eq('learner_id', currentData.learner_id)
          .eq('opportunity_id', currentData.opportunity_id)
          .maybeSingle();
      }

      try {
        await supabase
          .from('pipeline_activities')
          .insert([{
            candidate_uuid: candidateIdStr,
            activity_type: 'stage_change',
            from_stage: previousStage,
            to_stage: newStage,
            activity_details: notes ? { notes } : null,
            performed_by: user.id, // 🔒 server-forced actor
            learner_id: currentData.learner_id,
          }]);
      } catch (_) {}

      // Notify learner of the stage change (preference-gated)
      {
        const notificationType = newStage === 'rejected' ? 'candidate_rejected' : 'pipeline_stage_changed';
        const notificationTitle =
          newStage === 'hired' ? "Congratulations! You've been hired!" :
          newStage === 'offer' ? 'Offer Extended!' :
          newStage === 'interview_2' ? 'Advanced to Final Interview' :
          newStage === 'interview_1' ? 'Interview Scheduled' :
          newStage === 'screened' ? 'Application Screened' :
          newStage === 'rejected' ? 'Application Status Update' : 'Application Update';
        const notificationMessage =
          newStage === 'hired' ? 'Great news! You have been selected for the position.' :
          newStage === 'offer' ? 'You have received an offer. Review the details in your dashboard.' :
          newStage === 'interview_2' ? 'Congratulations! You have been selected for the final interview round.' :
          newStage === 'interview_1' ? 'You have been selected for an interview.' :
          newStage === 'screened' ? 'Your application is under review.' :
          newStage === 'rejected' ? 'Thank you for your interest. We have decided to move forward with other candidates.' :
          'Your application has been updated.';

        await notifyLearnerOfPipelineChange(supabase, currentData.learner_id, notificationType, notificationTitle, notificationMessage);
      }

      return apiSuccess({ candidate: data }, context.request);
    }

    case 'update-next-action': {
      const { candidate_id, next_action, next_action_date, notes } = params;
      if (!candidate_id || !next_action) return apiError(400, 'VALIDATION_ERROR', 'candidate_id and next_action required', context.request);
      const candidateIdStr = String(candidate_id);
      // 🔒 ORG SCOPING before mutation
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const { data: target, error: targetErr } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('id', candidateIdStr)
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();
      if (targetErr) return apiDbError(targetErr, context.request);
      if (!target) return apiError(404, 'NOT_FOUND', 'Candidate not found', context.request);
      const { data, error } = await supabase
        .from('pipeline_candidates')
        .update({ next_action, next_action_date: next_action_date || null, next_action_notes: notes || null })
        .eq('id', target.id)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ candidate: data }, context.request);
    }

    case 'reject-candidate': {
      const { candidate_id, rejection_reason } = params;
      if (!candidate_id) return apiError(400, 'VALIDATION_ERROR', 'candidate_id required', context.request);
      const candidateIdStr = String(candidate_id);
      // 🔒 ORG SCOPING before mutation
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const { data: currentData, error: fetchError } = await supabase
        .from('pipeline_candidates')
        .select('id, previous_stage, learner_id')
        .eq('id', candidateIdStr)
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();
      if (fetchError) return apiDbError(fetchError, context.request);
      if (!currentData) return apiError(404, 'NOT_FOUND', 'Candidate not found', context.request);

      const { data, error } = await supabase
        .from('pipeline_candidates')
        .update({
          status: 'rejected', stage: 'rejected',
          rejection_reason: rejection_reason || null,
          rejection_date: new Date().toISOString(),
        })
        .eq('id', currentData.id) // only within the verified org scope
        .select()
        .single();
      if (error) return apiDbError(error, context.request);

      try {
        await supabase
          .from('pipeline_activities')
          .insert([{
            candidate_uuid: candidateIdStr,
            activity_type: 'stage_change',
            from_stage: currentData?.previous_stage || undefined,
            to_stage: 'rejected',
            activity_details: rejection_reason ? { reason: rejection_reason } : null,
            performed_by: user.id, // 🔒 server-forced actor
            learner_id: currentData?.learner_id,
          }]);
      } catch (_) {}

      // Notify learner of the rejection (preference-gated)
      await notifyLearnerOfPipelineChange(
        supabase,
        currentData?.learner_id,
        'candidate_rejected',
        'Application Status Update',
        'Thank you for your interest. We have decided to move forward with other candidates.'
      );

      return apiSuccess({ candidate: data }, context.request);
    }

    case 'update-candidate-rating': {
      const { candidate_id, rating, notes } = params;
      if (!candidate_id || rating === undefined) return apiError(400, 'VALIDATION_ERROR', 'candidate_id and rating required', context.request);
      const candidateIdStr = String(candidate_id);
      // 🔒 ORG SCOPING before mutation
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const { data: target, error: targetErr } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('id', candidateIdStr)
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();
      if (targetErr) return apiDbError(targetErr, context.request);
      if (!target) return apiError(404, 'NOT_FOUND', 'Candidate not found', context.request);
      const { data, error } = await supabase
        .from('pipeline_candidates')
        .update({ recruiter_rating: rating, recruiter_notes: notes || null })
        .eq('id', target.id)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ candidate: data }, context.request);
    }

    case 'assign-candidate': {
      const { candidate_id, assigned_to } = params;
      if (!candidate_id || !assigned_to) return apiError(400, 'VALIDATION_ERROR', 'candidate_id and assigned_to required', context.request);
      const candidateIdStr = String(candidate_id);
      // 🔒 ORG SCOPING before mutation; the assignee must be an ACTIVE member of
      // the caller's org (getOrgMemberUserIds) — assigning to an outsider is 403.
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const memberIds = await getOrgMemberUserIds(supabase, orgId);
      if (!memberIds.includes(String(assigned_to))) {
        return apiError(403, 'FORBIDDEN', 'Assignee must be an active member of your organization', context.request);
      }
      const { data: target, error: targetErr } = await supabase
        .from('pipeline_candidates')
        .select('id, learner_id')
        .eq('id', candidateIdStr)
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();
      if (targetErr) return apiDbError(targetErr, context.request);
      if (!target) return apiError(404, 'NOT_FOUND', 'Candidate not found', context.request);
      const { data, error } = await supabase
        .from('pipeline_candidates')
        .update({ assigned_to })
        .eq('id', target.id)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      try {
        await supabase
          .from('pipeline_activities')
          .insert([{
            candidate_uuid: candidateIdStr,
            activity_type: 'note_added',
            activity_details: { assigned_to },
            performed_by: user.id, // 🔒 server-forced actor
            learner_id: data.learner_id,
          }]);
      } catch (_) {}
      return apiSuccess({ candidate: data }, context.request);
    }

    case 'remove-candidate-from-pipeline': {
      const { candidate_id } = params;
      if (!candidate_id) return apiError(400, 'VALIDATION_ERROR', 'candidate_id required', context.request);
      const candidateIdStr = String(candidate_id);
      // 🔒 ORG SCOPING: pipeline rows may only be deleted within the caller's org.
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const { data: target, error: targetErr } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('id', candidateIdStr)
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();
      if (targetErr) return apiDbError(targetErr, context.request);
      if (!target) return apiError(404, 'NOT_FOUND', 'Candidate not found', context.request);
      const { error } = await supabase
        .from('pipeline_candidates')
        .delete()
        .eq('id', target.id); // scoped delete: verified row only
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }

    case 'log-pipeline-activity': {
      const { pipeline_candidate_id, activity_type, to_stage, learner_id } = params;
      if (!pipeline_candidate_id || !activity_type) {
        return apiError(400, 'VALIDATION_ERROR', 'pipeline_candidate_id and activity_type required', context.request);
      }
      // 🔒 Per-user sliding-window rate limit (20/min): this action fans out
      // learner notifications and is otherwise a cheap call — cap the abuse
      // surface. In-memory per isolate (commented residual above the map).
      const user = getContextUser(context);
      if (!allowPipelineNotificationRate(user.id)) {
        return apiError(429, 'RATE_LIMITED', 'Too many pipeline activity notifications; try again later', context.request);
      }
      // 🔒 NOTIFICATIONS: the body's learner_id is never trusted for fan-out.
      // Notifications may only target learners belonging to the caller's
      // org-owned opportunity applications.
      if (learner_id) {
        const orgId = await getActiveOrgId(supabase, user);
        const orgOppIds = orgId ? await getOrgOwnedOpportunityIds(supabase, orgId) : [];
        let inOrgScope = false;
        if (orgOppIds.length > 0) {
          const { data: appRow } = await supabase
            .from('applied_jobs')
            .select('id')
            .eq('learner_id', learner_id)
            .in('opportunity_id', orgOppIds)
            .limit(1)
            .maybeSingle();
          inOrgScope = !!appRow;
        }
        if (!inOrgScope) {
          return apiError(403, 'FORBIDDEN', 'Notifications are restricted to learners who applied to your organization\'s opportunities', context.request);
        }
        const notificationType = activity_type === 'stage_change'
          ? (to_stage === 'rejected' ? 'candidate_rejected' : 'pipeline_stage_changed')
          : 'pipeline_stage_changed';
        const notificationTitle = activity_type === 'stage_change'
          ? (to_stage === 'hired' ? "Congratulations! You've been hired!" :
             to_stage === 'offer' ? 'Offer Extended!' :
             to_stage === 'interview_2' ? 'Advanced to Final Interview' :
             to_stage === 'interview_1' ? 'Interview Scheduled' :
             to_stage === 'screened' ? 'Application Screened' :
             to_stage === 'rejected' ? 'Application Status Update' : 'Application Update')
          : (activity_type === 'note_added' ? 'Update on your application' :
             activity_type === 'next_action_set' ? 'Action Required' : 'Application Update');
        const notificationMessage = activity_type === 'stage_change'
          ? (to_stage === 'hired' ? 'Great news! You have been selected for the position.' :
             to_stage === 'offer' ? 'You have received an offer. Review the details in your dashboard.' :
             to_stage === 'interview_2' ? 'Congratulations! You have been selected for the final interview round.' :
             to_stage === 'interview_1' ? 'You have been selected for an interview.' :
             to_stage === 'screened' ? 'Your application is under review.' :
             to_stage === 'rejected' ? 'Thank you for your interest. We have decided to move forward with other candidates.' :
             'Your application has been updated.')
          : (activity_type === 'note_added' ? 'Your application has been updated with new information.' :
             activity_type === 'next_action_set' ? 'Next steps for your application have been set.' :
             'Your application has been updated.');

        await notifyLearnerOfPipelineChange(supabase, learner_id, notificationType, notificationTitle, notificationMessage);
      }
      return apiSuccess({ logged: true }, context.request);
    }

    case 'bulk-move-candidates': {
      const { candidate_ids, stage: newStage } = params;
      if (!candidate_ids || !Array.isArray(candidate_ids) || candidate_ids.length === 0 || !newStage) {
        return apiError(400, 'VALIDATION_ERROR', 'candidate_ids array and stage required', context.request);
      }
      // 🔒 ORG SCOPING, all-or-nothing: verify EVERY candidate belongs to the
      // caller's org BEFORE applying any move (no partial cross-org mutation).
      const user = getContextUser(context);
      const orgId = await getActiveOrgId(supabase, user);
      if (!orgId) return apiError(400, 'VALIDATION_ERROR', 'Organization ID is required', context.request);
      const { data: orgRows, error: scopeErr } = await supabase
        .from('pipeline_candidates')
        .select('id, stage, learner_id, opportunity_id')
        .in('id', candidate_ids.map((id: any) => String(id)))
        .eq('organization_id', orgId);
      if (scopeErr) return apiDbError(scopeErr, context.request);
      const foundIds = new Set((orgRows || []).map((r: any) => r.id));
      const missing = candidate_ids.filter((id: any) => !foundIds.has(String(id)));
      if (missing.length > 0) {
        return apiError(403, 'FORBIDDEN', 'One or more candidates do not belong to your organization', context.request);
      }
      const results: any[] = [];
      const errors: any[] = [];
      for (const scoped of orgRows || []) {
        try {
          const candidateIdStr = String(scoped.id);
          const previousStage = scoped.stage;
          const { data: updated, error: updateError } = await supabase
            .from('pipeline_candidates')
            .update({ stage: newStage, previous_stage: previousStage, stage_changed_at: new Date().toISOString(), stage_changed_by: user.id }) // 🔒 server-forced actor
            .eq('id', candidateIdStr)
            .select()
            .single();
          if (updateError) errors.push(updateError);
          else results.push(updated);
        } catch (e) {
          errors.push(e);
        }
      }
      if (errors.length > 0) {
        return apiSuccess({ candidates: results, errors }, context.request);
      }
      return apiSuccess({ candidates: results }, context.request);
    }

    case 'bulk-reject-candidates': {
      const ids=[...new Set((params.candidate_ids||[]).map(String))];
      if(!ids.length||ids.length>100||!ids.every(id=>/^[0-9a-f-]{36}$/i.test(String(id)))||!params.rejection_reason?.trim())return apiError(400,'VALIDATION_ERROR','Select 1–100 candidates and provide a rejection reason',context.request);
      const user=getContextUser(context),orgId=await getActiveOrgId(supabase,user);
      const {data,error}=await supabase.rpc('recruitment_pipeline_operation',{p_org:orgId,p_actor:user.id,p_ids:ids,p_action:'reject',p_reason:params.rejection_reason,p_assignee:null});
      if(error)return apiDbError(error,context.request);if(data?.error)return apiError(409,'CONFLICT',data.error,context.request);return apiSuccess(data,context.request);
    }

    default:
      return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
  }
}

const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const url = new URL(context.request.url);
  const params: Record<string, any> = {};
  url.searchParams.forEach((value, key) => { params[key] = value; });
  if (!params.action) return apiError(400, 'VALIDATION_ERROR', 'action query param is required', context.request);
  // 🔒 Mutating actions are 405-method-blocked on GET dispatch (read allowlist).
  if (MUTATING_ACTIONS.has(String(params.action))) {
    return apiMethodNotAllowed();
  }
  return handleAction(context, supabase, params);
});

const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const params: any = await context.request.json().catch(() => ({}));
  if (!params.action) return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);
  return handleAction(context, supabase, params);
});
