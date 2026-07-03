/**
 * Educator - Course Analytics Dashboard API
 *
 * Dedicated backend for the Course Analytics Dashboard
 * (pages/educator/CourseAnalyticsDashboard.tsx). Mirrors
 * functions/api/college-admin/course-analytics.ts, but learner scoping reuses
 * the existing `getFilteredLearnerRecordIds` from
 * functions/api/analytics/educator.ts (already implements assigned-section
 * scoping for both school and college educators) instead of a new query.
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
import { getFilteredLearnerRecordIds } from '../analytics/educator';
import {
  buildCollegeStyleDirectoryTree,
  buildSchoolStyleDirectoryTree,
  resolveEducatorCollegeSectionIds,
  resolveEducatorSchoolClassIds,
} from '../../lib/directoryTree';

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

  const { action, ...params } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);
  }

  const startTime = Date.now();

  try {
    switch (action) {
      case 'get-kpis': {
        // Reuses the existing educator->learner scoping (assigned school
        // class / college program_sections.faculty_id) rather than a new
        // query. `params` carries schoolId/collegeId/educatorType/
        // educatorRole/assignedClassIds, same contract as
        // functions/api/analytics/educator.ts's own 'get-kpi-data' action.
        const learnerIds = await getFilteredLearnerRecordIds(supabase, params, user.id);

        const educatorLearners = learnerIds.map((id) => ({ id }));

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

        const kpis = buildCourseAnalyticsKpis(educatorLearners, enrollments || [], totalCoursesGlobal ?? 0);

        return apiSuccess({ kpis }, context.request, { startTime });
      }

      case 'get-enrollment-overview': {
        // Same educator->learner scoping as 'get-kpis', reusing
        // getFilteredLearnerRecordIds rather than a new query.
        const learnerIds = await getFilteredLearnerRecordIds(supabase, params, user.id);

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
        // educator's scoped learners are enrolled in — never the whole
        // `courses` catalog. Same educator->learner scoping as 'get-kpis'.
        const learnerIds = await getFilteredLearnerRecordIds(supabase, params, user.id);

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
        // Academic Status & Retention: same educator->learner scoping as
        // 'get-kpis', then optional single-course filter -> 4-bucket
        // partition (see buildAcademicStatusOverview for the bucket rules).
        const learnerIds = await getFilteredLearnerRecordIds(supabase, params, user.id);

        let enrollQuery = supabase
          .from('course_enrollments')
          .select('id, status, progress, course_id, learner_id, created_at, last_accessed');
        enrollQuery = learnerIds.length > 0
          ? enrollQuery.in('learner_id', learnerIds)
          : enrollQuery.eq('learner_id', '00000000-0000-0000-0000-000000000000');
        const courseId = params.courseId;
        if (courseId && courseId !== 'all') enrollQuery = enrollQuery.eq('course_id', courseId);
        const { data: enrollments } = await enrollQuery;

        const academicStatus = buildAcademicStatusOverview(enrollments || []);

        return apiSuccess({ academicStatus }, context.request, { startTime });
      }

      case 'get-directory-tree': {
        // Recursive Directory Tree, restricted to only this educator's own
        // assigned classes/sections. Reuses the SAME canonical hierarchy as
        // College/School Admin (lib/directoryTree.ts) rather than inventing
        // a separate one — the college/school-shaped builders just receive a
        // section/class id allow-list instead of the admin's whole
        // catalog. Never flattens straight to a learner-id list the way
        // getFilteredLearnerRecordIds does for KPI purposes — the
        // section/class structure is resolved and preserved first.
        const { schoolId, collegeId, educatorType, educatorRole, assignedClassIds } = params;

        let directoryTree: Awaited<ReturnType<typeof buildCollegeStyleDirectoryTree>> = [];
        if (educatorType === 'college' && collegeId) {
          const sectionIds = await resolveEducatorCollegeSectionIds(supabase, user.id);
          directoryTree = await buildCollegeStyleDirectoryTree(supabase, collegeId, sectionIds);
        } else if (educatorType === 'school' && schoolId) {
          const classIds = await resolveEducatorSchoolClassIds(supabase, schoolId, educatorRole, assignedClassIds);
          directoryTree = await buildSchoolStyleDirectoryTree(supabase, schoolId, classIds);
        }

        return apiSuccess({ directoryTree }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[educator course-analytics POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
