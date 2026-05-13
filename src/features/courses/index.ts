/**
 * Courses Feature Public API
 * 
 * This is the main entry point for the courses feature.
 * All external imports should go through this file.
 */

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// Primary UI components
export {
  CourseCard,
  CourseDetailDrawer,
  CoursePlayer,
  CreateCourseModal
} from './ui';

// Additional UI components (available but not primary exports)
export {
  CourseFilters,
  AddLessonModal,
  AssignEducatorModal,
  ResourceUploadComponent,
  CourseDetailModal,
  QuizProgressTracker,
  RestoreProgressModal,
  SyncStatusIndicator
} from './ui';

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT (HOOKS)
// ═══════════════════════════════════════════════════════════════════════════

// Course list and filtering
export {
  useCourses,
  useCourse,
  useCourseModules,
  useCourseFilterOptions
} from './model';

// Course enrollment
export {
  useCourseEnrollment,
  useLearnerEnrollments,
  useCourseEnrollments,
  useEducatorEnrollmentStats
} from './model';

// Course progress tracking
export {
  useVideoProgress,
  useRestorePoint,
  useLessonProgress,
  useQuizProgress,
  useCourseProgressSummary,
  useAllCoursesProgress
} from './model';

// Course performance analytics
export { useCoursePerformance } from './model';

// ═══════════════════════════════════════════════════════════════════════════
// API SERVICES
// ═══════════════════════════════════════════════════════════════════════════

export { courseService, enrollmentService, fileService } from './api';

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES & RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

// Course recommendations (primary export)
export {
  getRecommendedCourses,
  getRecommendedCoursesByType,
  getCoursesForSkillGap,
  getCoursesForMultipleSkillGaps
} from './lib';

// Additional recommendation utilities (available but not primary)
export {
  fallbackKeywordMatching,
  fetchCoursesWithEmbeddings,
  fetchCoursesBySkillType,
  fetchBasicCourses,
  fetchCoursesBySkillName,
  generateEmbedding,
  generateSkillEmbedding,
  buildProfileText,
  generateDomainKeywords,
  getDomainKeywordsWithCache,
  clearKeywordCache,
  MAX_RECOMMENDATIONS,
  MIN_SIMILARITY_THRESHOLD,
  MAX_COURSES_PER_SKILL_GAP,
  SKILL_SIMILARITY_THRESHOLD
} from './lib/recommendations';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

// Note: Types are currently defined inline in services and components.
// When types are extracted to a dedicated types file, export them here:
// export type { Course, Lesson, Enrollment, Progress } from './model/types';

// API & Data Access
export * from './api';
export { courseDetailsService } from './api/courseDetailsService';
export { default as progressSyncManager } from './api/progressSyncManager';
export { default as courseProgressService } from './api/courseProgressService';
export { matchCoursesForRole } from './api/roleBasedMatcher';
export { useLessonPlans } from './model/index';

export type { ValidationConflict } from './lib/timetableValidation';

export { default as Resource } from './ui/ResourceUploadComponent';

export { validateTimetableSlot } from './lib/timetableValidation';

export type { Lesson } from './model/course-types';

export { getAllTimetableConflicts } from './lib/timetableValidation';

export { default as Course } from './ui/CourseCard';
