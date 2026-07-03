/**
 * Course Analytics Entity - API queries
 *
 * Backend-connected data for the Course Analytics Dashboard
 * (functions/api/{college-admin,school-admin,university-admin,educator}/
 * course-analytics.ts). KPI cards ('get-kpis'), Course Enrollment Overview
 * ('get-enrollment-overview'), the Academic Status course dropdown
 * ('get-course-options'), and Academic Status & Retention
 * ('get-academic-status') are implemented for all four roles; Course
 * Performance Overview ('get-course-performance') is implemented for College
 * Admin only. Remaining sections (Learner Directory, Directory Tree) remain
 * on mock data until their backends exist — see model/mockDataFactory.ts.
 *
 * Follows the same apiPost('/<feature>/actions', { action, ...params })
 * convention as entities/course/api/queries.ts.
 */

import { apiPost } from '@/shared/api/apiClient';
import type {
  AcademicStatusOverview,
  CoursePerformanceRow,
  DirectoryNode,
  EnrollmentDatum,
  FilterOption,
  KpiMetric,
} from '../model/types';

interface GetKpisResponse {
  success: boolean;
  data?: { kpis: KpiMetric[] };
}

interface GetCoursePerformanceResponse {
  success: boolean;
  data?: { coursePerformance: CoursePerformanceRow[] };
}

interface GetEnrollmentOverviewResponse {
  success: boolean;
  data?: { enrollment: EnrollmentDatum[] };
}

interface GetCourseOptionsResponse {
  success: boolean;
  data?: { courseOptions: FilterOption[] };
}

interface GetAcademicStatusResponse {
  success: boolean;
  data?: { academicStatus: AcademicStatusOverview };
}

interface GetDirectoryTreeResponse {
  success: boolean;
  data?: { directoryTree: DirectoryNode[] };
}

/**
 * Fetch the College Admin Course Analytics Dashboard's KPI cards.
 * Org scope is resolved server-side from the caller's JWT — no org id is
 * sent from the client.
 */
export async function getCollegeCourseAnalyticsKpis(): Promise<KpiMetric[]> {
  const response = await apiPost<GetKpisResponse>('/college-admin/course-analytics', {
    action: 'get-kpis',
  });
  return response?.data?.kpis ?? [];
}

/**
 * Fetch the College Admin Course Analytics Dashboard's Course Performance
 * Overview rows (organization -> learners -> enrollments -> grouped by
 * course, sorted by enrollment count, top 6). Org scope is resolved
 * server-side from the caller's JWT.
 */
export async function getCollegeCoursePerformance(): Promise<CoursePerformanceRow[]> {
  const response = await apiPost<GetCoursePerformanceResponse>('/college-admin/course-analytics', {
    action: 'get-course-performance',
  });
  return response?.data?.coursePerformance ?? [];
}

/**
 * Fetch the College Admin Course Analytics Dashboard's Course Enrollment
 * Overview chart data (organization -> learners -> enrollments -> grouped by
 * course, sorted by enrollment count, top 6). Org scope is resolved
 * server-side from the caller's JWT.
 */
export async function getCollegeEnrollmentOverview(): Promise<EnrollmentDatum[]> {
  const response = await apiPost<GetEnrollmentOverviewResponse>('/college-admin/course-analytics', {
    action: 'get-enrollment-overview',
  });
  return response?.data?.enrollment ?? [];
}

/**
 * Fetch the College Admin Academic Status card's course dropdown options —
 * DISTINCT courses the org's learners are enrolled in, never the whole
 * `courses` catalog. Org scope is resolved server-side from the caller's JWT.
 */
export async function getCollegeCourseOptions(): Promise<FilterOption[]> {
  const response = await apiPost<GetCourseOptionsResponse>('/college-admin/course-analytics', {
    action: 'get-course-options',
  });
  return response?.data?.courseOptions ?? [];
}

/**
 * Fetch the College Admin Academic Status & Retention card data, optionally
 * scoped to a single course (pass 'all' or omit for the org-wide aggregate).
 * Org scope is resolved server-side from the caller's JWT.
 */
export async function getCollegeAcademicStatus(courseId?: string): Promise<AcademicStatusOverview | null> {
  const response = await apiPost<GetAcademicStatusResponse>('/college-admin/course-analytics', {
    action: 'get-academic-status',
    courseId,
  });
  return response?.data?.academicStatus ?? null;
}

