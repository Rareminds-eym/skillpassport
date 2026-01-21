/**
 * Assessment Hooks - Main Export
 *
 * Centralized exports for all assessment-related hooks.
 *
 * @module features/assessment/hooks
 */

// Core assessment flow
export { useAssessmentFlow } from './useAssessmentFlow';
export type { AssessmentFlowState, AssessmentAction } from './useAssessmentFlow';

// Timer management
export { useAssessmentTimer } from './useAssessmentTimer';
export type { UseAssessmentTimerOptions, UseAssessmentTimerReturn } from './useAssessmentTimer';

// Question navigation
export { useQuestionNavigation } from './useQuestionNavigation';
export type {
  UseQuestionNavigationOptions,
  UseQuestionNavigationReturn,
  Question as NavigationQuestion,
  Section as NavigationSection,
} from './useQuestionNavigation';

// Auto-save functionality
export { useAutoSave } from './useAutoSave';
export type { UseAutoSaveOptions, UseAutoSaveReturn, AutoSaveData } from './useAutoSave';

// Tab visibility detection
export { useTabVisibility } from './useTabVisibility';
export type { UseTabVisibilityOptions, UseTabVisibilityReturn } from './useTabVisibility';
