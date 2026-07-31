/**
 * College Admin - Course Analytics Dashboard API
 *
 * Dedicated backend for the Course Analytics Dashboard
 * (pages/admin/collegeAdmin/CourseAnalyticsDashboard.tsx), distinct from the
 * existing Reports & Analytics page (functions/api/college-admin/reports.ts),
 * which is not modified by this feature.
 *
 * POST: Action-based data retrieval, action-router pattern matching the rest
 * of this codebase (see reports.ts, academic.ts).
 *
 * Currently implements 'get-kpis', 'get-course-performance',
 * 'get-enrollment-overview', 'get-course-options', 'get-academic-status',
 * 'get-directory-tree', and 'get-learner-directory'.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { PagesEnv } from '../../lib/types';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';
import {
  buildCourseAnalyticsKpis,
  buildCoursePerformanceRows,
  buildEnrollmentOverview,
  buildAcademicStatusOverview,
  buildCourseFilterOptions,
} from '../../lib/courseAnalyticsKpis';
import { buildCollegeStyleDirectoryTree, resolveSectionIdsForYear } from '../../lib/directoryTree';

/** POST body for this action router, as sent by the frontend's college-admin course-analytics queries (src/entities/course-analytics/api/queries.ts). */
interface CourseAnalyticsRequestBody {
  action: string;
  collegeId?: string;
  courseId?: string;
  departmentId?: string;
  academicYear?: string;
  sectionId?: string;
  page?: number;
  pageSize?: number;
}

/** A `program_sections` row as selected by `.select('id')` in 'get-learner-directory'. */
interface SectionRow {
  id: string;
}

/** A `learners` row as selected by `.select('id, name, email, program_section_id')`, referenced by `id` only in 'get-learner-directory'. */
interface LearnerIdRow {
  id: string;
}

/** A `courses` row as selected by `.select('course_id, code')` in 'get-learner-directory'. */
interface CourseRow {
  course_id: string;
  code: string;
}

