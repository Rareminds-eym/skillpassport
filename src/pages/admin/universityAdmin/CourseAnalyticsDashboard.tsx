/**
 * Course Analytics Dashboard Page (route shell) - University Admin.
 *
 * Thin page that supplies University Admin data to the reusable, role-agnostic
 * `CourseAnalyticsDashboard` widget — the same component College Admin uses.
 * Only the data source (Faculty → Department → Program → Academic Year →
 * Section hierarchy) differs.
 *
 * KPI cards, Course Enrollment Overview, Course Performance Overview, the
 * Academic Status & Retention card (including its course dropdown), the
 * Recursive Directory Tree (University -> College -> Department -> Academic
 * Year -> Section, reusing the same College Admin academic structure once
 * per linked college), and the Learner Directory are now backend-connected
 * (functions/api/university-admin/course-analytics.ts, actions 'get-kpis',
 * 'get-course-performance', 'get-enrollment-overview', 'get-course-options',
 * 'get-academic-status', 'get-directory-tree', and 'get-learner-directory'),
 * following the exact same pattern as College Admin. Learner scoping is
 * university -> university_colleges -> learners.university_college_id (the
 * verified convention — see that endpoint's header comment). Selecting a
 * College, Department, Academic Year, or Section in the tree drives the
 * Learner Directory query below — College is University's own extra top
 * level (see LearnerDirectoryFilter's `collegeId`), not present for College
 * Admin.
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';
import { CourseAnalyticsDashboard } from '@/widgets/course-analytics-dashboard';
import {
  getUniversityCourseAnalyticsKpis,
  getUniversityCoursePerformance,
  getUniversityEnrollmentOverview,
  getUniversityCourseOptions,
  getUniversityAcademicStatus,
  getUniversityDirectoryTree,
  getUniversityLearnerDirectory,
  type LearnerDirectoryFilter,
} from '@/entities/course-analytics';

export default function CourseAnalyticsDashboardPage() {
  const { data: kpis } = useQuery({
    queryKey: ['course-analytics', 'university-admin', 'kpis'],
    queryFn: getUniversityCourseAnalyticsKpis,
  });
  const { data: enrollment } = useQuery({
    queryKey: ['course-analytics', 'university-admin', 'enrollment-overview'],
    queryFn: getUniversityEnrollmentOverview,
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
    queryKey: ['course-analytics', 'university-admin', 'course-performance', coursePerformancePage],
    queryFn: () => getUniversityCoursePerformance({ page: coursePerformancePage, pageSize: COURSE_PERFORMANCE_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const coursePerformance = coursePerformanceResult?.rows;
  const coursePerformanceTotalCount = coursePerformanceResult?.totalCount ?? 0;

  // Real, organization-scoped course dropdown (DISTINCT courses the org's
  // learners are enrolled in) — replaces the hardcoded mock course list.
  const { data: courseOptions } = useQuery({
    queryKey: ['course-analytics', 'university-admin', 'course-options'],
    queryFn: getUniversityCourseOptions,
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
    queryKey: ['course-analytics', 'university-admin', 'academic-status', selectedCourseId],
    queryFn: () => getUniversityAcademicStatus(selectedCourseId),
    placeholderData: keepPreviousData,
  });

  // Real, organization-scoped Recursive Directory Tree (University -> College
  // -> Department -> Academic Year -> Section) — replaces the hardcoded mock
  // hierarchy.
  const { data: directoryTree } = useQuery({
    queryKey: ['course-analytics', 'university-admin', 'directory-tree'],
    queryFn: getUniversityDirectoryTree,
  });

  // Selection lives here too (lifted out of the widget, same pattern as
  // selectedCourseId above) so it can drive the 'get-learner-directory'
  // query below; the widget accepts it as a controlled prop pair
  // (selectedSectionId / onSelectedSectionChange).
  const [selectedNode, setSelectedNode] = useState<{ id: string; level: string } | null>(null);

  // College nodes use the raw university_colleges.id as their node id
  // directly (see the get-directory-tree action) — unlike Academic Year's
  // synthetic composite id, no parsing needed. Department/Academic
  // Year/Section reuse the exact same derivation as College Admin's page,
  // since they're produced by the same buildCollegeStyleDirectoryTree call.
  const learnerDirectoryFilter: LearnerDirectoryFilter = (() => {
    if (!selectedNode) return {};
    if (selectedNode.level === 'section') return { sectionId: selectedNode.id };
    if (selectedNode.level === 'academic-year') {
      const [departmentId, academicYear] = selectedNode.id.split('::');
      return { departmentId, academicYear };
    }
    if (selectedNode.level === 'department') return { departmentId: selectedNode.id };
    if (selectedNode.level === 'college') return { collegeId: selectedNode.id };
    return {};
  })();

  // placeholderData: keepPreviousData keeps returning the previous
  // selection's real rows while a new node's query is in flight — see the
  // identical College Admin page for why this prevents the auto-scroll from
  // firing on an intermediate render.
  const { data: learnerDirectory } = useQuery({
    queryKey: ['course-analytics', 'university-admin', 'learner-directory', selectedNode?.id ?? null],
    queryFn: () => getUniversityLearnerDirectory(learnerDirectoryFilter),
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
        role="university_admin"
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
