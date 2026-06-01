/**
 * Assessment Hooks - Main Export
 *
 * Centralized exports for all assessment-related hooks.
 *
 * @module features/assessment/model
 */

// Types
export * from './types';

// Core assessment flow
export { useAssessmentFlow } from './useCareerTestFlow';
export type { AssessmentFlowState, AssessmentAction } from './useCareerTestFlow';

// Timer management
export { default as useAssessmentTimer } from './useAssessmentTimer';
export type { UseAssessmentTimerOptions, UseAssessmentTimerReturn } from './useAssessmentTimer';

// Question navigation
export { default as useQuestionNavigation } from './useQuestionNavigation';
export type {
  UseQuestionNavigationOptions,
  UseQuestionNavigationReturn,
  Question as NavigationQuestion,
  Section as NavigationSection
} from './useQuestionNavigation';

// Auto-save functionality
export { default as useAutoSave } from './useAutoSave';
export type { UseAutoSaveOptions, UseAutoSaveReturn, AutoSaveData } from './useAutoSave';

// Tab visibility detection
export { default as useTabVisibility } from './useTabVisibility';
export type { UseTabVisibilityOptions, UseTabVisibilityReturn } from './useTabVisibility';

// Assessment test hooks (from career-test)
export { default as useAssessmentSubmission } from './useAssessmentSubmission';
export { default as useLearnerGrade } from './useLearnerGrade';
export { default as useAIQuestions } from './useAIQuestions';
export { default as useAssessmentProgress } from './useAssessmentProgress';

// Assessment results hook
// @ts-expect-error - JS file without type declarations
export { useAssessmentResults } from './useAssessmentResults';

// Assessment recommendations hook
// @ts-expect-error - JS file without type declarations
export { useAssessmentRecommendations } from './useAssessmentRecommendations';

// Main assessment hook
// @ts-expect-error - TS file with potential type issues
export { default as useAssessment } from './useAssessment';

// Assessment store and service
export * from './assessmentStore';
export { useAssessmentService } from './useAssessmentService';

// Adaptive Aptitude hook
export { useAdaptiveAptitude } from '../lib/useAdaptiveAptitude';
export type { UseAdaptiveAptitudeOptions } from '../lib/useAdaptiveAptitude';