/** A `learners` row as selected by `.select('id, name, email, program_section_id')` in 'get-learner-directory'. */
interface LearnerRow {
  id: string;
  name: string | null;
  email: string;
  program_section_id: string | null;
}

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const supabase = getServiceClient(context.env as PagesEnv);

  let body: CourseAnalyticsRequestBody;
  try {
    body = await context.request.json() as CourseAnalyticsRequestBody;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, collegeId, courseId, departmentId, academicYear, sectionId, page, pageSize } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);
  }

  const startTime = Date.now();
  // Org scope is always derived from the verified JWT, never trusted from the
  // request body — matches the existing pattern in reports.ts.
  const orgId = user.org_id;

  try {
    switch (action) {
      case 'get-kpis': {
        let learnersQuery = supabase.from('learners').select('id').eq('college_id', orgId);
        if (collegeId) learnersQuery = learnersQuery.eq('college_id', collegeId);
        const { data: collegeLearners } = await learnersQuery;
        const learnerIds = collegeLearners?.map((s) => s.id) || [];

        let enrollQuery = supabase
          .from('course_enrollments')
          .select('id, status, progress, course_id, learner_id, created_at');
        enrollQuery = learnerIds.length > 0
          ? enrollQuery.in('learner_id', learnerIds)
          : enrollQuery.eq('learner_id', '00000000-0000-0000-0000-000000000000');
        const { data: enrollments } = await enrollQuery;

        // LMS Courses is a GLOBAL, platform-wide count — intentionally NOT
        // filtered by organization, learner, or enrollment. select('*') with
        // head:true avoids transferring row data (and avoids naming a
        // specific column — `courses`'s primary key is `course_id`, not `id`).
        const { count: totalCoursesGlobal, error: coursesCountError } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });
        if (coursesCountError) return apiDbError(coursesCountError, context.request, { startTime });

        const kpis = buildCourseAnalyticsKpis(collegeLearners || [], enrollments || [], totalCoursesGlobal ?? 0);

        return apiSuccess({ kpis }, context.request, { startTime });
      }

      case 'get-course-performance': {
        // Same scoping as 'get-kpis': Organization -> Learners -> Enrollments.
        // Paginated (page/pageSize, 1-indexed, default page 1 / size 6 —
        // matches the previous hardcoded top-6 behavior when omitted) instead
        // of a fixed top-N cap — see buildCoursePerformanceRows.
        let learnersQuery = supabase.from('learners').select('id').eq('college_id', orgId);
        if (collegeId) learnersQuery = learnersQuery.eq('college_id', collegeId);
        const { data: collegeLearners } = await learnersQuery;
        const learnerIds = collegeLearners?.map((s) => s.id) || [];

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

        const { rows: coursePerformance, totalCount } = buildCoursePerformanceRows(
          enrollments || [], courses, page || 1, pageSize || 6,
        );

        return apiSuccess({ coursePerformance, totalCount }, context.request, { startTime });
      }

      case 'get-enrollment-overview': {
        // Course Enrollment Overview chart: same Organization -> Learners ->
        // Enrollments scoping as 'get-kpis'/'get-course-performance' — the
        // global `courses` table is used ONLY to resolve course names, never
        // to list all platform courses (that's the separate LMS Courses KPI).
        let learnersQuery = supabase.from('learners').select('id').eq('college_id', orgId);
        if (collegeId) learnersQuery = learnersQuery.eq('college_id', collegeId);
        const { data: collegeLearners } = await learnersQuery;
        const learnerIds = collegeLearners?.map((s) => s.id) || [];

        let enrollQuery = supabase
          .from('course_enrollments')
          .select('id, status, progress, course_id, learner_id, created_at');
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

        const enrollment = buildEnrollmentOverview(enrollments || [], courses);

        return apiSuccess({ enrollment }, context.request, { startTime });
      }

      case 'get-course-options': {
        // Dropdown options for the Academic Status card: DISTINCT courses the
        // org's learners are enrolled in — never the whole `courses` catalog.
        // Same Organization -> Learners -> Enrollments scoping as every other
        // action above.
        let learnersQuery = supabase.from('learners').select('id').eq('college_id', orgId);
        if (collegeId) learnersQuery = learnersQuery.eq('college_id', collegeId);
        const { data: collegeLearners } = await learnersQuery;
        const learnerIds = collegeLearners?.map((s) => s.id) || [];

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
        let learnersQuery = supabase.from('learners').select('id').eq('college_id', orgId);
        if (collegeId) learnersQuery = learnersQuery.eq('college_id', collegeId);
        const { data: collegeLearners } = await learnersQuery;
        const learnerIds = collegeLearners?.map((s) => s.id) || [];

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
        // Recursive Directory Tree: the ACADEMIC STRUCTURE (Department ->
        // Academic Year -> Section) for this college, not something inferred
        // from learners — see lib/directoryTree.ts's buildCollegeStyleDirectoryTree
        // for the full shared implementation (also reused by University Admin
        // and college-type Educators, so the hierarchy logic exists in
        // exactly one place).
        const collegeIdFilter = collegeId || orgId;
        const directoryTree = await buildCollegeStyleDirectoryTree(supabase, collegeIdFilter);
        return apiSuccess({ directoryTree }, context.request, { startTime });
      }

      case 'get-learner-directory': {
        // Learner Directory rows, scoped by whichever Directory Tree node was
        // selected — Department, Academic Year, or Section (mutually
        // exclusive; Section takes precedence if more than one is somehow
        // sent, since it's the most specific). No filter -> every learner in
        // the college, matching every other action's Organization -> Learners
        // scoping convention.
        const collegeIdFilter = collegeId || orgId;

        let sectionIds: string[] | null = null;
        if (sectionId) {
          sectionIds = [sectionId];
        } else if (departmentId && academicYear) {
          sectionIds = await resolveSectionIdsForYear(supabase, departmentId, academicYear);
        }

        let learnersQuery = supabase
          .from('learners')
          .select('id, name, email, program_section_id')
          .eq('college_id', collegeIdFilter);
        if (sectionIds) {
          // A Department-only selection (no year/section) filters by every
          // section under that department instead — resolved the same way
          // the tree groups its own children, so "Department selected" means
          // exactly the learners its Academic Year/Section children would sum to.
          learnersQuery = learnersQuery.in('program_section_id', sectionIds);
        } else if (departmentId) {
          const { data: deptSections, error: deptSectionsError } = await supabase
            .from('program_sections')
            .select('id')
            .eq('department_id', departmentId)
            .eq('status', 'active');
          if (deptSectionsError) return apiDbError(deptSectionsError, context.request, { startTime });
          const deptSectionIds = (deptSections || []).map((s: SectionRow) => s.id);
          learnersQuery = deptSectionIds.length > 0
            ? learnersQuery.in('program_section_id', deptSectionIds)
            : learnersQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }
        const { data: collegeLearners, error: learnersError } = await learnersQuery;
        if (learnersError) return apiDbError(learnersError, context.request, { startTime });

        const learnerIds = (collegeLearners || []).map((l: LearnerIdRow) => l.id);
        let enrollments: {
          learner_id: string; course_id: string | null; course_title: string | null;
          status: string | null; progress: number | null; last_accessed: string | null;
          total_time_spent_seconds: number | null;
        }[] = [];
        if (learnerIds.length > 0) {
          const { data, error: enrollError } = await supabase
            .from('course_enrollments')
            .select('learner_id, course_id, course_title, status, progress, last_accessed, total_time_spent_seconds')
            .in('learner_id', learnerIds)
            .order('last_accessed', { ascending: false });
          if (enrollError) return apiDbError(enrollError, context.request, { startTime });
          enrollments = data || [];
        }

        // One row per learner in the table, so pick each learner's most
        // recently accessed enrollment (rows already ordered above) — the
        // first match per learner_id.
        const latestEnrollmentByLearnerId = new Map<string, typeof enrollments[number]>();
        for (const enrollment of enrollments) {
          if (!latestEnrollmentByLearnerId.has(enrollment.learner_id)) {
            latestEnrollmentByLearnerId.set(enrollment.learner_id, enrollment);
          }
        }

        const courseIds = Array.from(
          new Set(enrollments.map((e) => e.course_id).filter((id): id is string => Boolean(id))),
        );
        let courseCodeById = new Map<string, string>();
        if (courseIds.length > 0) {
          const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('course_id, code')
            .in('course_id', courseIds);
          if (coursesError) return apiDbError(coursesError, context.request, { startTime });
          courseCodeById = new Map((courses || []).map((c: CourseRow) => [c.course_id, c.code]));
        }

        const mapStatus = (status: string | null): 'completed' | 'in_progress' | 'not_started' => {
          if (status === 'completed') return 'completed';
          if (!status || status === 'active' || status === 'in_progress') {
            return status === 'in_progress' ? 'in_progress' : 'not_started';
          }
          return 'not_started';
        };

        const learnerDirectory = (collegeLearners || []).map((learner: LearnerRow) => {
          const enrollment = latestEnrollmentByLearnerId.get(learner.id);
          return {
            id: learner.id,
            name: learner.name || 'Unknown Learner',
            email: learner.email,
            sectionId: learner.program_section_id || '',
            courseCode: enrollment?.course_id ? (courseCodeById.get(enrollment.course_id) || '—') : '—',
            progress: enrollment?.progress ?? 0,
            hours: Math.round(((enrollment?.total_time_spent_seconds ?? 0) / 3600) * 10) / 10,
            status: mapStatus(enrollment?.status ?? null),
            lastActive: enrollment?.last_accessed
              ? new Date(enrollment.last_accessed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—',
            lastCourseLearned: enrollment?.course_title || '—',
          };
        });

        return apiSuccess({ learnerDirectory }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: unknown) {
    console.error(`[course-analytics POST] action=${action}:`, error instanceof Error ? error.message : error);
    return apiDbError(error, context.request, { startTime });
  }
});
