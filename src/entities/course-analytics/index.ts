/**
 * Course Analytics Entity - Public API
 *
 * Domain layer for the Course Analytics Dashboard: types, (temporary) mock
 * data, pure directory-tree business logic (filtering/counts, no UI), and the
 * (currently partial — KPIs only) backend-connected API layer. Consumed by
 * the `course-analytics-dashboard` widget and its role-specific pages.
 */

export type {
  CourseAnalyticsData,
  KpiMetric,
  EnrollmentDatum,
  AcademicStatusOverview,
  AcademicStatusByCourse,
  LearnerStatusSegment,
  CoursePerformanceRow,
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

export { mockCourseAnalytics } from './model/mockData';
export { mockCourseAnalyticsSchool } from './model/mockDataSchool';
export { mockCourseAnalyticsUniversity } from './model/mockDataUniversity';
export { mockCourseAnalyticsEducator } from './model/mockDataEducator';

export {
  getCollegeCourseAnalyticsKpis,
  getCollegeCoursePerformance,
  getCollegeEnrollmentOverview,
  getCollegeCourseOptions,
  getCollegeAcademicStatus,
  getCollegeDirectoryTree,
  getSchoolCourseAnalyticsKpis,
  getSchoolEnrollmentOverview,
  getSchoolCourseOptions,
  getSchoolAcademicStatus,
  getSchoolDirectoryTree,
  getUniversityCourseAnalyticsKpis,
  getUniversityEnrollmentOverview,
  getUniversityCourseOptions,
  getUniversityAcademicStatus,
  getUniversityDirectoryTree,
  getEducatorCourseAnalyticsKpis,
  getEducatorEnrollmentOverview,
  getEducatorCourseOptions,
  getEducatorAcademicStatus,
  getEducatorDirectoryTree,
} from './api';
export type { EducatorCourseAnalyticsScope } from './api';
