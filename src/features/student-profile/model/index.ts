/**
 * Student Profile Model Layer
 * 
 * Exports consolidated domain hooks for student profile management
 */

// Domain hooks
export { useStudentProfile } from './useStudentProfile';
export { useStudentAcademics } from './useStudentAcademics';
export { useStudentPortfolio } from './useStudentPortfolio';
export { useStudentActivity } from './useStudentActivity';
export { useStudentMessages } from './useStudentMessages';
export { useStudentSettings } from './useStudentSettings';
export { useProfileCompletion } from './useProfileCompletion';

// Types
export type {
  UseStudentProfileOptions,
  Education,
  Experience,
  Skill
} from './useStudentProfile';

export type {
  UseStudentAcademicsOptions,
  CurriculumData,
  ExamResult,
  AssessmentResult
} from './useStudentAcademics';

export type {
  UseStudentPortfolioOptions,
  Project,
  Certificate,
  Training
} from './useStudentPortfolio';

export type {
  UseStudentActivityOptions,
  LearningItem,
  Achievement,
  Badge,
  RecentUpdate
} from './useStudentActivity';

export type {
  UseStudentMessagesOptions,
  Conversation
} from './useStudentMessages';

export type {
  UseStudentSettingsOptions,
  StudentSettings
} from './useStudentSettings';
