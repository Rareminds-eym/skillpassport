/**
 * Course State Management
 * Public API for course-related hooks
 */

// Course list and filtering
export {
  useCourses,
  useCourse,
  useCourseModules,
  useCourseFilterOptions
} from './useCourses';

// Course enrollment
export {
  useCourseEnrollment,
  useStudentEnrollments,
  useCourseEnrollments,
  useEducatorEnrollmentStats
} from './useCourseEnrollment';

// Course progress tracking
export {
  useVideoProgress,
  useRestorePoint,
  useLessonProgress,
  useQuizProgress,
  useCourseProgressSummary,
  useAllCoursesProgress
} from './useCourseProgress';

// Course performance analytics
export { useCoursePerformance } from './useCoursePerformance';

// Lesson plans
export { useLessonPlans } from './useLessonPlans';

// Session & offline sync
export { useSessionRestore } from './useSessionRestore';
export { useOfflineSync } from './useOfflineSync';
