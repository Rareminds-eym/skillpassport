/**
 * College Admin - Reports API
 * GET: Fetch saved reports
 * POST: Action-based report data retrieval (attendance, performance, placement, etc.)
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const reportType = url.searchParams.get('type') || 'summary';

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('type', reportType)
    .order('created_at', { ascending: false });

  if (error) return apiDbError(error, context.request);
  return apiSuccess({ reports: data }, context.request);
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, collegeId, dateRange, department, semester } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);
  }

  const startTime = Date.now();
  const orgId = user.org_id;

  try {
    switch (action) {
      case 'attendance': {
        const learnersQuery = supabase.from('learners').select('id, college_id').eq('college_id', orgId);
        const { data: learners } = await learnersQuery;

        let attendanceQuery = supabase
          .from('college_attendance_records')
          .select('id, status, date, learner_id, department_name, session_id');

        if (collegeId) {
          const { data: sessions } = await supabase
            .from('college_attendance_sessions')
            .select('id')
            .eq('college_id', collegeId);
          const sessionIds = sessions?.map(s => s.id) || [];
          if (sessionIds.length > 0) attendanceQuery = attendanceQuery.in('session_id', sessionIds);
        }

        const { data: attendanceRecords } = await attendanceQuery;

        let deptQuery = supabase.from('departments').select('id, name, code');
        if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
        const { data: departments } = await deptQuery;

        return apiSuccess({ learners, attendanceRecords, departments }, context.request, { startTime });
      }

      case 'performance': {
        let learnersQuery = supabase.from('learners').select('id').eq('college_id', orgId);
        if (collegeId) learnersQuery = learnersQuery.eq('college_id', collegeId);
        const { data: collegeLearners } = await learnersQuery;
        const learnerIds = collegeLearners?.map(s => s.id) || [];

        let markQuery = supabase.from('mark_entries').select('marks_obtained, grade, learner_id, assessment_id');
        markQuery = learnerIds.length > 0
          ? markQuery.in('learner_id', learnerIds)
          : markQuery.eq('learner_id', '00000000-0000-0000-0000-000000000000');
        const { data: markEntries } = await markQuery;

        let deptQuery = supabase.from('departments').select('id, name');
        if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
        const { data: departments } = await deptQuery;
        const departmentIds = departments?.map(d => d.id) || [];

        let assessQuery = supabase.from('assessments').select('id, total_marks, pass_marks, department_id');
        assessQuery = departmentIds.length > 0
          ? assessQuery.in('department_id', departmentIds)
          : assessQuery.eq('department_id', '00000000-0000-0000-0000-000000000000');
        const { data: assessments } = await assessQuery;

        return apiSuccess({ markEntries, assessments, departments }, context.request, { startTime });
      }

      case 'placement': {
        let learnersQuery = supabase.from('learners').select('id').eq('college_id', orgId);
        if (collegeId) learnersQuery = learnersQuery.eq('college_id', collegeId);
        const { data: collegeLearners } = await learnersQuery;
        const learnerIds = collegeLearners?.map(s => s.id) || [];

        let candidatesQuery = supabase.from('pipeline_candidates').select('id, stage, status, added_at, learner_id');
        candidatesQuery = learnerIds.length > 0
          ? candidatesQuery.in('learner_id', learnerIds)
          : candidatesQuery.eq('learner_id', '00000000-0000-0000-0000-000000000000');
        const { data: candidates } = await candidatesQuery;

        const { data: companies } = await supabase.from('companies').select('id');

        let offersQuery = supabase.from('placement_offers').select('package_amount, status, offer_date').eq('status', 'accepted');
        if (collegeId) offersQuery = offersQuery.eq('college_id', collegeId);
        const { data: placementOffers } = await offersQuery;

        let deptQuery = supabase.from('departments').select('id, name');
        if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
        const { data: departments } = await deptQuery;

        return apiSuccess({ candidates, companies, placementOffers, departments, learnerIds }, context.request, { startTime });
      }

      case 'skill-analytics': {
        let learnersQuery = supabase.from('learners').select('id').eq('college_id', orgId);
        if (collegeId) learnersQuery = learnersQuery.eq('college_id', collegeId);
        const { data: collegeLearners } = await learnersQuery;
        const learnerIds = collegeLearners?.map(s => s.id) || [];

        let enrollQuery = supabase.from('course_enrollments').select('id, status, progress, course_id, learner_id, created_at');
        enrollQuery = learnerIds.length > 0
          ? enrollQuery.in('learner_id', learnerIds)
          : enrollQuery.eq('learner_id', '00000000-0000-0000-0000-000000000000');
        const { data: enrollments } = await enrollQuery;

        const { data: courses } = await supabase.from('courses').select('id, title, category');

        let deptQuery = supabase.from('departments').select('id, name');
        if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
        const { data: departments } = await deptQuery;

        return apiSuccess({ enrollments, courses, departments }, context.request, { startTime });
      }

      case 'budget': {
        const { data: budgets } = await supabase.from('department_budgets').select('id, department_id, budget_heads, status, period_from, period_to');

        let deptQuery = supabase.from('departments').select('id, name');
        if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
        const { data: departments } = await deptQuery;

        return apiSuccess({ budgets, departments }, context.request, { startTime });
      }

      case 'exam-progress': {
        let examQuery = supabase.from('exam_windows').select('id, window_name, status, start_date, end_date, is_published');
        if (collegeId) examQuery = examQuery.eq('college_id', collegeId);
        const { data: examWindows } = await examQuery;

        const { data: registrations } = await supabase.from('exam_registrations').select('id, status, fee_paid');

        let deptQuery = supabase.from('departments').select('id, name');
        if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
        const { data: departments } = await deptQuery;

        return apiSuccess({ examWindows, registrations, departments }, context.request, { startTime });
      }

      case 'departments': {
        let deptQuery = supabase.from('departments').select('id, name, code').order('name');
        if (collegeId) deptQuery = deptQuery.eq('college_id', collegeId);
        const { data: departments, error: deptError } = await deptQuery;
        if (deptError) return apiDbError(deptError, context.request, { startTime });
        return apiSuccess(departments || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[reports POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
