/**
 * Course Analytics Dashboard Page (route shell) - School Admin.
 *
 * Thin page that supplies School Admin data to the reusable, role-agnostic
 * `CourseAnalyticsDashboard` widget — the same component College Admin uses.
 * Only the data source (Grade → Section hierarchy) differs.
 *
 * KPI cards, Course Enrollment Overview, Course Performance Overview, the
 * Academic Status & Retention card (including its course dropdown), the
 * Recursive Directory Tree (Grade -> Section, from school_classes), and the
 * Learner Directory are now backend-connected
 * (functions/api/school-admin/course-analytics.ts, actions 'get-kpis',
 * 'get-course-performance', 'get-enrollment-overview', 'get-course-options',
 * 'get-academic-status', 'get-directory-tree', and 'get-learner-directory'),
 * following the exact same pattern as College Admin. Selecting a Grade or
 * Section in the tree drives the Learner Directory query below — School has
 * no Department level, so only `grade`/`sectionId` are used from the shared
 * LearnerDirectoryFilter (unlike College's departmentId/academicYear).
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';
import { CourseAnalyticsDashboard } from '@/widgets/course-analytics-dashboard';
import {
  getSchoolCourseAnalyticsKpis,
  getSchoolCoursePerformance,
  getSchoolEnrollmentOverview,
  getSchoolCourseOptions,
  getSchoolAcademicStatus,
  getSchoolDirectoryTree,
  getSchoolLearnerDirectory,
  type LearnerDirectoryFilter,
} from '@/entities/course-analytics';

export default function CourseAnalyticsDashboardPage() {
  const { data: kpis } = useQuery({
    queryKey: ['course-analytics', 'school-admin', 'kpis'],
    queryFn: getSchoolCourseAnalyticsKpis,
  });
  const { data: enrollment } = useQuery({
    queryKey: ['course-analytics', 'school-admin', 'enrollment-overview'],
    queryFn: getSchoolEnrollmentOverview,
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
    queryKey: ['course-analytics', 'school-admin', 'course-performance', coursePerformancePage],
    queryFn: () => getSchoolCoursePerformance({ page: coursePerformancePage, pageSize: COURSE_PERFORMANCE_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const coursePerformance = coursePerformanceResult?.rows;
  const coursePerformanceTotalCount = coursePerformanceResult?.totalCount ?? 0;

  // Real, organization-scoped course dropdown (DISTINCT courses the org's
  // learners are enrolled in) — replaces the hardcoded mock course list.
  const { data: courseOptions } = useQuery({
    queryKey: ['course-analytics', 'school-admin', 'course-options'],
    queryFn: getSchoolCourseOptions,
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
    queryKey: ['course-analytics', 'school-admin', 'academic-status', selectedCourseId],
    queryFn: () => getSchoolAcademicStatus(selectedCourseId),
    placeholderData: keepPreviousData,
  });

  // Real, organization-scoped Recursive Directory Tree (Grade -> Section,
  // from school_classes) — replaces the hardcoded mock hierarchy.
  const { data: directoryTree } = useQuery({
    queryKey: ['course-analytics', 'school-admin', 'directory-tree'],
    queryFn: getSchoolDirectoryTree,
  });

  // Selection lives here too (lifted out of the widget, same pattern as
  // selectedCourseId above) so it can drive the 'get-learner-directory'
  // query below; the widget accepts it as a controlled prop pair
  // (selectedSectionId / onSelectedSectionChange).
  const [selectedNode, setSelectedNode] = useState<{ id: string; level: string } | null>(null);

  // Grade nodes use a synthetic composite id (`grade::${grade}`, e.g.
  // "grade::Grade 8" — see buildSchoolStyleDirectoryTree) and are labeled
  // level: 'academic-year' (School has no separate Department level, so its
  // one branch level reuses that generic level string). Section nodes map
  // straight to their own school_classes id.
  const learnerDirectoryFilter: LearnerDirectoryFilter = (() => {
    if (!selectedNode) return {};
    if (selectedNode.level === 'section') return { sectionId: selectedNode.id };
    if (selectedNode.level === 'academic-year') {
      const parts = selectedNode.id.split('grade::');
      const grade = parts.length > 1 ? parts[1] : '';
      return { grade };
    }
    return {};
  })();

  // placeholderData: keepPreviousData keeps returning the previous
  // selection's real rows while a new node's query is in flight — see the
  // identical College Admin page for why this prevents the auto-scroll from
  // firing on an intermediate render.
  const { data: learnerDirectory } = useQuery({
    queryKey: ['course-analytics', 'school-admin', 'learner-directory', selectedNode?.id ?? null],
    queryFn: () => getSchoolLearnerDirectory(learnerDirectoryFilter),
    placeholderData: keepPreviousData,
  });

  // No mock fallback — see the identical College Admin page for why `loading`
  // only gates the queries that drive the INITIAL paint, not the
  // keepPreviousData ones.
  const loading = !kpis || !enrollment || !directoryTree || !courseOptions;

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
        role="school_admin"
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
