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
} from './queries';
export type { EducatorCourseAnalyticsScope, LearnerDirectoryFilter, CoursePerformancePagination } from './queries';
