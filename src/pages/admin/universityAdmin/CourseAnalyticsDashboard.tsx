/**
 * Course Analytics Dashboard Page (route shell) - University Admin.
 *
 * Thin page that supplies University Admin data to the reusable, role-agnostic
 * `CourseAnalyticsDashboard` widget — the same component College Admin uses.
 * Only the data source (Faculty → Department → Program → Academic Year →
 * Section hierarchy) differs.
 *
 * KPI cards, Course Enrollment Overview, the Academic Status & Retention
 * card (including its course dropdown), and the Recursive Directory Tree
 * (University -> College -> Department -> Academic Year -> Section, reusing
 * the same College Admin academic structure once per linked college) are
 * now backend-connected (functions/api/university-admin/course-analytics.ts,
 * actions 'get-kpis', 'get-enrollment-overview', 'get-course-options',
 * 'get-academic-status', and 'get-directory-tree'), following the exact
 * same pattern as College Admin. Learner scoping is university ->
 * university_colleges -> learners.university_college_id (the verified
 * convention — see that endpoint's header comment). Only Course Performance
 * and the Learner Directory itself remain on `mockCourseAnalyticsUniversity`
 * until those backends exist.
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';
import { CourseAnalyticsDashboard } from '@/widgets/course-analytics-dashboard';
import {
  getUniversityCourseAnalyticsKpis,
  getUniversityEnrollmentOverview,
  getUniversityCourseOptions,
  getUniversityAcademicStatus,
  getUniversityDirectoryTree,
  mockCourseAnalyticsUniversity,
} from '@/entities/course-analytics';

export default function CourseAnalyticsDashboardPage() {
  // Only the KPI cards, enrollment overview, and Academic Status are
  // backend-connected today; every other section is synchronous mock data
  // with no loading state of its own. Deliberately NOT passing `loading` to
  // the widget — see the identical College Admin page for the full reasoning.
  const { data: kpis } = useQuery({
    queryKey: ['course-analytics', 'university-admin', 'kpis'],
    queryFn: getUniversityCourseAnalyticsKpis,
  });
  const { data: enrollment } = useQuery({
    queryKey: ['course-analytics', 'university-admin', 'enrollment-overview'],
    queryFn: getUniversityEnrollmentOverview,
  });

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
  // `data` briefly going `undefined` on every query-key change — see the
  // identical College Admin page for why this prevents a mock-data flash.
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

  // TODO(integration): replace the remaining mock fields (coursePerformance,
  // learnerDirectory) with real fetches as their backends are built,
  // following the same pattern used here.
  const data = {
    ...mockCourseAnalyticsUniversity,
    kpis: kpis ?? mockCourseAnalyticsUniversity.kpis,
    enrollment: enrollment ?? mockCourseAnalyticsUniversity.enrollment,
    filters: courseOptions ? filters : mockCourseAnalyticsUniversity.filters,
    academicStatusByCourse: academicStatus
      ? { [selectedCourseId]: academicStatus }
      : mockCourseAnalyticsUniversity.academicStatusByCourse,
    directoryTree: directoryTree ?? mockCourseAnalyticsUniversity.directoryTree,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CourseAnalyticsDashboard
        data={data}
        role="university_admin"
        selectedCourseId={selectedCourseId}
        onSelectedCourseIdChange={setSelectedCourseId}
        academicStatusFetching={isAcademicStatusFetching}
      />
    </div>
  );
}
