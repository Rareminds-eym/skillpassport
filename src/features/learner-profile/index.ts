/**
 * Learner Profile Feature - Public API
 * 
 * This is the main entry point for the learner profile feature.
 * Other features and pages should import from this file rather than internal modules.
 * 
 * @example
 * ```typescript
 * import { LearnerProfileDrawer, useLearnerProfile } from '@/features/learner-profile';
 * ```
 */

// ============================================================================
// UI Components
// ============================================================================

export { LearnerProfileDrawer } from './ui';
export {
  AdmissionNoteModal,
  SchoolAdmissionNoteModal,
  MessageModal,
  ExportModal,
  CertificatesEditModal,
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  ProjectsEditModal,
  SkillsEditModal,
  SoftSkillsEditModal,
  TechnicalSkillsEditModal,
  PersonalInfoEditModal
} from './ui/modals';

// Default export for Header component

// ============================================================================
// State Management (Domain Hooks)
// ============================================================================

export {
  useLearnerProfile,
  useLearnerAcademics,
  useLearnerPortfolio,
  useLearnerActivity,
  useLearnerMessages,
  useLearnerSettings,
  useProfileCompletion,
  useLearnerDashboard,
  useLearnerAssessment,
  useLearnerAIRecommendations
} from './model';

// ============================================================================
// API Services
// ============================================================================

export {
  learnerProfileService
} from './api';

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  Learner as LearnerProfile,
  Project,
  Certificate,
  CourseExtended as Course,

  // Academic types
  AssessmentResult as AcademicRecord,
  CurriculumData,

  // Component props
  LearnerProfileDrawerProps
} from '@/shared/types';

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
export type { default as LearnerPublicViewer } from './ui/LearnerPublicViewer';
export { ProfileValidationService } from './api/profileValidationService';

export { checkProfileCompleteness } from './lib/profileCompletenessChecker';

export { getPromptDismissed } from './lib/profilePromptPreference';

export { setPromptDismissed } from './lib/profilePromptPreference';

// Hooks
export { useProfileCompletionPrompt } from './model/useProfileCompletionPrompt';
