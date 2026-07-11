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
 * Currently implements 'get-kpis', 'get-course-performance',
 * 'get-enrollment-overview', 'get-course-options', 'get-academic-status',
 * 'get-directory-tree', and 'get-learner-directory'.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';
import {
  buildCourseAnalyticsKpis,
  buildCoursePerformanceRows,
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
  resolveSectionIdsForYear,
} from '../../lib/directoryTree';
import type { PagesEnv } from '../../lib/types';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const supabase = getServiceClient(context.env as unknown as PagesEnv);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as Record<string, any>;
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

      case 'get-course-performance': {
        // Same educator->learner scoping as 'get-kpis', reusing
        // getFilteredLearnerRecordIds rather than a new query. Paginated
        // (page/pageSize, 1-indexed, default page 1 / size 6) — see
        // buildCoursePerformanceRows.
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

        const { rows: coursePerformance, totalCount } = buildCoursePerformanceRows(
          enrollments || [], courses, params.page || 1, params.pageSize || 6,
        );

        return apiSuccess({ coursePerformance, totalCount }, context.request, { startTime });
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

      case 'get-learner-directory': {
        // Learner Directory rows, scoped by whichever Directory Tree node was
        // selected — Department, Academic Year, or Section (college-type) /
        // Grade or Section (school-type). Enrollment/course join logic below
        // is identical to College/School Admin's action — same tables, same
        // columns, reused verbatim. The one genuine difference from those
        // roles: every resolved section/class id is intersected with this
        // educator's own assignment allow-list (resolveEducatorCollegeSectionIds
        // / resolveEducatorSchoolClassIds, the same resolvers 'get-directory-tree'
        // already uses), so an educator can never see a learner outside their
        // assigned sections/classes even if an out-of-scope id were somehow
        // sent in the request body.
        const { schoolId, collegeId, educatorType, educatorRole, assignedClassIds, departmentId, academicYear, sectionId, grade } = params;

        // Resolve which learners are in scope first — the branch-specific
        // part (allow-list intersection). The enrollment join/row-shaping
        // below it is identical for both branches, so it's done once instead
        // of duplicated.
        let learnerRows: { id: string; name: string | null; email: string; sectionId: string | null }[] = [];

        if (educatorType === 'college' && collegeId) {
          const allowedSectionIds = await resolveEducatorCollegeSectionIds(supabase, user.id);

          let requestedSectionIds: string[] | null = null;
          if (sectionId) {
            requestedSectionIds = [sectionId];
          } else if (departmentId && academicYear) {
            requestedSectionIds = await resolveSectionIdsForYear(supabase, departmentId, academicYear);
          } else if (departmentId) {
            const { data: deptSections, error: deptSectionsError } = await supabase
              .from('program_sections')
              .select('id')
              .eq('department_id', departmentId)
              .eq('status', 'active');
            if (deptSectionsError) return apiDbError(deptSectionsError, context.request, { startTime });
            requestedSectionIds = (deptSections || []).map((s: { id: string }) => s.id);
          }

          // No node selected -> every section this educator is assigned to;
          // a node selected -> intersect it with that allow-list, never trust
          // the request body's own section scope in isolation.
          const sectionIds = requestedSectionIds
            ? requestedSectionIds.filter((id) => allowedSectionIds.includes(id))
            : allowedSectionIds;

          if (sectionIds.length > 0) {
            const { data: collegeLearners, error: learnersError } = await supabase
              .from('learners')
              .select('id, name, email, program_section_id')
              .eq('college_id', collegeId)
              .in('program_section_id', sectionIds);
            if (learnersError) return apiDbError(learnersError, context.request, { startTime });
            learnerRows = (collegeLearners || []).map((l: { id: string; name: string | null; email: string; program_section_id: string | null }) => ({
              id: l.id, name: l.name, email: l.email, sectionId: l.program_section_id,
            }));
          }
        } else if (educatorType === 'school' && schoolId) {
          const allowedClassIds = await resolveEducatorSchoolClassIds(supabase, schoolId, educatorRole, assignedClassIds);

          let requestedClassIds: string[] | null = null;
          if (sectionId) {
            requestedClassIds = [sectionId];
          } else if (grade) {
            const { data: gradeClasses, error: gradeClassesError } = await supabase
              .from('school_classes')
              .select('id')
              .eq('school_id', schoolId)
              .eq('grade', grade)
              .eq('account_status', 'active');
            if (gradeClassesError) return apiDbError(gradeClassesError, context.request, { startTime });
            requestedClassIds = (gradeClasses || []).map((c: { id: string }) => c.id);
          }

          const classIds = requestedClassIds
            ? requestedClassIds.filter((id) => allowedClassIds.includes(id))
            : allowedClassIds;

          if (classIds.length > 0) {
            const { data: schoolLearnersForDirectory, error: learnersError } = await supabase
              .from('learners')
              .select('id, name, email, school_class_id')
              .eq('school_id', schoolId)
              .in('school_class_id', classIds);
            if (learnersError) return apiDbError(learnersError, context.request, { startTime });
            learnerRows = (schoolLearnersForDirectory || []).map((l: { id: string; name: string | null; email: string; school_class_id: string | null }) => ({
              id: l.id, name: l.name, email: l.email, sectionId: l.school_class_id,
            }));
          }
        }

        // Enrollment/course join logic below is identical to College/School
        // Admin's action — same tables, same columns, reused verbatim.
        const learnerIds = learnerRows.map((l) => l.id);
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
          courseCodeById = new Map((courses || []).map((c: { course_id: string; code: string }) => [c.course_id, c.code]));
        }

        const mapStatus = (status: string | null): 'completed' | 'in_progress' | 'not_started' => {
          if (status === 'completed') return 'completed';
          if (!status || status === 'active' || status === 'in_progress') {
            return status === 'in_progress' ? 'in_progress' : 'not_started';
          }
          return 'not_started';
        };

        const learnerDirectory = learnerRows.map((learner) => {
          const enrollment = latestEnrollmentByLearnerId.get(learner.id);
          return {
            id: learner.id,
            name: learner.name || 'Unknown Learner',
            email: learner.email,
            sectionId: learner.sectionId || '',
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
    console.error(`[educator course-analytics POST] action=${action}:`, error instanceof Error ? error.message : error);
    return apiDbError(error, context.request, { startTime });
  }
});
