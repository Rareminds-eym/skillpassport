import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request, { startTime });
  }

  const { action, ...params } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request, { startTime });
  }

  try {
    switch (action) {
      case 'get-pipeline-status': {
        const { learnerId, learnerEmail } = params;
        let query = supabase
          .from('pipeline_candidates')
          .select(`
            id, opportunity_id, learner_id, candidate_name, candidate_email,
            stage, previous_stage, stage_changed_at, stage_changed_by,
            status, rejection_reason, rejection_date,
            next_action, next_action_date, next_action_notes,
            recruiter_rating, recruiter_notes, assigned_to,
            source, added_at, created_at, updated_at,
            opportunities (id, job_title, title, company_name, department, location, employment_type, mode, stipend_or_salary, description, experience_required, recruiter_id)
          `)
          .eq('status', 'active')
          .order('stage_changed_at', { ascending: false });
        if (learnerId) query = query.eq('learner_id', learnerId);
        else if (learnerEmail) query = query.eq('candidate_email', learnerEmail);
        const { data, error } = await query;
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-pipeline-activities': {
        const { learnerId } = params;
        const { data: candidates, error: candidatesError } = await supabase
          .from('pipeline_candidates').select('id').eq('learner_id', learnerId);
        if (candidatesError) return apiError(500, 'DB_ERROR', candidatesError.message, context.request, { startTime });
        if (!candidates || candidates.length === 0) return apiSuccess([], context.request, { startTime });
        const candidateIds = candidates.map((c: any) => c.id);
        const { data: activities, error: activitiesError } = await supabase
          .from('pipeline_activities').select('*').in('pipeline_candidate_id', candidateIds)
          .order('created_at', { ascending: false });
        if (activitiesError) return apiError(500, 'DB_ERROR', activitiesError.message, context.request, { startTime });
        return apiSuccess(activities || [], context.request, { startTime });
      }

      case 'get-interviews': {
        const { learnerId } = params;
        const { data, error } = await supabase
          .from('interviews').select('*').eq('learner_id', learnerId)
          .in('status', ['scheduled', 'confirmed', 'pending'])
          .order('date', { ascending: true });
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-applications-with-pipeline': {
        const { learnerId, learnerEmail } = params;
        const { data: applications, error: appsError } = await supabase
          .from('applied_jobs')
          .select(`*, opportunity:opportunities!fk_applied_jobs_opportunity (*)`)
          .eq('learner_id', learnerId)
          .order('applied_at', { ascending: false });
        if (appsError) return apiError(500, 'DB_ERROR', appsError.message, context.request, { startTime });

        const { data: candidates, error: candError } = await supabase
          .from('pipeline_candidates')
          .select(`id, opportunity_id, stage, previous_stage, stage_changed_at, stage_changed_by, status, rejection_reason, rejection_date, next_action, next_action_date, next_action_notes, recruiter_rating, recruiter_notes, assigned_to, opportunities (id, job_title, title, company_name, department, location, employment_type, mode, stipend_or_salary, description, experience_required, recruiter_id)`)
          .eq('status', 'active')
          .eq('learner_id', learnerId)
          .order('stage_changed_at', { ascending: false });
        if (candError) return apiError(500, 'DB_ERROR', candError.message, context.request, { startTime });

        const { data: interviews, error: intError } = await supabase
          .from('interviews').select('*').eq('learner_id', learnerId)
          .in('status', ['scheduled', 'confirmed', 'pending'])
          .order('date', { ascending: true });
        if (intError) return apiError(500, 'DB_ERROR', intError.message, context.request, { startTime });

        const pipelineMap = new Map((candidates || []).map((ps: any) => [ps.opportunity_id, ps]));
        const interviewsMap = new Map();
        (interviews || []).forEach((interview: any) => {
          const key = interview.opportunity_id || interview.job_title;
          if (!interviewsMap.has(key)) interviewsMap.set(key, []);
          interviewsMap.get(key).push(interview);
        });

        const combinedData = (applications || []).map((app: any) => {
          const opportunityId = app.opportunity?.id;
          const pipelineStatus = opportunityId ? pipelineMap.get(opportunityId) : null;
          const jobInterviews = opportunityId ? interviewsMap.get(opportunityId) : [];
          return { ...app, pipeline_status: pipelineStatus, interviews: jobInterviews || [], has_pipeline_status: !!pipelineStatus, pipeline_stage: pipelineStatus?.stage || null, pipeline_stage_changed_at: pipelineStatus?.stage_changed_at || null, rejection_reason: pipelineStatus?.rejection_reason || null, next_action: pipelineStatus?.next_action || null, next_action_date: pipelineStatus?.next_action_date || null, pipeline_recruiter_id: pipelineStatus?.assigned_to || pipelineStatus?.opportunities?.recruiter_id || null };
        });

        return apiSuccess(combinedData, context.request, { startTime });
      }

      case 'get-stage-change-notifications': {
        const { learnerId, limit = 10 } = params;
        const { data: candidates, error: candidatesError } = await supabase
          .from('pipeline_candidates').select('id').eq('learner_id', learnerId);
        if (candidatesError) return apiError(500, 'DB_ERROR', candidatesError.message, context.request, { startTime });
        if (!candidates || candidates.length === 0) return apiSuccess([], context.request, { startTime });
        const candidateIds = candidates.map((c: any) => c.id);
        const { data: activities, error: activitiesError } = await supabase
          .from('pipeline_activities').select('*').in('pipeline_candidate_id', candidateIds)
          .order('created_at', { ascending: false });
        if (activitiesError) return apiError(500, 'DB_ERROR', activitiesError.message, context.request, { startTime });
        const stageChanges = (activities || [])
          .filter((a: any) => a.activity_type === 'stage_change')
          .slice(0, limit)
          .map((a: any) => ({ id: a.id, from_stage: a.from_stage, to_stage: a.to_stage, changed_at: a.created_at, changed_by: a.performed_by, details: a.activity_details, type: 'stage_change' }));
        return apiSuccess(stageChanges, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error) {
    console.error('[Pipeline] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request, { startTime });
  }
});
