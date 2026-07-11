/**
 * Course Analytics Dashboard Page (route shell) - College Admin.
 *
 * Thin page that supplies data to the reusable `CourseAnalyticsDashboard` widget.
 * A separate page from the existing `ReportsAnalytics` (which stays untouched).
 *
 * KPI cards, Course Enrollment Overview, Course Performance Overview, the
 * Academic Status & Retention card (including its course dropdown), the
 * Recursive Directory Tree, and the Learner Directory are now
 * backend-connected (functions/api/college-admin/course-analytics.ts,
 * actions 'get-kpis', 'get-enrollment-overview', 'get-course-performance',
 * 'get-course-options', 'get-academic-status', 'get-directory-tree', and
 * 'get-learner-directory'). Selecting a Department, Academic Year, or
 * Section in the tree drives the Learner Directory query below — the widget
 * itself needs no layout changes, only the controlled-selection props
 * already added for Academic Status (and now Directory Tree selection too).
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { CourseAnalyticsDashboard } from '@/widgets/course-analytics-dashboard';
import {
  getCollegeCourseAnalyticsKpis,
  getCollegeCoursePerformance,
  getCollegeEnrollmentOverview,
  getCollegeCourseOptions,
  getCollegeAcademicStatus,
  getCollegeDirectoryTree,
  getCollegeLearnerDirectory,
  type LearnerDirectoryFilter,
} from '@/entities/course-analytics';
import { useState } from 'react';

export default function CourseAnalyticsDashboardPage() {
  const { data: kpis } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'kpis'],
    queryFn: getCollegeCourseAnalyticsKpis,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'enrollment-overview'],
    queryFn: getCollegeEnrollmentOverview,
  });

  // Pagination lives here (lifted out of the widget, same pattern as
  // selectedCourseId/selectedNode below) so it can drive the
  // 'get-course-performance' query; the widget accepts it as a controlled
  // prop pair (coursePerformancePage / onCoursePerformancePageChange).
  const [coursePerformancePage, setCoursePerformancePage] = useState(1);
  const COURSE_PERFORMANCE_PAGE_SIZE = 6;

  // placeholderData: keepPreviousData keeps returning the previous page's
  // rows while the next page is fetching, instead of `data` briefly going
  // `undefined` — same flicker-prevention pattern used everywhere else in
  // this page.
  const { data: coursePerformanceResult } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'course-performance', coursePerformancePage],
    queryFn: () => getCollegeCoursePerformance({ page: coursePerformancePage, pageSize: COURSE_PERFORMANCE_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const coursePerformance = coursePerformanceResult?.rows;
  const coursePerformanceTotalCount = coursePerformanceResult?.totalCount ?? 0;

  // Real, organization-scoped course dropdown (DISTINCT courses the org's
  // learners are enrolled in) — replaces the hardcoded mock course list.
  // "All Courses" is prepended here since it's a UI convention, not a
  // derived data point (see buildCourseFilterOptions's doc comment).
  const { data: courseOptions } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'course-options'],
    queryFn: getCollegeCourseOptions,
  });
  const filters = [
    {
      id: 'course',
      label: 'Course',
      options: [{ value: 'all', label: 'All Courses' }, ...(courseOptions ?? [])],
    },
  ];

  // Selection now lives here (lifted out of the widget) so it can drive the
  // 'get-academic-status' query below; the widget accepts it as a controlled
  // prop pair (selectedCourseId / onSelectedCourseIdChange).
  const [selectedCourseId, setSelectedCourseId] = useState('all');

  // placeholderData: keepPreviousData keeps returning the last successful
  // course's data while a new `selectedCourseId` is fetching, instead of
  // `data` briefly going `undefined` on every query-key change (React
  // Query's default) — avoids a blank Academic Status card on every course
  // switch, not just first load.
  const { data: academicStatus, isFetching: isAcademicStatusFetching } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'academic-status', selectedCourseId],
    queryFn: () => getCollegeAcademicStatus(selectedCourseId),
    placeholderData: keepPreviousData,
  });

  // Real, organization-scoped Recursive Directory Tree (Department ->
  // Academic Year -> Section, the full academic structure — even branches
  // with zero learners render) — replaces the hardcoded mock hierarchy.
  // Learner counts come from each node's own backend-computed `count` field.
  const { data: directoryTree } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'directory-tree'],
    queryFn: getCollegeDirectoryTree,
  });

  // Selection now lives here too (lifted out of the widget, same pattern as
  // selectedCourseId above) so it can drive the 'get-learner-directory'
  // query below; the widget accepts it as a controlled prop pair
  // (selectedSectionId / onSelectedSectionChange).
  const [selectedNode, setSelectedNode] = useState<{ id: string; level: string } | null>(null);

  // Academic Year nodes use a synthetic composite id (`${departmentId}::${label}`,
  // e.g. "d2...0001::1st Year" — see buildCollegeStyleDirectoryTree), not a
  // real DB id, so it's split back into the two params 'get-learner-directory'
  // actually needs. Department/Section nodes map straight to their own param.
  const learnerDirectoryFilter: LearnerDirectoryFilter = (() => {
    if (!selectedNode) return {};
    if (selectedNode.level === 'section') return { sectionId: selectedNode.id };
    if (selectedNode.level === 'academic-year') {
      const [departmentId, academicYear] = selectedNode.id.split('::');
      return { departmentId, academicYear };
    }
    if (selectedNode.level === 'department') return { departmentId: selectedNode.id };
    return {};
  })();

  // placeholderData: keepPreviousData keeps returning the previous
  // selection's real rows while a new node's query is in flight, instead of
  // `data` briefly going `undefined` — without this, the row count would
  // change twice per selection (once to empty, once to the real result),
  // which was firing the widget's post-selection auto-scroll on the wrong
  // intermediate render. See the identical fix already applied to the
  // Academic Status query above.
  const { data: learnerDirectory } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'learner-directory', selectedNode?.id ?? null],
    queryFn: () => getCollegeLearnerDirectory(learnerDirectoryFilter),
    placeholderData: keepPreviousData,
  });

  // Note: the widget itself already derives the Learner Directory breadcrumb
  // ("Computer Science / 1st Year / Section A") internally via
  // findNodePath(data.directoryTree, selectedSectionId) — no need to
  // duplicate that here, since both data.directoryTree and selectedSectionId
  // (below) are the same real, controlled values it receives.

  // No mock fallback: every section is backend-connected, so the widget is
  // only rendered once every query that drives its INITIAL paint has
  // resolved at least once (see `loading` below). `keepPreviousData` queries
  // (course performance, academic status, learner directory) are excluded
  // from that initial gate on purpose — they already have a real value by
  // the time the user can change page/course/section, so re-blanking the
  // whole dashboard on every interaction would be a regression, not a fix.
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
        role="college_admin"
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