/**
 * Fetch the College Admin Recursive Directory Tree (organization -> learners
 * -> Department -> Academic Year -> Section). Org scope is resolved
 * server-side from the caller's JWT. Only departments/years/sections that
 * actually have learners are returned — never the college's whole catalog.
 */
export async function getCollegeDirectoryTree(): Promise<DirectoryNode[]> {
  const response = await apiPost<GetDirectoryTreeResponse>('/college-admin/course-analytics', {
    action: 'get-directory-tree',
  });
  return response?.data?.directoryTree ?? [];
}

/**
 * Fetch the School Admin Course Analytics Dashboard's KPI cards.
 * Org scope is resolved server-side from the caller's JWT.
 */
export async function getSchoolCourseAnalyticsKpis(): Promise<KpiMetric[]> {
  const response = await apiPost<GetKpisResponse>('/school-admin/course-analytics', {
    action: 'get-kpis',
  });
  return response?.data?.kpis ?? [];
}

/**
 * Fetch the School Admin Course Analytics Dashboard's Course Enrollment
 * Overview chart data. Org scope is resolved server-side from the caller's JWT.
 */
export async function getSchoolEnrollmentOverview(): Promise<EnrollmentDatum[]> {
  const response = await apiPost<GetEnrollmentOverviewResponse>('/school-admin/course-analytics', {
    action: 'get-enrollment-overview',
  });
  return response?.data?.enrollment ?? [];
}

/**
 * Fetch the School Admin Academic Status card's course dropdown options —
 * DISTINCT courses the org's learners are enrolled in, never the whole
 * `courses` catalog. Org scope is resolved server-side from the caller's JWT.
 */
export async function getSchoolCourseOptions(): Promise<FilterOption[]> {
  const response = await apiPost<GetCourseOptionsResponse>('/school-admin/course-analytics', {
    action: 'get-course-options',
  });
  return response?.data?.courseOptions ?? [];
}

/**
 * Fetch the School Admin Academic Status & Retention card data, optionally
 * scoped to a single course (pass 'all' or omit for the org-wide aggregate).
 * Org scope is resolved server-side from the caller's JWT.
 */
export async function getSchoolAcademicStatus(courseId?: string): Promise<AcademicStatusOverview | null> {
  const response = await apiPost<GetAcademicStatusResponse>('/school-admin/course-analytics', {
    action: 'get-academic-status',
    courseId,
  });
  return response?.data?.academicStatus ?? null;
}

/**
 * Fetch the School Admin Recursive Directory Tree (Grade -> Section, from
 * the school's existing school_classes structure — no department level).
 * Org scope is resolved server-side from the caller's JWT.
 */
export async function getSchoolDirectoryTree(): Promise<DirectoryNode[]> {
  const response = await apiPost<GetDirectoryTreeResponse>('/school-admin/course-analytics', {
    action: 'get-directory-tree',
  });
  return response?.data?.directoryTree ?? [];
}

/**
 * Fetch the University Admin Course Analytics Dashboard's KPI cards.
 * Org scope is resolved server-side from the caller's JWT.
 */
export async function getUniversityCourseAnalyticsKpis(): Promise<KpiMetric[]> {
  const response = await apiPost<GetKpisResponse>('/university-admin/course-analytics', {
    action: 'get-kpis',
  });
  return response?.data?.kpis ?? [];
}

/**
 * Fetch the University Admin Course Analytics Dashboard's Course Enrollment
 * Overview chart data. Org scope is resolved server-side from the caller's JWT.
 */
export async function getUniversityEnrollmentOverview(): Promise<EnrollmentDatum[]> {
  const response = await apiPost<GetEnrollmentOverviewResponse>('/university-admin/course-analytics', {
    action: 'get-enrollment-overview',
  });
  return response?.data?.enrollment ?? [];
}

/**
 * Fetch the University Admin Academic Status card's course dropdown options —
 * DISTINCT courses the org's learners are enrolled in, never the whole
 * `courses` catalog. Org scope is resolved server-side from the caller's JWT.
 */
export async function getUniversityCourseOptions(): Promise<FilterOption[]> {
  const response = await apiPost<GetCourseOptionsResponse>('/university-admin/course-analytics', {
    action: 'get-course-options',
  });
  return response?.data?.courseOptions ?? [];
}

