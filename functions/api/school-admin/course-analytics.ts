/**
 * School Admin - Course Analytics Dashboard API
 *
 * Dedicated backend for the Course Analytics Dashboard
 * (pages/admin/schoolAdmin/CourseAnalyticsDashboard.tsx). Mirrors
 * functions/api/college-admin/course-analytics.ts exactly — only the learner
 * scoping column differs (learners.school_id instead of .college_id), per the
 * existing project convention (see organization/handler.ts:519).
 *
 * POST: Action-based data retrieval, action-router pattern matching the rest
 * of this codebase.
 *
 * Currently implements 'get-kpis', 'get-enrollment-overview',
 * 'get-course-options', 'get-academic-status', and 'get-directory-tree';
 * Course Performance and the Learner Directory itself stay on mock data
 * until built out in follow-up work.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';
import {
  buildCourseAnalyticsKpis,
  buildEnrollmentOverview,
  buildAcademicStatusOverview,
  buildCourseFilterOptions,
} from '../../lib/courseAnalyticsKpis';
import { buildSchoolStyleDirectoryTree } from '../../lib/directoryTree';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
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

  const { action, schoolId, courseId } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);
  }

  const startTime = Date.now();
  // Org scope is always derived from the verified JWT, never trusted from the
  // request body — matches the existing pattern in college-admin/course-analytics.ts.
  const orgId = user.org_id;

  try {
    switch (action) {
      case 'get-kpis': {
        let learnersQuery = supabase.from('learners').select('id').eq('school_id', orgId);
        if (schoolId) learnersQuery = learnersQuery.eq('school_id', schoolId);
        const { data: schoolLearners } = await learnersQuery;
        const learnerIds = schoolLearners?.map((s) => s.id) || [];

        let enrollQuery = supabase
          .from('course_enrollments')
          .select('id, status, progress, course_id, learner_id, created_at');
        enrollQuery = learnerIds.length > 0
          ? enrollQuery.in('learner_id', learnerIds)
          : enrollQuery.eq('learner_id', '00000000-0000-0000-0000-000000000000');
        const { data: enrollments } = await enrollQuery;

        // LMS Courses is a GLOBAL, platform-wide count — intentionally NOT
        // filtered by organization, learner, or enrollment.
        const { count: totalCoursesGlobal, error: coursesCountError } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });
        if (coursesCountError) return apiDbError(coursesCountError, context.request, { startTime });

        const kpis = buildCourseAnalyticsKpis(schoolLearners || [], enrollments || [], totalCoursesGlobal ?? 0);

        return apiSuccess({ kpis }, context.request, { startTime });
      }

      case 'get-enrollment-overview': {
        // Same scoping as 'get-kpis': Organization -> Learners -> Enrollments.
        let learnersQuery = supabase.from('learners').select('id').eq('school_id', orgId);
        if (schoolId) learnersQuery = learnersQuery.eq('school_id', schoolId);
        const { data: schoolLearners } = await learnersQuery;
        const learnerIds = schoolLearners?.map((s) => s.id) || [];

        let enrollQuery = supabase
          .from('course_enrollments')
          .select('id, status, progress, course_id, learner_id, created_at');
        enrollQuery = learnerIds.length > 0
          ? enrollQuery.in('learner_id', learnerIds)
          : enrollQuery.eq('learner_id', '00000000-0000-0000-0000-000000000000');
        const { data: enrollments } = await enrollQuery;

        // Course titles/categories for the courses actually enrolled in —
        // not the global catalog (that's only for the LMS Courses KPI).
        const courseIds = Array.from(
          new Set((enrollments || []).map((e) => e.course_id).filter((id): id is string => Boolean(id))),
        );
        let courses: { course_id: string; title: string | null; category: string | null }[] = [];
        if (courseIds.length > 0) {
          const { data, error: coursesError } = await supabase
            .from('courses')
            .select('course_id, title, category')
            .in('course_id', courseIds);
          if (coursesError) return apiDbError(coursesError, context.request, { startTime });
          courses = data || [];
        }

        const enrollment = buildEnrollmentOverview(enrollments || [], courses);

        return apiSuccess({ enrollment }, context.request, { startTime });
      }

      case 'get-course-options': {
        // Dropdown options for the Academic Status card: DISTINCT courses the
        // org's learners are enrolled in — never the whole `courses` catalog.
        let learnersQuery = supabase.from('learners').select('id').eq('school_id', orgId);
        if (schoolId) learnersQuery = learnersQuery.eq('school_id', schoolId);
        const { data: schoolLearners } = await learnersQuery;
        const learnerIds = schoolLearners?.map((s) => s.id) || [];

        let enrollQuery = supabase.from('course_enrollments').select('course_id, learner_id');
        enrollQuery = learnerIds.length > 0
          ? enrollQuery.in('learner_id', learnerIds)
          : enrollQuery.eq('learner_id', '00000000-0000-0000-0000-000000000000');
        const { data: enrollments } = await enrollQuery;

        const courseIds = Array.from(
          new Set((enrollments || []).map((e) => e.course_id).filter((id): id is string => Boolean(id))),
        );
        let courses: { course_id: string; title: string | null; category: string | null }[] = [];
        if (courseIds.length > 0) {
          const { data, error: coursesError } = await supabase
            .from('courses')
            .select('course_id, title, category')
            .in('course_id', courseIds);
          if (coursesError) return apiDbError(coursesError, context.request, { startTime });
          courses = data || [];
        }

        const courseOptions = buildCourseFilterOptions(courses);

        return apiSuccess({ courseOptions }, context.request, { startTime });
      }

      case 'get-academic-status': {
        // Academic Status & Retention: Organization -> Learners ->
        // Enrollments -> optional single-course filter -> 4-bucket partition
        // (see buildAcademicStatusOverview for the bucket rules).
        let learnersQuery = supabase.from('learners').select('id').eq('school_id', orgId);
        if (schoolId) learnersQuery = learnersQuery.eq('school_id', schoolId);
        const { data: schoolLearners } = await learnersQuery;
        const learnerIds = schoolLearners?.map((s) => s.id) || [];

        let enrollQuery = supabase
          .from('course_enrollments')
          .select('id, status, progress, course_id, learner_id, created_at, last_accessed');
        enrollQuery = learnerIds.length > 0
          ? enrollQuery.in('learner_id', learnerIds)
          : enrollQuery.eq('learner_id', '00000000-0000-0000-0000-000000000000');
        if (courseId && courseId !== 'all') enrollQuery = enrollQuery.eq('course_id', courseId);
        const { data: enrollments } = await enrollQuery;

        const academicStatus = buildAcademicStatusOverview(enrollments || []);

        return apiSuccess({ academicStatus }, context.request, { startTime });
      }

      case 'get-directory-tree': {
        // Recursive Directory Tree: Grade -> Section, the school's existing
        // academic structure (school_classes — no department level for
        // School Admin, confirmed against the table schema). See
        // lib/directoryTree.ts's buildSchoolStyleDirectoryTree for the full
        // shared implementation (also reused by school-type Educators).
        const schoolIdFilter = schoolId || orgId;
        const directoryTree = await buildSchoolStyleDirectoryTree(supabase, schoolIdFilter);
        return apiSuccess({ directoryTree }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[school-admin course-analytics POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
