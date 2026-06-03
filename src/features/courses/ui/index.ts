// Educator course components
export { default as CourseCard } from './CourseCard';
export { default as CourseDetailDrawer } from './CourseDetailDrawer';
export { default as CourseFilters } from './CourseFilters';
export { default as CreateCourseModal } from './CreateCourseModal';
export { default as AddLessonModal } from './AddLessonModal';
export { default as AssignEducatorModal } from './AssignEducatorModal';
export { default as ResourceUploadComponent } from './ResourceUploadComponent';

// Learner course components
export { default as CourseDetailModal } from './CourseDetailModal';
export { default as QuizProgressTracker } from './QuizProgressTracker';
export { default as RestoreProgressModal } from './RestoreProgressModal';
export { default as SyncStatusIndicator } from './SyncStatusIndicator';

/**
 * CoursePlayer Component Location
 * 
 * Moved to: @/pages/learner/CoursePlayer.jsx
 * Reason: Pages layer component with routing logic
 * 
 * Not exported from features layer to maintain FSD compliance.
 * Import directly from pages when needed:
 * import CoursePlayer from '@/pages/learner/CoursePlayer';
 */
