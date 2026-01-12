/**
 * Assessment Feature - Main Export
 * 
 * This module provides centralized exports for the assessment system.
 * Import from here instead of individual files for cleaner imports.
 * 
 * The assessment feature is organized into three main assessment types:
 * 1. Career Assessment - RIASEC, Big Five, personality tests for career guidance
 * 2. External Assessment - Course-specific skill tests
 * 3. Adaptive Assessment - IRT-based adaptive aptitude testing
 * 
 * @example
 * import { 
 *   // Types
 *   type AssessmentResults,
 *   type GradeLevel,
 *   
 *   // Constants
 *   GRADE_LEVELS,
 *   TIMERS,
 *   
 *   // Utilities
 *   getGradeLevelFromGrade, 
 *   formatTime,
 *   
 *   // Hooks
 *   useAssessmentFlow,
 *   useAssessmentTimer,
 *   useQuestionNavigation,
 *   useAutoSave,
 *   useTabVisibility,
 *   
 *   // Data
 *   riasecQuestions,
 *   bigFiveQuestions,
 *   calculateRIASEC,
 *   
 *   // Components
 *   GradeSelectionScreen,
 *   StreamSelectionScreen,
 * } from '@/features/assessment';
 * 
 * @module features/assessment
 */

// =============================================================================
// TYPES
// =============================================================================
export * from './types/assessment.types';

// =============================================================================
// CONSTANTS
// =============================================================================
export * from './constants/config';

// =============================================================================
// UTILITIES
// =============================================================================
export * from './utils/gradeUtils';
export * from './utils/timeUtils';
export * from './utils/answerUtils';
export * from './utils/dataTransformers';
export * from './utils/sectionUtils';
export * from './utils/validationUtils';

// =============================================================================
// HOOKS
// =============================================================================
export * from './hooks';

// =============================================================================
// DATA (Question Banks & Scoring)
// =============================================================================
export * from './data';

// =============================================================================
// COMPONENTS
// =============================================================================
// @ts-ignore - JSX components without type declarations
export * from './components';

// =============================================================================
// SERVICES (Re-exports for convenience)
// =============================================================================
// Note: Services are also available directly from './services'
// These are the most commonly used service functions
export {
  // Assessment Generation
  generateAssessment,
  validateAssessment,
  
  // Adaptive Engine
  AdaptiveEngine,
  
  // Adaptive Aptitude Service
  initializeTest,
  getNextQuestion,
  submitAnswer,
  
  // External Assessment Service
  checkAssessmentStatus,
  createAssessmentAttempt,
  updateAssessmentProgress,
  completeAssessment,
  getAssessmentHistory,
  getAssessmentByCourse,
} from './services';

// =============================================================================
// RESULTS (Assessment Result Display)
// =============================================================================
// Re-exports from assessment-result module
export * from './results';

// Direct export of AssessmentResult page component
// @ts-expect-error - JS file without type declarations
export { default as AssessmentResult } from './assessment-result/AssessmentResult';

// =============================================================================
// CAREER TEST MODULE (Refactored Assessment Components)
// =============================================================================
// New modular career test components, hooks, and configuration
// Note: Using selective exports to avoid conflicts with existing exports
export { 
  // Main Page
  AssessmentTestPage,
  
  // Hooks (prefixed to avoid conflicts)
  useAssessmentFlow,
  useAssessmentSubmission,
  useStudentGrade,
  useAIQuestions,
  useAssessmentProgress,
  
  // Context
  AssessmentProvider,
  useAssessmentContext,
  
  // Config (using aliases to avoid conflicts)
  getSectionsForGrade,
  usesAIQuestions,
  getSectionIdMapping,
  MIDDLE_SCHOOL_SECTIONS,
  HIGH_SCHOOL_SECTIONS,
  HIGHER_SECONDARY_SECTIONS,
  COMPREHENSIVE_SECTIONS,
  
  // Components
  QuestionRenderer,
  LikertQuestion,
  MCQQuestion,
  SJTQuestion,
  AdaptiveQuestion,
  QuestionNavigation,
  SectionIntroScreen,
  SectionCompleteScreen,
  LoadingScreen,
  ProgressHeader,
  TestModeControls,
} from './career-test';
