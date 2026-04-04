/**
 * Course Entity - Model Layer Public API
 */

// Types
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
} from '@/shared/types';

// Validation
export {
  isValidCourseStatus,
  validateCourse,
  validateCourseModule,
  validateLesson,
  isValidCourseCode,
  canEnrollInCourse,
} from './validation';

// Utils
export {
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
} from './utils';
