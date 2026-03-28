/**
 * Assessment Hooks - Main Export
 * 
 * Centralized exports for all assessment-related hooks.
 * 
 * @module features/assessment/model
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
  Section as NavigationSection 
} from './useQuestionNavigation';

// Auto-save functionality
export { useAutoSave } from './useAutoSave';
export type { UseAutoSaveOptions, UseAutoSaveReturn, AutoSaveData } from './useAutoSave';

// Tab visibility detection
export { useTabVisibility } from './useTabVisibility';
export type { UseTabVisibilityOptions, UseTabVisibilityReturn } from './useTabVisibility';

// Assessment test hooks (from career-test)
export { useAssessmentSubmission } from './useAssessmentSubmission';
export { useStudentGrade } from './useStudentGrade';
export { useAIQuestions } from './useAIQuestions';
export { useAssessmentProgress } from './useAssessmentProgress';

// Assessment results hook
// @ts-expect-error - JS file without type declarations
export { useAssessmentResults } from './useAssessmentResults';

// Assessment recommendations hook
// @ts-expect-error - JS file without type declarations
export { useAssessmentRecommendations } from './useAssessmentRecommendations';

// Main assessment hook
// @ts-expect-error - TS file with potential type issues
export { useAssessment } from './useAssessment';

// Assessment context
export { AssessmentProvider, useAssessmentContext } from './AssessmentContext';
