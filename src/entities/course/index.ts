/**
 * Course Entity - Public API
 * Central export point for all course entity functionality
 */

// Model exports
export type {
  Course,
  CourseModule,
  Lesson,
  Resource,
  CourseAnalytics,
  SkillProgress,
  CoursePerformance,
  CourseProgress,
  CourseEnrollmentProgress,
  CourseEnrollment,
  CourseMapping,
  CourseRecommendation,
  CourseForMatching,
  CourseMatchingResult,
  CourseContext,
  AvailableCourse,
  FileUpload,
  CourseFilters,
} from './model';

export {
  isValidCourseStatus,
  validateCourse,
  validateCourseModule,
  validateLesson,
  isValidCourseCode,
  canEnrollInCourse,
  getCourseDisplayTitle,
  getCourseDuration,
  calculateCourseProgress,
  getCourseProgressStatus,
  getTotalLessons,
  sortModulesByOrder,
  getModuleLessonCount,
  filterCoursesByStatus,
  filterActiveCourses,
  searchCourses,
  filterCoursesByCategory,
  sortCoursesByTitle,
  sortCoursesByEnrollment,
  sortCoursesByCompletionRate,
  getCourseStats,
  isSameCourse,
  getCourseUrl,
  getCourseThumbnailUrl,
} from './model';

// API exports
export {
  getCourses,
  getCourse,
  getActiveCourses,
  getUserEnrollments,
  getCourseEnrollments,
  isUserEnrolled,
  getCourseProgress,
  getUserCourseProgress,
  getCourseAnalytics,
  getCourseStats,
  getCourseModules,
  getCourseModule,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus,
  enrollInCourse,
  unenrollFromCourse,
  completeCourse,
  updateCourseProgress,
  markLessonComplete,
  createCourseModule,
  updateCourseModule,
  deleteCourseModule,
  reorderCourseModules,
} from './api';

// UI exports
export { CourseCard, CourseProgress } from './ui';
