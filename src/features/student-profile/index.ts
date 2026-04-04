/**
 * Student Profile Feature - Public API
 * 
 * This is the main entry point for the student profile feature.
 * Other features and pages should import from this file rather than internal modules.
 * 
 * @example
 * ```typescript
 * import { StudentProfileDrawer, useStudentProfile } from '@/features/student-profile';
 * ```
 */

// ============================================================================
// UI Components
// ============================================================================

export { StudentProfileDrawer } from './ui';
export { AdmissionNoteModal, SchoolAdmissionNoteModal, MessageModal, ExportModal } from './ui/modals';
export {
  CertificatesEditModal,
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  ProjectsEditModal,
  SkillsEditModal
} from '@/widgets/student-dashboard/ui/modals';

// Default export for Header component

// ============================================================================
// State Management (Domain Hooks)
// ============================================================================

export {
  useStudentProfile,
  useStudentAcademics,
  useStudentPortfolio,
  useStudentActivity,
  useStudentMessages,
  useStudentSettings,
  useProfileCompletion
} from './model';

// ============================================================================
// API Services
// ============================================================================

export {
  studentProfileService,
  studentDocumentService
} from './api';

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  Student as StudentProfile,
  Project,
  Certificate,
  Course,

  // Academic types
  AssessmentResult as AcademicRecord,
  CurriculumData,

  // Component props
  StudentProfileDrawerProps
} from './ui/types';

export type {
  // Profile hook types
  Education,
  Experience,
  Skill,

  // Academic hook types
  ExamResult,

  // Portfolio hook types
  Training,

  // Activity hook types
  LearningItem,
  Achievement,
  Badge,
  RecentUpdate
} from './model';

// API & Data Access
export * from './api';
export { showProfileErrorToast } from './lib/profileToast';
export { showProfileUpdateToast } from './lib/profileToast';
export { PROFILE_UPDATE_MESSAGES } from './lib/profileToast';
export type { default as AchievementsExpanded } from './ui/AchievementsExpanded';
export type { default as SkillTrackerExpanded } from './ui/SkillTrackerExpanded';
export type { default as StudentPublicViewer } from './ui/StudentPublicViewer';
export type { ProfileValidationService } from './api/profileValidationService';

export { checkProfileCompleteness } from './lib/profileCompletenessChecker';

export { getPromptDismissed } from './lib/profilePromptPreference';

export { setPromptDismissed } from './lib/profilePromptPreference';

// Hooks
export { useProfileCompletionPrompt } from './model/useProfileCompletionPrompt';
