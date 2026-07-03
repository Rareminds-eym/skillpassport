/**
 * Course Analytics Entity - API Layer Public API
 */

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
} from './queries';
export type { EducatorCourseAnalyticsScope } from './queries';
