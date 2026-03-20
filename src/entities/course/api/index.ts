/**
 * Course Entity - API Layer Public API
 */

// Queries
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
} from './queries';

// Mutations
export {
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
} from './mutations';
