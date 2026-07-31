/**
 * Course Analytics Entity - API queries
 *
 * Backend-connected data for the Course Analytics Dashboard
 * (functions/api/{college-admin,school-admin,university-admin,educator}/
 * course-analytics.ts). KPI cards ('get-kpis'), Course Enrollment Overview
 * ('get-enrollment-overview'), Course Performance Overview
 * ('get-course-performance', paginated), the Academic Status course dropdown
 * ('get-course-options'), Academic Status & Retention ('get-academic-status'),
 * the Recursive Directory Tree ('get-directory-tree'), and the Learner
 * Directory ('get-learner-directory') are implemented for all four roles.
 * Mock data (see model/mockDataFactory.ts) is used only as a pre-first-fetch
 * loading placeholder by each page, never as a "not yet implemented" fallback.
 *
 * Follows the same apiPost('/<feature>/actions', { action, ...params })
 * convention as entities/course/api/queries.ts.
 */

import { apiPost } from '@/shared/api/apiClient';
import type {
  AcademicStatusOverview,
  DirectoryNode,
  EnrollmentDatum,
  FilterOption,
  KpiMetric,
  LearnerDirectoryRow,
  PaginatedCoursePerformance,
} from '../model/types';

interface GetKpisResponse {
  success: boolean;
  data?: { kpis: KpiMetric[] };
}

interface GetCoursePerformanceResponse {
  success: boolean;
  data?: { coursePerformance: PaginatedCoursePerformance['rows']; totalCount: number };
}