/**
 * Fetch the University Admin Academic Status & Retention card data,
 * optionally scoped to a single course (pass 'all' or omit for the org-wide
 * aggregate). Org scope is resolved server-side from the caller's JWT.
 */
export async function getUniversityAcademicStatus(courseId?: string): Promise<AcademicStatusOverview | null> {
  const response = await apiPost<GetAcademicStatusResponse>('/university-admin/course-analytics', {
    action: 'get-academic-status',
    courseId,
  });
  return response?.data?.academicStatus ?? null;
}

/**
 * Fetch the University Admin Recursive Directory Tree (University -> College
 * -> Department -> Academic Year -> Section — reusing the same College Admin
 * academic structure once per linked college). Org scope is resolved
 * server-side from the caller's JWT. Colleges with no `university_colleges`
 * mapping yet are simply omitted, not treated as an error.
 */
export async function getUniversityDirectoryTree(): Promise<DirectoryNode[]> {
  const response = await apiPost<GetDirectoryTreeResponse>('/university-admin/course-analytics', {
    action: 'get-directory-tree',
  });
  return response?.data?.directoryTree ?? [];
}

/** Params identifying which learners an educator is scoped to — same shape
 * already produced by features/educator/model/useEducatorSchool and consumed
 * by features/analytics/model/useAnalytics's 'get-kpi-data' action, reused
 * as-is rather than resolved again here. */
export interface EducatorCourseAnalyticsScope {
  schoolId?: string;
  collegeId?: string;
  educatorType?: 'school' | 'college' | null;
  educatorRole?: string | null;
  assignedClassIds?: string[];
}

/**
 * Fetch the Educator Course Analytics Dashboard's KPI cards, scoped to the
 * educator's assigned school class / college program sections.
 */
export async function getEducatorCourseAnalyticsKpis(
  scope: EducatorCourseAnalyticsScope,
): Promise<KpiMetric[]> {
  const response = await apiPost<GetKpisResponse>('/educator/course-analytics', {
    action: 'get-kpis',
    ...scope,
  });
  return response?.data?.kpis ?? [];
}

/**
 * Fetch the Educator Course Analytics Dashboard's Course Enrollment Overview
 * chart data, scoped to the educator's assigned school class / college
 * program sections.
 */
export async function getEducatorEnrollmentOverview(
  scope: EducatorCourseAnalyticsScope,
): Promise<EnrollmentDatum[]> {
  const response = await apiPost<GetEnrollmentOverviewResponse>('/educator/course-analytics', {
    action: 'get-enrollment-overview',
    ...scope,
  });
  return response?.data?.enrollment ?? [];
}

/**
 * Fetch the Educator Academic Status card's course dropdown options —
 * DISTINCT courses the educator's scoped learners are enrolled in, never the
 * whole `courses` catalog. Scoped to the educator's assigned school class /
 * college program sections.
 */
export async function getEducatorCourseOptions(
  scope: EducatorCourseAnalyticsScope,
): Promise<FilterOption[]> {
  const response = await apiPost<GetCourseOptionsResponse>('/educator/course-analytics', {
    action: 'get-course-options',
    ...scope,
  });
  return response?.data?.courseOptions ?? [];
}

/**
 * Fetch the Educator Academic Status & Retention card data, optionally
 * scoped to a single course (pass 'all' or omit for the aggregate across the
 * educator's assigned school class / college program sections).
 */
export async function getEducatorAcademicStatus(
  scope: EducatorCourseAnalyticsScope,
  courseId?: string,
): Promise<AcademicStatusOverview | null> {
  const response = await apiPost<GetAcademicStatusResponse>('/educator/course-analytics', {
    action: 'get-academic-status',
    ...scope,
    courseId,
  });
  return response?.data?.academicStatus ?? null;
}

/**
 * Fetch the Educator Recursive Directory Tree, restricted to only this
 * educator's assigned classes/sections — reusing the same College/School
 * academic structure as the admin roles (never a separate hierarchy).
 */
export async function getEducatorDirectoryTree(
  scope: EducatorCourseAnalyticsScope,
): Promise<DirectoryNode[]> {
  const response = await apiPost<GetDirectoryTreeResponse>('/educator/course-analytics', {
    action: 'get-directory-tree',
    ...scope,
  });
  return response?.data?.directoryTree ?? [];
}
