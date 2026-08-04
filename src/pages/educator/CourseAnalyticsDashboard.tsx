/**
 * Course Analytics Dashboard Page (route shell) - Educator.
 *
 * Thin page that supplies Educator data to the reusable, role-agnostic
 * `CourseAnalyticsDashboard` widget — the same component College Admin uses.
 * Only the data source (Assigned Course → Assigned Section hierarchy, scoped
 * to this educator's own assignments) differs.
 *
 * A separate page from the existing `pages/educator/CourseAnalytics.jsx`
 * (a live, backend-connected per-course enrollment detail page for a single
 * `:courseId` route param), which stays untouched.
 *
 * KPI cards, Course Enrollment Overview, Course Performance Overview, the
 * Academic Status & Retention card (including its course dropdown), the
 * Recursive Directory Tree (restricted to only this educator's assigned
 * classes/sections, reusing the same College/School academic structure), and
 * the Learner Directory are now backend-connected
 * (functions/api/educator/course-analytics.ts, actions 'get-kpis',
 * 'get-course-performance', 'get-enrollment-overview', 'get-course-options',
 * 'get-academic-status', 'get-directory-tree', and 'get-learner-directory'),
 * following the exact same pattern as College/School/University Admin.
 * Reuses `useEducatorSchool` (the same hook `pages/educator/Analytics.tsx`
 * already uses) to resolve the educator's school/college/class-assignment
 * scope, rather than re-deriving it. Selecting a Department, Academic Year,
 * or Section (college-type) / Grade or Section (school-type) in the tree
 * drives the Learner Directory query below, restricted server-side to only
 * this educator's own assigned sections/classes regardless of what's
 * selected.
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';
import { CourseAnalyticsDashboard } from '@/widgets/course-analytics-dashboard';
import {
  getEducatorCourseAnalyticsKpis,
  getEducatorCoursePerformance,
  getEducatorEnrollmentOverview,
  getEducatorCourseOptions,
  getEducatorAcademicStatus,
  getEducatorDirectoryTree,
  getEducatorLearnerDirectory,
  type LearnerDirectoryFilter,
} from '@/entities/course-analytics';
import { useEducatorSchool } from '@/features/educator/model/useEducatorSchool';

export default function CourseAnalyticsDashboardPage() {
  const {
    school: educatorSchool,
    college: educatorCollege,
    educatorType,
    educatorRole,
    assignedClassIds,
    loading: scopeLoading,
  } = useEducatorSchool();

  const scope = {
    schoolId: educatorSchool?.id,
    collegeId: educatorCollege?.id,
    educatorType,
    educatorRole,
    assignedClassIds,
  };
  const scopeEnabled = !scopeLoading && Boolean(educatorSchool?.id || educatorCollege?.id);

  // Every query below is gated on the scope having resolved (same dependency
  // useAnalytics has on useEducatorSchool elsewhere).
  const { data: kpis } = useQuery({
    queryKey: [
      'course-analytics',
      'educator',
      'kpis',
      educatorSchool?.id,
      educatorCollege?.id,
      educatorType,
      assignedClassIds,
    ],
    queryFn: () => getEducatorCourseAnalyticsKpis(scope),
    enabled: scopeEnabled,
  });
  const { data: enrollment } = useQuery({
    queryKey: [
      'course-analytics',
      'educator',
      'enrollment-overview',
      educatorSchool?.id,
      educatorCollege?.id,
      educatorType,
      assignedClassIds,
    ],
    queryFn: () => getEducatorEnrollmentOverview(scope),
    enabled: scopeEnabled,
  });

  // Pagination lives here (lifted out of the widget, same pattern as
  // selectedCourseId/selectedNode below) so it can drive the
  // 'get-course-performance' query; the widget accepts it as a controlled
  // prop pair (coursePerformancePage / onCoursePerformancePageChange).
  const [coursePerformancePage, setCoursePerformancePage] = useState(1);
  const COURSE_PERFORMANCE_PAGE_SIZE = 6;

  // placeholderData: keepPreviousData keeps returning the previous page's
  // rows while the next page is fetching — see the identical College Admin
  // page for why this prevents a flicker on page change.
  const { data: coursePerformanceResult } = useQuery({
    queryKey: [
      'course-analytics',
      'educator',
      'course-performance',
      educatorSchool?.id,
      educatorCollege?.id,
      educatorType,
      assignedClassIds,
      coursePerformancePage,
    ],
    queryFn: () => getEducatorCoursePerformance(scope, { page: coursePerformancePage, pageSize: COURSE_PERFORMANCE_PAGE_SIZE }),
    enabled: scopeEnabled,
    placeholderData: keepPreviousData,
  });
  const coursePerformance = coursePerformanceResult?.rows;
  const coursePerformanceTotalCount = coursePerformanceResult?.totalCount ?? 0;

  // Real, scope-limited course dropdown (DISTINCT courses the educator's
  // assigned learners are enrolled in) — replaces the hardcoded mock course
  // list.
  const { data: courseOptions } = useQuery({
    queryKey: [
      'course-analytics',
      'educator',
      'course-options',
      educatorSchool?.id,
      educatorCollege?.id,
      educatorType,
      assignedClassIds,
    ],
    queryFn: () => getEducatorCourseOptions(scope),
    enabled: scopeEnabled,
  });
  const filters = [
    {
      id: 'course',
      label: 'Course',
      options: [{ value: 'all', label: 'All Courses' }, ...(courseOptions ?? [])],
    },
  ];

  // Selection lives here (lifted out of the widget) so it can drive the
  // 'get-academic-status' query below; the widget accepts it as a controlled
  // prop pair (selectedCourseId / onSelectedCourseIdChange).
  const [selectedCourseId, setSelectedCourseId] = useState('all');

  // placeholderData: keepPreviousData keeps returning the last successful
  // course's data while a new `selectedCourseId` is fetching, instead of
  // `data` briefly going `undefined` on every query-key change — avoids a
  // blank Academic Status card on every course switch, not just first load.
  const { data: academicStatus, isFetching: isAcademicStatusFetching } = useQuery({
    queryKey: [
      'course-analytics',
      'educator',
      'academic-status',
      educatorSchool?.id,
      educatorCollege?.id,
      educatorType,
      assignedClassIds,
      selectedCourseId,
    ],
    queryFn: () => getEducatorAcademicStatus(scope, selectedCourseId),
    enabled: scopeEnabled,
    placeholderData: keepPreviousData,
  });

  // Real, scope-limited Recursive Directory Tree (only this educator's
  // assigned classes/sections).
  const { data: directoryTree } = useQuery({
    queryKey: [
      'course-analytics',
      'educator',
      'directory-tree',
      educatorSchool?.id,
      educatorCollege?.id,
      educatorType,
      assignedClassIds,
    ],
    queryFn: () => getEducatorDirectoryTree(scope),
    enabled: scopeEnabled,
  });

  // Selection lives here (lifted out of the widget, same pattern as
  // selectedCourseId above) so it can drive the 'get-learner-directory'
  // query below; the widget accepts it as a controlled prop pair
  // (selectedSectionId / onSelectedSectionChange).
  const [selectedNode, setSelectedNode] = useState<{ id: string; level: string } | null>(null);

  // School's Grade node also uses level: 'academic-year' (same generic label
  // College's Year node uses — see buildSchoolStyleDirectoryTree), so the two
  // shapes can't be told apart by level alone; educatorType (already resolved
  // above) disambiguates which filter field the id maps to. Department/
  // Academic Year/Section (college) and Grade/Section (school) reuse the
  // exact same derivation as College/School Admin's pages, since they're
  // produced by the same buildCollegeStyleDirectoryTree /
  // buildSchoolStyleDirectoryTree calls, just pre-restricted to this
  // educator's own sections/classes.
  const learnerDirectoryFilter: LearnerDirectoryFilter = (() => {
    if (!selectedNode) return {};
    if (selectedNode.level === 'section') return { sectionId: selectedNode.id };
    if (selectedNode.level === 'academic-year') {
      if (educatorType === 'school') {
        const parts = selectedNode.id.split('grade::');
        const grade = parts.length > 1 ? parts[1] : '';
        return { grade };
      }
      const parts = selectedNode.id.split('::');
      const [departmentId, academicYear] = parts.length === 2 ? parts : ['', ''];
      return { departmentId, academicYear };
    }
    if (selectedNode.level === 'department') return { departmentId: selectedNode.id };
    return {};
  })();

  // placeholderData: keepPreviousData keeps returning the previous
  // selection's real rows while a new node's query is in flight — see the
  // identical College Admin page for why this prevents the auto-scroll from
  // firing on an intermediate render.
  const { data: learnerDirectory } = useQuery({
    queryKey: [
      'course-analytics',
      'educator',
      'learner-directory',
      educatorSchool?.id,
      educatorCollege?.id,
      educatorType,
      assignedClassIds,
      selectedNode?.id ?? null,
    ],
    queryFn: () => getEducatorLearnerDirectory(scope, learnerDirectoryFilter),
    enabled: scopeEnabled,
    placeholderData: keepPreviousData,
  });

  // No mock fallback — see the identical College Admin page for why `loading`
  // only gates the queries that drive the INITIAL paint, not the
  // keepPreviousData ones. Also true while the educator's own scope
  // (school/college/class assignment) hasn't resolved yet, since no query
  // below even fires until `scopeEnabled`.
  const loading = scopeLoading || !kpis || !enrollment || !directoryTree || !courseOptions;

  const data = {
    kpis: kpis ?? [],
    enrollment: enrollment ?? [],
    coursePerformance: coursePerformance ?? [],
    filters,
    academicStatusByCourse: academicStatus ? { [selectedCourseId]: academicStatus } : {},
    directoryTree: directoryTree ?? [],
    learnerDirectory: learnerDirectory ?? [],
    totalLearnerRecords: learnerDirectory?.length ?? 0,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CourseAnalyticsDashboard
        data={data}
        loading={loading}
        role="educator"
        selectedCourseId={selectedCourseId}
        onSelectedCourseIdChange={setSelectedCourseId}
        academicStatusFetching={isAcademicStatusFetching}
        selectedSectionId={selectedNode?.id ?? null}
        onSelectedSectionChange={setSelectedNode}
        coursePerformancePage={coursePerformancePage}
        onCoursePerformancePageChange={setCoursePerformancePage}
        coursePerformanceTotalCount={coursePerformanceTotalCount}
        coursePerformancePageSize={COURSE_PERFORMANCE_PAGE_SIZE}
      />
    </div>
  );
}
