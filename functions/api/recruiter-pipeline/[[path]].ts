import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';

export const onRequest = async (context: any) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

async function handleAction(context: AuthenticatedContext, supabase: any, params: Record<string, any>): Promise<Response> {
  const { action } = params;

  switch (action) {

    case 'get-requisitions': {
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .order('created_date', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ requisitions: data || [] }, context.request);
    }

    case 'get-requisition-by-id': {
      const id = params.id;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ requisition: data }, context.request);
    }

    case 'get-opportunity-by-id': {
      const id = params.id;
      if (!id) return apiError(400, 'VALIDATION_ERROR', 'id required', context.request);
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ opportunity: data }, context.request);
    }

    case 'get-requisitions-with-stats': {
      const { data, error } = await supabase
        .from('requisitions_with_pipeline_stats')
        .select('*')
        .order('created_date', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ requisitions: data || [] }, context.request);
    }

    case 'get-pipeline-candidates': {
      const opportunityId = params.opportunity_id;
      let query = supabase.from('pipeline_candidates_detailed').select('*');
      if (opportunityId) query = query.eq('opportunity_id', opportunityId);
      const { data, error } = await query.order('added_at', { ascending: false });
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ candidates: data || [] }, context.request);
    }

    case 'get-pipeline-candidates-by-stage': {
      const opportunityId = params.opportunity_id;
      const stage = params.stage;
      if (!opportunityId || !stage) return apiError(400, 'VALIDATION_ERROR', 'opportunity_id and stage required', context.request);
      const { data: pipelineCandidates, error: pcError } = await supabase
        .from('pipeline_candidates')
        .select('*')
        .eq('opportunity_id', opportunityId)
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

      if (!opportunityId) return apiError(400, 'VALIDATION_ERROR', 'opportunity_id required', context.request);

      let query = supabase
        .from('pipeline_candidates')
        .select('*')
        .eq('opportunity_id', opportunityId)
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
      const opportunityId = params.opportunity_id;
      let query = supabase.from('pipeline_candidates_detailed').select('*');
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
      const { data, error } = await supabase
        .from('pipeline_activities')
        .select('*')
        .eq('pipeline_candidate_id', candidateId)
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

    case 'debug-opportunities-table': {
      const { data: samples, error: sampleError } = await supabase
        .from('opportunities')
        .select('*')
        .limit(5);
      if (sampleError) return apiDbError(sampleError, context.request);
      const { count: totalCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true });
      const { count: activeCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      const { count: skillsCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('skills_required', 'is', null);
      return apiSuccess({
        samples: samples || [],
        totalCount: totalCount || 0,
        activeCount: activeCount || 0,
        skillsCount: skillsCount || 0,
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
      const opportunityId = params.opportunity_id;
      let query = supabase.from('pipeline_candidates_detailed').select('*');
      if (opportunityId) query = query.eq('opportunity_id', opportunityId);
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
        stage, source, added_by, next_action, next_action_notes,
      } = params;
      if (!opportunity_id || !learner_id || !candidate_name) {
        return apiError(400, 'VALIDATION_ERROR', 'opportunity_id, learner_id, and candidate_name required', context.request);
      }
      const opportunityIdStr = String(opportunity_id);

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
          added_by: added_by || null,
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
              pipeline_candidate_id: data.id,
              activity_type: 'stage_change',
              from_stage: null,
              to_stage: data.stage,
              performed_by: added_by || null,
              learner_id: learner_id,
              activity_details: { ai_score: aiScore, employability_score: employabilityScore },
            }]);
        } catch (_) {}
      }

      return apiSuccess({ candidate: data }, context.request);
    }

    case 'move-candidate-to-stage': {
      const { candidate_id, stage: newStage, performed_by, notes } = params;
      if (!candidate_id || !newStage) return apiError(400, 'VALIDATION_ERROR', 'candidate_id and stage required', context.request);
      const candidateIdStr = String(candidate_id);

      const { data: currentData, error: fetchError } = await supabase
        .from('pipeline_candidates')
        .select('stage, learner_id, candidate_name, candidate_email, opportunity_id')
        .eq('id', candidateIdStr)
        .single();
      if (fetchError) return apiDbError(fetchError, context.request);

      if (currentData.opportunity_id) {
        const { data: opportunityData } = await supabase
          .from('opportunities')
          .select('applications_count, status, job_title, company_name')
          .eq('id', currentData.opportunity_id)
          .single();
        if (opportunityData && (opportunityData.applications_count === 0 || opportunityData.status === 'filled')) {
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
          stage_changed_by: performed_by || null,
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
            pipeline_candidate_id: candidateIdStr,
            activity_type: 'stage_change',
            from_stage: previousStage,
            to_stage: newStage,
            activity_details: notes ? { notes } : null,
            performed_by: performed_by || null,
            learner_id: currentData.learner_id,
          }]);
      } catch (_) {}

      // Create notification for learner
      if (currentData.learner_id) {
        const { data: learnerData } = await supabase
          .from('learners')
          .select('user_id')
          .eq('id', currentData.learner_id)
          .maybeSingle();
        
        if (learnerData?.user_id) {
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
          
          try {
            await supabase
              .from('notifications')
              .insert([{
                recipient_id: learnerData.user_id,
                type: notificationType,
                title: notificationTitle,
                message: notificationMessage,
                read: false,
                created_at: new Date().toISOString(),
              }]);
          } catch (_) {}
        }
      }

      return apiSuccess({ candidate: data }, context.request);
    }

    case 'update-next-action': {
      const { candidate_id, next_action, next_action_date, notes } = params;
      if (!candidate_id || !next_action) return apiError(400, 'VALIDATION_ERROR', 'candidate_id and next_action required', context.request);
      const candidateIdStr = String(candidate_id);
      const { data, error } = await supabase
        .from('pipeline_candidates')
        .update({ next_action, next_action_date: next_action_date || null, next_action_notes: notes || null })
        .eq('id', candidateIdStr)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ candidate: data }, context.request);
    }

    case 'reject-candidate': {
      const { candidate_id, rejection_reason, performed_by } = params;
      if (!candidate_id) return apiError(400, 'VALIDATION_ERROR', 'candidate_id required', context.request);
      const candidateIdStr = String(candidate_id);

      const { data: currentData, error: fetchError } = await supabase
        .from('pipeline_candidates')
        .select('previous_stage, learner_id')
        .eq('id', candidateIdStr)
        .single();
      if (fetchError) return apiDbError(fetchError, context.request);

      const { data, error } = await supabase
        .from('pipeline_candidates')
        .update({
          status: 'rejected', stage: 'rejected',
          rejection_reason: rejection_reason || null,
          rejection_date: new Date().toISOString(),
        })
        .eq('id', candidateIdStr)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);

      try {
        await supabase
          .from('pipeline_activities')
          .insert([{
            pipeline_candidate_id: candidateIdStr,
            activity_type: 'stage_change',
            from_stage: currentData?.previous_stage || undefined,
            to_stage: 'rejected',
            activity_details: rejection_reason ? { reason: rejection_reason } : null,
            performed_by: performed_by || null,
            learner_id: currentData?.learner_id,
          }]);
      } catch (_) {}

      // Create notification for learner about rejection
      if (currentData?.learner_id) {
        const { data: learnerData } = await supabase
          .from('learners')
          .select('user_id')
          .eq('id', currentData.learner_id)
          .maybeSingle();
        
        if (learnerData?.user_id) {
          try {
            await supabase
              .from('notifications')
              .insert([{
                recipient_id: learnerData.user_id,
                type: 'candidate_rejected',
                title: 'Application Status Update',
                message: 'Thank you for your interest. We have decided to move forward with other candidates.',
                read: false,
                created_at: new Date().toISOString(),
              }]);
          } catch (_) {}
        }
      }

      return apiSuccess({ candidate: data }, context.request);
    }

    case 'update-candidate-rating': {
      const { candidate_id, rating, notes } = params;
      if (!candidate_id || rating === undefined) return apiError(400, 'VALIDATION_ERROR', 'candidate_id and rating required', context.request);
      const candidateIdStr = String(candidate_id);
      const { data, error } = await supabase
        .from('pipeline_candidates')
        .update({ recruiter_rating: rating, recruiter_notes: notes || null })
        .eq('id', candidateIdStr)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ candidate: data }, context.request);
    }

    case 'assign-candidate': {
      const { candidate_id, assigned_to, performed_by } = params;
      if (!candidate_id || !assigned_to) return apiError(400, 'VALIDATION_ERROR', 'candidate_id and assigned_to required', context.request);
      const candidateIdStr = String(candidate_id);
      const { data, error } = await supabase
        .from('pipeline_candidates')
        .update({ assigned_to })
        .eq('id', candidateIdStr)
        .select()
        .single();
      if (error) return apiDbError(error, context.request);
      try {
        await supabase
          .from('pipeline_activities')
          .insert([{
            pipeline_candidate_id: candidateIdStr,
            activity_type: 'note_added',
            activity_details: { assigned_to },
            performed_by: performed_by || null,
            learner_id: data.learner_id,
          }]);
      } catch (_) {}
      return apiSuccess({ candidate: data }, context.request);
    }

    case 'remove-candidate-from-pipeline': {
      const { candidate_id } = params;
      if (!candidate_id) return apiError(400, 'VALIDATION_ERROR', 'candidate_id required', context.request);
      const candidateIdStr = String(candidate_id);
      const { error } = await supabase
        .from('pipeline_candidates')
        .delete()
        .eq('id', candidateIdStr);
      if (error) return apiDbError(error, context.request);
      return apiSuccess({ deleted: true }, context.request);
    }

    case 'log-pipeline-activity': {
      const { pipeline_candidate_id, activity_type, to_stage, learner_id } = params;
      if (!pipeline_candidate_id || !activity_type) {
        return apiError(400, 'VALIDATION_ERROR', 'pipeline_candidate_id and activity_type required', context.request);
      }
      if (learner_id) {
        const { data: learnerData } = await supabase
          .from('learners')
          .select('user_id')
          .eq('id', learner_id)
          .single();
        if (learnerData?.user_id) {
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
          await supabase
            .from('notifications')
            .insert([{
              recipient_id: learnerData.user_id,
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              read: false,
              created_at: new Date().toISOString(),
            }])
            .select()
            .single();
        }
      }
      return apiSuccess({ logged: true }, context.request);
    }

    case 'bulk-move-candidates': {
      const { candidate_ids, stage: newStage, performed_by } = params;
      if (!candidate_ids || !Array.isArray(candidate_ids) || candidate_ids.length === 0 || !newStage) {
        return apiError(400, 'VALIDATION_ERROR', 'candidate_ids array and stage required', context.request);
      }
      const results: any[] = [];
      const errors: any[] = [];
      for (const id of candidate_ids) {
        try {
          const candidateIdStr = String(id);
          const { data: currentData } = await supabase
            .from('pipeline_candidates')
            .select('stage, learner_id, opportunity_id')
            .eq('id', candidateIdStr)
            .single();
          if (currentData) {
            const previousStage = currentData.stage;
            const { data: updated, error: updateError } = await supabase
              .from('pipeline_candidates')
              .update({ stage: newStage, previous_stage: previousStage, stage_changed_at: new Date().toISOString(), stage_changed_by: performed_by || null })
              .eq('id', candidateIdStr)
              .select()
              .single();
            if (updateError) errors.push(updateError);
            else results.push(updated);
          }
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
      const { candidate_ids, rejection_reason } = params;
      if (!candidate_ids || !Array.isArray(candidate_ids) || candidate_ids.length === 0) {
        return apiError(400, 'VALIDATION_ERROR', 'candidate_ids array required', context.request);
      }
      const results: any[] = [];
      const errors: any[] = [];
      for (const id of candidate_ids) {
        try {
          const candidateIdStr = String(id);
          const { data: updated, error: updateError } = await supabase
            .from('pipeline_candidates')
            .update({ status: 'rejected', stage: 'rejected', rejection_reason: rejection_reason || null, rejection_date: new Date().toISOString() })
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
  return handleAction(context, supabase, params);
});

const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const params: any = await context.request.json().catch(() => ({}));
  if (!params.action) return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);
  return handleAction(context, supabase, params);
});
