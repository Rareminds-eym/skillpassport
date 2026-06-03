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
 * ⚠️ BREAKING CHANGE (if you were importing from here)
 * 
 * Location: @/pages/learner/CoursePlayer.jsx
 * Reason: Moved to pages layer - contains routing logic and page-level concerns
 * 
 * Migration Path:
 * OLD: import { CoursePlayer } from '@/features/courses/ui'  // ❌ No longer exists
 * NEW: import CoursePlayer from '@/pages/learner/CoursePlayer'  // ✅ Correct import
 * 
 * Not exported from features layer to maintain FSD architectural compliance.
 */
