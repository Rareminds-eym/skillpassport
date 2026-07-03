/**
 * Course Analytics Dashboard Page (route shell) - College Admin.
 *
 * Thin page that supplies data to the reusable `CourseAnalyticsDashboard` widget.
 * A separate page from the existing `ReportsAnalytics` (which stays untouched).
 *
 * KPI cards, Course Enrollment Overview, Course Performance Overview, the
 * Academic Status & Retention card (including its course dropdown), and the
 * Recursive Directory Tree are now backend-connected
 * (functions/api/college-admin/course-analytics.ts, actions 'get-kpis',
 * 'get-enrollment-overview', 'get-course-performance', 'get-course-options',
 * 'get-academic-status', and 'get-directory-tree'). Only the Learner
 * Directory remains on `mockCourseAnalytics` until that backend exists — the
 * real data is merged into the otherwise-mock `CourseAnalyticsData` object
 * below, so the widget itself needs no layout changes (only the controlled-
 * selection props already added for Academic Status).
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
  mockCourseAnalytics,
} from '@/entities/course-analytics';
import { useState } from 'react';

export default function CourseAnalyticsDashboardPage() {
  // Only KPI cards + Course Enrollment Overview + Course Performance +
  // Academic Status are backend-connected today; every other section is
  // synchronous mock data with no loading state of its own. Deliberately NOT
  // passing `loading` to the widget — that would blank the whole dashboard
  // (including the working mock sections) behind a skeleton while these
  // fetches are in flight. Instead, mock values render immediately and are
  // swapped for real ones the moment each query resolves.
  const { data: kpis } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'kpis'],
    queryFn: getCollegeCourseAnalyticsKpis,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'enrollment-overview'],
    queryFn: getCollegeEnrollmentOverview,
  });

  const { data: coursePerformance } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'course-performance'],
    queryFn: getCollegeCoursePerformance,
  });

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
  // Query's default). That undefined gap is what was causing the mock
  // fallback below to flash on every course switch, not just first load.
  const { data: academicStatus, isFetching: isAcademicStatusFetching } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'academic-status', selectedCourseId],
    queryFn: () => getCollegeAcademicStatus(selectedCourseId),
    placeholderData: keepPreviousData,
  });

  // Real, organization-scoped Recursive Directory Tree (Department ->
  // Academic Year -> Section, learners-only — never the college's whole
  // catalog) — replaces the hardcoded mock hierarchy. Note: the Learner
  // Directory itself is still mock, so per-node counts shown in the UI
  // (derived client-side from mock learnerDirectory rows, not this tree's own
  // backend-computed counts) won't line up with these real section ids until
  // that section is also backend-connected — expected for this step.
  const { data: directoryTree } = useQuery({
    queryKey: ['course-analytics', 'college-admin', 'directory-tree'],
    queryFn: getCollegeDirectoryTree,
  });

  // TODO(integration): replace the remaining mock field (learnerDirectory)
  // with a real fetch as its backend is built, following the same pattern
  // used here.
  //
  // academicStatusByCourse intentionally never falls back to the hardcoded
  // mock (activeSet: 3750, etc.) once a real course is selected — only true
  // pre-first-load has no academicStatus yet, and keepPreviousData means
  // that gap only ever exists once, at initial mount.
  const data = {
    ...mockCourseAnalytics,
    kpis: kpis ?? mockCourseAnalytics.kpis,
    enrollment: enrollment ?? mockCourseAnalytics.enrollment,
    coursePerformance: coursePerformance ?? mockCourseAnalytics.coursePerformance,
    filters: courseOptions ? filters : mockCourseAnalytics.filters,
    academicStatusByCourse: academicStatus
      ? { [selectedCourseId]: academicStatus }
      : mockCourseAnalytics.academicStatusByCourse,
    directoryTree: directoryTree ?? mockCourseAnalytics.directoryTree,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CourseAnalyticsDashboard
        data={data}
        role="college_admin"
        selectedCourseId={selectedCourseId}
        onSelectedCourseIdChange={setSelectedCourseId}
        academicStatusFetching={isAcademicStatusFetching}
      />
    </div>
  );
}
