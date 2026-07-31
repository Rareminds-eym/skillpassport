/**
 * Course Analytics Entity - Public API
 *
 * Domain layer for the Course Analytics Dashboard: types, pure
 * directory-tree business logic (filtering/counts, no UI), and the
 * backend-connected API layer (all 7 actions, all 4 roles). Consumed by the
 * `course-analytics-dashboard` widget and its role-specific pages. No mock
 * data — every page shows a loading state (via the widget's `loading` prop)
 * until its real queries resolve.
 */

export type {
  CourseAnalyticsData,
  KpiMetric,
  EnrollmentDatum,
  AcademicStatusOverview,
  AcademicStatusByCourse,
  LearnerStatusSegment,
  CoursePerformanceRow,
  PaginatedCoursePerformance,
  LearnerDirectoryRow,
  DirectoryNode,
  FilterDefinition,
  FilterOption,
  TrendDirection,
  LearnerStatus,
  CourseTrend,
} from './model/types';

export {
  filterLearnersBySection,
  buildLearnerCountByNode,
  findNodePath,
} from './lib/directory';

export {
  getCollegeCourseAnalyticsKpis,
  getCollegeCoursePerformance,
  getCollegeEnrollmentOverview,
  getCollegeCourseOptions,
  getCollegeAcademicStatus,
  getCollegeDirectoryTree,
  getCollegeLearnerDirectory,
  getSchoolCourseAnalyticsKpis,
  getSchoolCoursePerformance,
  getSchoolEnrollmentOverview,
  getSchoolCourseOptions,
  getSchoolAcademicStatus,
  getSchoolDirectoryTree,
  getSchoolLearnerDirectory,
  getUniversityCourseAnalyticsKpis,
  getUniversityCoursePerformance,
  getUniversityEnrollmentOverview,
  getUniversityCourseOptions,
  getUniversityAcademicStatus,
  getUniversityDirectoryTree,
  getUniversityLearnerDirectory,
  getEducatorCourseAnalyticsKpis,
  getEducatorCoursePerformance,
  getEducatorEnrollmentOverview,
  getEducatorCourseOptions,
  getEducatorAcademicStatus,
  getEducatorDirectoryTree,
  getEducatorLearnerDirectory,
} from './api';
export type { EducatorCourseAnalyticsScope, LearnerDirectoryFilter, CoursePerformancePagination } from './api';
