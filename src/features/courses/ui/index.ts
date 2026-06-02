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

// Course player is now in pages/learner/CoursePlayer.jsx
// Not exported from features layer to maintain FSD compliance
