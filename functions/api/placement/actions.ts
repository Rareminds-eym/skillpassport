import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      case 'get-learner-pipeline-status': {
        const { learnerId, learnerEmail } = params;
        if (!learnerId && !learnerEmail) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId or learnerEmail', context.request, { startTime });

        let query = supabase
          .from('pipeline_candidates')
          .select(`
            id, opportunity_id, learner_id, candidate_name, candidate_email,
            stage, previous_stage, stage_changed_at, stage_changed_by,
            status, rejection_reason, rejection_date,
            next_action, next_action_date, next_action_notes,
            recruiter_rating, recruiter_notes,
            assigned_to, source, added_at, created_at, updated_at,
            opportunities (id, job_title, title, company_name, department, location, employment_type, mode, stipend_or_salary, description, experience_required, recruiter_id)
          `)
          .eq('status', 'active')
          .order('stage_changed_at', { ascending: false });

        if (learnerId) query = query.eq('learner_id', learnerId);
        else if (learnerEmail) query = query.eq('candidate_email', learnerEmail);

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-learner-pipeline-activities': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        const { data, error } = await supabase
          .from('pipeline_activities')
          .select('*')
          .eq('learner_id', learnerId)
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-learner-interviews': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        const { data, error } = await supabase
          .from('interviews')
          .select('*')
          .eq('learner_id', learnerId)
          .in('status', ['scheduled', 'confirmed', 'pending'])
          .order('date', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-learner-applications-with-pipeline': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        const [applicationsResult, pipelineResult, interviewsResult] = await Promise.all([
          supabase
            .from('applied_jobs')
            .select(`
              *,
              opportunity:opportunities!fk_applied_jobs_opportunity (
                id, job_title, title, company_name, company_logo, location,
                employment_type, salary_range_min, salary_range_max, mode,
                department, recruiter_id, experience_level, status,
                applications_count, is_active
              )
            `)
            .eq('learner_id', learnerId)
            .order('applied_at', { ascending: false }),
          supabase
            .from('pipeline_candidates')
            .select(`
              id, opportunity_id, learner_id, candidate_name, candidate_email,
              stage, previous_stage, stage_changed_at, status, rejection_reason,
              next_action, next_action_date, next_action_notes,
              recruiter_rating, assigned_to, source, added_at, created_at,
              opportunities (id, job_title, title, company_name, recruiter_id)
            `)
            .eq('status', 'active')
            .eq('learner_id', learnerId)
            .order('stage_changed_at', { ascending: false }),
          supabase
            .from('interviews')
            .select('*')
            .eq('learner_id', learnerId)
            .in('status', ['scheduled', 'confirmed', 'pending'])
            .order('date', { ascending: true }),
        ]);

        const { data: applications, error: appsError } = applicationsResult;
        if (appsError) return apiDbError(appsError, context.request, { startTime });
        const pipelineStatuses = pipelineResult.data || [];
        const interviews = interviewsResult.data || [];

        const pipelineMap = new Map(pipelineStatuses.map((ps: any) => [ps.opportunity_id, ps]));
        const interviewsMap = new Map();
        interviews.forEach((interview: any) => {
          const key = interview.opportunity_id || interview.job_title;
          if (!interviewsMap.has(key)) interviewsMap.set(key, []);
          interviewsMap.get(key).push(interview);
        });

        const combined = (applications || []).map((app: any) => {
          const opportunityId = app.opportunity?.id;
          const pipelineStatus = opportunityId ? pipelineMap.get(opportunityId) : null;
          const jobInterviews = opportunityId ? interviewsMap.get(opportunityId) : [];
          return {
            ...app,
            pipeline_status: pipelineStatus,
            interviews: jobInterviews || [],
            has_pipeline_status: !!pipelineStatus,
            pipeline_stage: pipelineStatus?.stage || null,
            pipeline_stage_changed_at: pipelineStatus?.stage_changed_at || null,
            rejection_reason: pipelineStatus?.rejection_reason || null,
            next_action: pipelineStatus?.next_action || null,
            next_action_date: pipelineStatus?.next_action_date || null,
            pipeline_recruiter_id: pipelineStatus?.assigned_to || pipelineStatus?.opportunities?.recruiter_id || null,
          };
        });

        return apiSuccess(combined, context.request, { startTime });
      }

      case 'get-placement-records': {
        const { department, year, employmentType, status } = params;
        let query = supabase
          .from('applied_jobs')
          .select(`
            id, application_status, applied_at, viewed_at, responded_at,
            interview_scheduled_at, notes,
            learners!fk_applied_jobs_learner (user_id, name, learner_id, branch_field, course_name, semester),
            opportunities!fk_applied_jobs_opportunity (id, title, company_name, employment_type, location, salary_range_min, salary_range_max, department, posted_date, status)
          `)
          .eq('application_status', status || 'accepted');

        if (department) query = query.eq('learners.branch_field', department);
        if (year) {
          const startDate = `${year}-01-01`;
          const endDate = `${year}-12-31`;
          query = query.gte('applied_at', startDate).lte('applied_at', endDate);
        }
        if (employmentType && employmentType !== 'all') {
          const empType = employmentType === 'full-time' ? 'Full-time' : 'Internship';
          query = query.eq('opportunities.employment_type', empType);
        }

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const records = (data || []).map((record: any) => ({
          id: record.id.toString(),
          learner_name: record.learners?.name || 'Unknown Learner',
          learner_id: record.learners?.learner_id || '',
          company_name: record.opportunities?.company_name || '',
          job_title: record.opportunities?.title || '',
          department: record.learners?.branch_field || '',
          employment_type: record.opportunities?.employment_type as string,
          salary_offered: record.opportunities?.salary_range_max || record.opportunities?.salary_range_min || 0,
          placement_date: record.applied_at,
          status: record.application_status,
          location: record.opportunities?.location || '',
        }));

        return apiSuccess(records, context.request, { startTime });
      }

      case 'get-all-applications': {
        const { department, year, status: appStatus } = params;
        let query = supabase
          .from('applied_jobs')
          .select(`
            id, application_status, applied_at,
            learners!fk_applied_jobs_learner (user_id, name, learner_id, branch_field, course_name),
            opportunities!fk_applied_jobs_opportunity (id, title, company_name, employment_type, location, department)
          `);

        if (department) query = query.eq('learners.branch_field', department);
        if (year) {
          const startDate = `${year}-01-01`;
          const endDate = `${year}-12-31`;
          query = query.gte('applied_at', startDate).lte('applied_at', endDate);
        }
        if (appStatus) query = query.eq('application_status', appStatus);

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-learner-count': {
        const { department } = params;
        let query = supabase.from('learners').select('user_id', { count: 'exact', head: true });
        if (department) query = query.eq('branch_field', department);
        const { count, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ count: count || 0 }, context.request, { startTime });
      }

      case 'get-top-companies': {
        const { limit = 5 } = params;
        const { data, error } = await supabase
          .from('applied_jobs')
          .select(`opportunities!fk_applied_jobs_opportunity (company_name)`)
          .eq('application_status', 'accepted');
        if (error) return apiDbError(error, context.request, { startTime });

        const companyCount = (data || []).reduce((acc: Record<string, number>, record: any) => {
          const name = record.opportunities?.company_name;
          if (name) acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});

        const topCompanies = Object.entries(companyCount)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, Math.min(limit, 100))
          .map(([company, placements]) => ({ company, placements }));

        return apiSuccess(topCompanies, context.request, { startTime });
      }

      case 'get-recent-placements': {
        const { limit = 10 } = params;
        let query = supabase
          .from('applied_jobs')
          .select(`
            id, application_status, applied_at,
            learners!fk_applied_jobs_learner (name, learner_id, branch_field, course_name),
            opportunities!fk_applied_jobs_opportunity (title, company_name, employment_type, location, salary_range_min, salary_range_max)
          `)
          .eq('application_status', 'accepted')
          .order('applied_at', { ascending: false });
        if (limit) query = query.range(0, Math.min(limit, 100) - 1);

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const records = (data || []).map((record: any) => ({
          id: record.id.toString(),
          learner_name: record.learners?.name || 'Unknown Learner',
          learner_id: record.learners?.learner_id || '',
          company_name: record.opportunities?.company_name || '',
          job_title: record.opportunities?.title || '',
          department: record.learners?.branch_field || record.learners?.course_name || '',
          employment_type: record.opportunities?.employment_type as string,
          salary_offered: record.opportunities?.salary_range_max || record.opportunities?.salary_range_min || 0,
          placement_date: record.applied_at,
          status: record.application_status as string,
          location: record.opportunities?.location || '',
        }));

        return apiSuccess(records, context.request, { startTime });
      }

      case 'get-all-learners-analytics': {
        const { department } = params;
        let query = supabase.from('learners').select('branch_field, course_name, id');
        if (department) query = query.eq('branch_field', department);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-all-placements-analytics': {
        const { status } = params;
        let query = supabase
          .from('applied_jobs')
          .select(`
            id, learner_id,
            learners!fk_applied_jobs_learner (branch_field, course_name),
            opportunities!fk_applied_jobs_opportunity (employment_type, salary_range_min, salary_range_max)
          `);
        if (status) query = query.eq('application_status', status);
        else query = query.eq('application_status', 'accepted');

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[placement/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
