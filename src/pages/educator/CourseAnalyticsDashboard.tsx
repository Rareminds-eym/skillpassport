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
 * KPI cards, Course Enrollment Overview, the Academic Status & Retention
 * card (including its course dropdown), and the Recursive Directory Tree
 * (restricted to only this educator's assigned classes/sections, reusing
 * the same College/School academic structure) are now backend-connected
 * (functions/api/educator/course-analytics.ts, actions 'get-kpis',
 * 'get-enrollment-overview', 'get-course-options', 'get-academic-status',
 * and 'get-directory-tree'), reusing `useEducatorSchool` (the same hook
 * `pages/educator/Analytics.tsx` already uses) to resolve the educator's
 * school/college/class-assignment scope, rather than re-deriving it. Only
 * Course Performance and the Learner Directory itself remain on
 * `mockCourseAnalyticsEducator` until those backends exist.
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';
import { CourseAnalyticsDashboard } from '@/widgets/course-analytics-dashboard';
import {
  getEducatorCourseAnalyticsKpis,
  getEducatorEnrollmentOverview,
  getEducatorCourseOptions,
  getEducatorAcademicStatus,
  getEducatorDirectoryTree,
  mockCourseAnalyticsEducator,
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

  // Only the KPI cards, enrollment overview, and Academic Status are
  // backend-connected today; every other section is synchronous mock data
  // with no loading state of its own. Deliberately NOT passing `loading` to
  // the widget — see the identical College Admin page for the full reasoning.
  // All queries are gated on the scope having resolved (same dependency
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
  // `data` briefly going `undefined` on every query-key change — see the
  // identical College Admin page for why this prevents a mock-data flash.
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
  // assigned classes/sections) — replaces the hardcoded mock hierarchy.
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

  // TODO(integration): replace the remaining mock fields (coursePerformance,
  // learnerDirectory) with real fetches as their backends are built,
  // following the same pattern used here.
  const data = {
    ...mockCourseAnalyticsEducator,
    kpis: kpis ?? mockCourseAnalyticsEducator.kpis,
    enrollment: enrollment ?? mockCourseAnalyticsEducator.enrollment,
    filters: courseOptions ? filters : mockCourseAnalyticsEducator.filters,
    academicStatusByCourse: academicStatus
      ? { [selectedCourseId]: academicStatus }
      : mockCourseAnalyticsEducator.academicStatusByCourse,
    directoryTree: directoryTree ?? mockCourseAnalyticsEducator.directoryTree,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CourseAnalyticsDashboard
        data={data}
        role="educator"
        selectedCourseId={selectedCourseId}
        onSelectedCourseIdChange={setSelectedCourseId}
        academicStatusFetching={isAcademicStatusFetching}
      />
    </div>
  );
}