/** 1-indexed page + page size, shared by every role's 'get-course-performance' action. */
export interface CoursePerformancePagination {
  page?: number;
  pageSize?: number;
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

interface GetLearnerDirectoryResponse {
  success: boolean;
  data?: { learnerDirectory: LearnerDirectoryRow[] };
}

/**
 * Filter for the Learner Directory, matching whichever Directory Tree node is
 * currently selected. Each role uses only the fields relevant to its own
 * hierarchy — mutually exclusive within a role's own set (Section is always
 * most specific):
 *   College: departmentId + academicYear (together select an Academic Year
 *     node), or departmentId alone (a Department node), or sectionId alone
 *     (a Section node).
 *   University: same as College, PLUS collegeId alone (a College node —
 *     University's one extra top level, selecting every learner in that
 *     linked college regardless of department/year/section).
 *   School: grade alone (a Grade node — School has no separate department
 *     level), or sectionId alone (a Section node).
 * Omit every field for every learner in the org.
 */
export interface LearnerDirectoryFilter {
  collegeId?: string;
  departmentId?: string;
  academicYear?: string;
  grade?: string;
  sectionId?: string;
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
 * Fetch one page of the College Admin Course Analytics Dashboard's Course
 * Performance Overview (organization -> learners -> enrollments -> grouped by
 * course, sorted by enrollment count, paginated). Org scope is resolved
 * server-side from the caller's JWT. Omit `pagination` for page 1 / size 6
 * (the previous hardcoded top-6 behavior).
 */
export async function getCollegeCoursePerformance(
  pagination: CoursePerformancePagination = {},
): Promise<PaginatedCoursePerformance> {
  const response = await apiPost<GetCoursePerformanceResponse>('/college-admin/course-analytics', {
    action: 'get-course-performance',
    ...pagination,
  });
  return { rows: response?.data?.coursePerformance ?? [], totalCount: response?.data?.totalCount ?? 0 };
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
 * Fetch the College Admin Learner Directory, optionally scoped to whichever
 * Directory Tree node is selected (Department, Academic Year, or Section —
 * see {@link LearnerDirectoryFilter}). Org scope is resolved server-side
 * from the caller's JWT. Omit `filter` (or pass `{}`) for every learner in
 * the college.
 */
export async function getCollegeLearnerDirectory(
  filter: LearnerDirectoryFilter = {},
): Promise<LearnerDirectoryRow[]> {
  const response = await apiPost<GetLearnerDirectoryResponse>('/college-admin/course-analytics', {
    action: 'get-learner-directory',
    ...filter,
  });
  return response?.data?.learnerDirectory ?? [];
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
 * Fetch one page of the School Admin Course Analytics Dashboard's Course
 * Performance Overview. Org scope is resolved server-side from the caller's
 * JWT. Omit `pagination` for page 1 / size 6.
 */
export async function getSchoolCoursePerformance(
  pagination: CoursePerformancePagination = {},
): Promise<PaginatedCoursePerformance> {
  const response = await apiPost<GetCoursePerformanceResponse>('/school-admin/course-analytics', {
    action: 'get-course-performance',
    ...pagination,
  });
  return { rows: response?.data?.coursePerformance ?? [], totalCount: response?.data?.totalCount ?? 0 };
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
 * Fetch the School Admin Learner Directory, optionally scoped to whichever
 * Directory Tree node is selected — only `grade` and `sectionId` apply for
 * School (no `departmentId`/`academicYear`, unlike College Admin — see
 * {@link LearnerDirectoryFilter}). Org scope is resolved server-side from
 * the caller's JWT. Omit `filter` (or pass `{}`) for every learner in the
 * school.
 */
export async function getSchoolLearnerDirectory(
  filter: LearnerDirectoryFilter = {},
): Promise<LearnerDirectoryRow[]> {
  const response = await apiPost<GetLearnerDirectoryResponse>('/school-admin/course-analytics', {
    action: 'get-learner-directory',
    ...filter,
  });
  return response?.data?.learnerDirectory ?? [];
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
 * Fetch one page of the University Admin Course Analytics Dashboard's Course
 * Performance Overview. Org scope is resolved server-side from the caller's
 * JWT. Omit `pagination` for page 1 / size 6.
 */
export async function getUniversityCoursePerformance(
  pagination: CoursePerformancePagination = {},
): Promise<PaginatedCoursePerformance> {
  const response = await apiPost<GetCoursePerformanceResponse>('/university-admin/course-analytics', {
    action: 'get-course-performance',
    ...pagination,
  });
  return { rows: response?.data?.coursePerformance ?? [], totalCount: response?.data?.totalCount ?? 0 };
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

/**
 * Fetch the University Admin Learner Directory, optionally scoped to
 * whichever Directory Tree node is selected — `collegeId`, `departmentId`,
 * `academicYear`, and `sectionId` all apply for University (unlike College
 * Admin, which has no `collegeId` level — see {@link LearnerDirectoryFilter}).
 * Org scope is resolved server-side from the caller's JWT. Omit `filter` (or
 * pass `{}`) for every learner across every linked college.
 */
export async function getUniversityLearnerDirectory(
  filter: LearnerDirectoryFilter = {},
): Promise<LearnerDirectoryRow[]> {
  const response = await apiPost<GetLearnerDirectoryResponse>('/university-admin/course-analytics', {
    action: 'get-learner-directory',
    ...filter,
  });
  return response?.data?.learnerDirectory ?? [];
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
 * Fetch one page of the Educator Course Analytics Dashboard's Course
 * Performance Overview, scoped to the educator's assigned school class /
 * college program sections. Omit `pagination` for page 1 / size 6.
 */
export async function getEducatorCoursePerformance(
  scope: EducatorCourseAnalyticsScope,
  pagination: CoursePerformancePagination = {},
): Promise<PaginatedCoursePerformance> {
  const response = await apiPost<GetCoursePerformanceResponse>('/educator/course-analytics', {
    action: 'get-course-performance',
    ...scope,
    ...pagination,
  });
  return { rows: response?.data?.coursePerformance ?? [], totalCount: response?.data?.totalCount ?? 0 };
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

/**
 * Fetch the Educator Learner Directory, optionally scoped to whichever
 * Directory Tree node is selected (Department, Academic Year, or Section for
 * college-type; Grade or Section for school-type — see
 * {@link LearnerDirectoryFilter}). Restricted server-side to only this
 * educator's own assigned sections/classes, even beyond whatever `filter`
 * requests. Omit `filter` (or pass `{}`) for every learner across every
 * section/class this educator is assigned to.
 */
export async function getEducatorLearnerDirectory(
  scope: EducatorCourseAnalyticsScope,
  filter: LearnerDirectoryFilter = {},
): Promise<LearnerDirectoryRow[]> {
  const response = await apiPost<GetLearnerDirectoryResponse>('/educator/course-analytics', {
    action: 'get-learner-directory',
    ...scope,
    ...filter,
  });
  return response?.data?.learnerDirectory ?? [];
}
