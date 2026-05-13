/**
 * Learner Profile Model Layer
 * 
 * Exports consolidated domain hooks for learner profile management
 */

// Domain hooks
export { useLearnerProfile } from './useLearnerProfile';
export { useLearnerAcademics } from './useLearnerAcademics';
export { useLearnerPortfolio } from './useLearnerPortfolio';
export { useLearnerActivity } from './useLearnerActivity';
export { useLearnerMessages } from './useLearnerMessages';
export { useLearnerSettings } from './useLearnerSettings';
export { default as useProfileCompletion } from './useProfileCompletion';
export { useLearnerDashboard } from './useLearnerDashboard';
export { useLearnerAssessment } from './useLearnerAssessment';
export { useLearnerAIRecommendations } from './useLearnerAIRecommendations';

// Types
export type {
  UselearnerProfileOptions,
  Education,
  Experience,
  Skill
} from './useLearnerProfile';

export type {
  UselearnerAcademicsOptions,
  CurriculumData,
  ExamResult,
  AssessmentResult
} from './useLearnerAcademics';

export type {
  UselearnerPortfolioOptions,
  Project,
  Certificate,
  Training
} from './useLearnerPortfolio';

export type {
  UselearnerActivityOptions,
  LearningItem,
  Achievement,
  Badge,
  RecentUpdate
} from './useLearnerActivity';

export type {
  UseLearnerMessagesOptions,
  Conversation
} from './useLearnerMessages';

export type {
  UselearnerSettingsOptions,
  LearnerSettings
} from './useLearnerSettings';

// Types from types.ts (previously in ui/types/)
export type {
  Learner,
  Course,
  LessonPlan,
  AdmissionNote,
  LearnerProfileDrawerProps,
  TabConfig,
  ActionConfig
} from './types';
