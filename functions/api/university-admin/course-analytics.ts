/**
 * University Admin - Course Analytics Dashboard API
 *
 * Dedicated backend for the Course Analytics Dashboard
 * (pages/admin/universityAdmin/CourseAnalyticsDashboard.tsx). Mirrors
 * functions/api/college-admin/course-analytics.ts, but learner scoping is a
 * two-step lookup (verified against the codebase's only real precedent,
 * functions/api/messaging/actions.ts's handleFetchLearnersByPrograms):
 *
 *   university_colleges WHERE university_id = orgId  -->  college ids
 *   learners WHERE university_college_id IN (college ids)
 *
 * NOT the ambiguous `organizationType === 'university' -> college_id` or
 * `.eq('universityId', orgId)` branches found in organization/handler.ts,
 * which have no other usage elsewhere in the codebase and are not a verified
 * convention for this purpose.
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
import { buildCollegeStyleDirectoryTree, type DirectoryTreeNode } from '../../lib/directoryTree';

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

  const { action, courseId } = body;
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
        // Step 1: resolve this university's colleges.
        const { data: universityColleges } = await supabase
          .from('university_colleges')
          .select('id')
          .eq('university_id', orgId);
        const collegeIds = universityColleges?.map((c) => c.id) || [];

        // Step 2: learners scoped to those colleges via university_college_id.
        let learnersQuery = supabase.from('learners').select('id');
        learnersQuery = collegeIds.length > 0
          ? learnersQuery.in('university_college_id', collegeIds)
          : learnersQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        const { data: universityLearners } = await learnersQuery;
        const learnerIds = universityLearners?.map((s) => s.id) || [];

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

        const kpis = buildCourseAnalyticsKpis(universityLearners || [], enrollments || [], totalCoursesGlobal ?? 0);

        return apiSuccess({ kpis }, context.request, { startTime });
      }

      case 'get-enrollment-overview': {
        // Same two-step scoping as 'get-kpis': university -> university_colleges -> learners.
        const { data: universityColleges } = await supabase
          .from('university_colleges')
          .select('id')
          .eq('university_id', orgId);
        const collegeIds = universityColleges?.map((c) => c.id) || [];

        let learnersQuery = supabase.from('learners').select('id');
        learnersQuery = collegeIds.length > 0
          ? learnersQuery.in('university_college_id', collegeIds)
          : learnersQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        const { data: universityLearners } = await learnersQuery;
        const learnerIds = universityLearners?.map((s) => s.id) || [];

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
        const { data: universityColleges } = await supabase
          .from('university_colleges')
          .select('id')
          .eq('university_id', orgId);
        const collegeIds = universityColleges?.map((c) => c.id) || [];

        let learnersQuery = supabase.from('learners').select('id');
        learnersQuery = collegeIds.length > 0
          ? learnersQuery.in('university_college_id', collegeIds)
          : learnersQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        const { data: universityLearners } = await learnersQuery;
        const learnerIds = universityLearners?.map((s) => s.id) || [];

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
        // Academic Status & Retention: same two-step scoping as 'get-kpis',
        // then optional single-course filter -> 4-bucket partition (see
        // buildAcademicStatusOverview for the bucket rules).
        const { data: universityColleges } = await supabase
          .from('university_colleges')
          .select('id')
          .eq('university_id', orgId);
        const collegeIds = universityColleges?.map((c) => c.id) || [];

        let learnersQuery = supabase.from('learners').select('id');
        learnersQuery = collegeIds.length > 0
          ? learnersQuery.in('university_college_id', collegeIds)
          : learnersQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        const { data: universityLearners } = await learnersQuery;
        const learnerIds = universityLearners?.map((s) => s.id) || [];

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
        // Recursive Directory Tree: University -> College -> Department ->
        // Academic Year -> Section — the same College Admin academic
        // structure (lib/directoryTree.ts's buildCollegeStyleDirectoryTree),
        // reused once per linked college rather than reinterpreted. A
        // university_college with no linked `college_id` (mapping not yet
        // set up) is skipped, not treated as an error — the tree still
        // renders for every college that IS mapped.
        const { data: universityColleges, error: universityCollegesError } = await supabase
          .from('university_colleges')
          .select('id, name, college_id')
          .eq('university_id', orgId)
          .eq('account_status', 'active');
        if (universityCollegesError) return apiDbError(universityCollegesError, context.request, { startTime });

        const mappedColleges = (universityColleges || []).filter(
          (uc: { college_id: string | null }) => Boolean(uc.college_id),
        );

        const collegeSubtrees = await Promise.all(
          mappedColleges.map(async (uc: { id: string; name: string; college_id: string }) => {
            const children: DirectoryTreeNode[] = await buildCollegeStyleDirectoryTree(supabase, uc.college_id);
            const count = children.reduce((sum, dept) => sum + dept.count, 0);
            return {
              id: uc.id,
              label: uc.name || 'Untitled College',
              level: 'college',
              icon: 'building',
              childrenLabel: 'Departments',
              count,
              children,
            };
          }),
        );

        // Colleges with an empty academic structure (no departments/sections
        // yet) still appear as a node with count 0 and no children, matching
        // "the hierarchy must continue to work even if learner counts are
        // zero" — a missing mapping is the only thing that's skipped, not an
        // empty-but-mapped college.
        const directoryTree = collegeSubtrees
          .slice()
          .sort((a, b) => (a.label || '').localeCompare(b.label || ''));

        return apiSuccess({ directoryTree }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[university-admin course-analytics POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
