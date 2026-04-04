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
export * from './model/types';

// =============================================================================
// CONSTANTS
// =============================================================================
export * from './lib/config/config';

// =============================================================================
// UTILITIES
// =============================================================================
export * from './lib/gradeUtils';
export * from './lib/timeUtils';
export * from './lib/answerUtils';
export * from './lib/dataTransformers';
export * from './lib/sectionUtils';
export * from './lib/validationUtils';
export { normalizeAssessmentResults } from './lib/assessmentDataNormalizer';

// =============================================================================
// HOOKS
// =============================================================================
export * from './model';

// =============================================================================
// DATA (Question Banks & Scoring)
// =============================================================================
export * from './model/questions';

// =============================================================================
// COMPONENTS
// =============================================================================
// @ts-ignore - JSX components without type declarations
export * from './ui';

// =============================================================================
// SERVICES (Re-exports for convenience)
// =============================================================================
// Note: Services are also available directly from './api'
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
} from './api';

// =============================================================================
// ASSESSMENT RESULT COMPONENTS
// =============================================================================
// Main result page component
// @ts-ignore - JS file without type declarations
export { default as AssessmentResult } from './ui/AssessmentResult';

// Result display components
export {
  ProgressRing,
  SummaryCard,
  InfoCard,
  PrintView,
  ErrorState,
  LoadingState,
  ReportHeader,
  CourseRecommendationCard,
  PrintViewCollege,
  PrintViewHigherSecondary,
  PrintViewMiddleHighSchool,
  CareerTrackModal,
  CoverPage,
  PrintHeader,
} from './ui';

// Result section components
export {
  CareerSection,
  ProfileSection,
  RecommendedCoursesSection,
  RoadmapSection,
  SkillsSection,
  StageScoresSection,
} from './ui/sections';

// =============================================================================
// ASSESSMENT TEST COMPONENTS
// =============================================================================
// Main test page
export { default as AssessmentTestPage } from './ui/AssessmentTestPage';

// Question components
export {
  QuestionRenderer,
  LikertQuestion,
  MCQQuestion,
  SJTQuestion,
  AdaptiveQuestion,
  TextQuestion,
  MultiSelectQuestion,
} from './ui/questions';

// Screen components
export {
  SectionIntroScreen,
  SectionCompleteScreen,
  LoadingScreen as TestLoadingScreen,
  ErrorScreen,
  AnalyzingScreen,
} from './ui/screens';

// Layout components
export {
  ProgressHeader,
  TestModeControls,
  QuestionLayout,
} from './ui/layout';

// Navigation
export { QuestionNavigation } from './ui';

// Test UI Components
export { default as HelpSupport } from './ui/test/HelpSupport';
export { default as InstructionsPage } from './ui/test/InstructionsPage';
export { default as NavigationButtons } from './ui/test/NavigationButtons';
export { default as NotificationModal } from './ui/test/NotificationModal';
export { default as PermissionsModal } from './ui/test/PermissionsModal';
export { default as ProgressBar } from './ui/test/ProgressBar';
export { default as QuestionCard } from './ui/test/QuestionCard';
export { default as ReviewPage } from './ui/test/ReviewPage';
export { default as TestHeader } from './ui/test/TestHeader';
export { default as TimeWarningModal } from './ui/test/TimeWarningModal';
export { default as WarningModal } from './ui/test/WarningModal';

// =============================================================================
// ASSESSMENT CONTEXT & HOOKS
// =============================================================================
export {
  AssessmentProvider,
  useAssessmentContext,
} from './model/AssessmentContext';

export {
  useAssessmentSubmission,
  useStudentGrade,
  useAIQuestions,
  useAssessmentProgress,
  useAssessmentResults,
  useAssessmentRecommendations,
} from './model';

// =============================================================================
// ASSESSMENT CONFIGURATION
// =============================================================================
export {
  getSectionsForGrade,
  usesAIQuestions,
  getSectionIdMapping,
  MIDDLE_SCHOOL_SECTIONS,
  HIGH_SCHOOL_SECTIONS,
  HIGHER_SECONDARY_SECTIONS,
  AFTER_10TH_SECTIONS,
  COMPREHENSIVE_SECTIONS,
} from './lib/config/sections';

export * from './lib/config/streams';
export * from './lib/config/assessmentResultConstants';

// =============================================================================
// ASSESSMENT UTILITIES
// =============================================================================
export * from './lib/streamMatchingEngine';
export * from './lib/courseMatchingEngine';
export * from './lib/assessmentValidation';
export * from './lib/courseRecommendations';
export * from './lib/printStyles';
export * from './lib/printUtils';

// API & Data Access
export * from './api';
export { default as employabilityQuestions } from './model/questions/employabilityQuestions';
export { streamKnowledgeQuestions } from './model/questions/streamKnowledgeQuestions';
export { validateRiasecScores } from './api/riasecScoreValidator';
export { validateAptitudeScores } from './api/aptitudeScoreValidator';
export { getInProgressAttempt } from './api/assessmentService';
export { workValuesQuestions } from './model/questions/index';
export { getLatestResult } from './api/assessmentService';
export { default as transformAssessmentResults } from './api/assessmentResultTransformer';
export { addCourseRecommendations } from './api/assessment/courseIntegration';
export { strengthsRatingScale } from './model/questions/middleSchoolQuestions';
export { default as getModuleQuestionIndex } from './model/questions/aptitudeQuestions';
export { getCurrentEmployabilityModule } from './model/questions/employabilityQuestions';
export { highSchoolRatingScale } from './model/questions/middleSchoolQuestions';
export type { default as EmbeddedAssessment } from './ui/EmbeddedAssessment';
export { default as AdaptiveAptitudeService } from './api/adaptiveAptitudeService';
export { default as AssessmentReportDrawer } from './ui/AssessmentReportDrawer';

export { TRAIT_NAMES } from './lib/config/assessmentResultConstants';

export { PRINT_STYLES } from './lib/config/assessmentResultConstants';

export { printStyles } from './lib/printStyles';

export { GRADE_LEVELS } from './lib/config/config';

export { PROGRAM_GRADE_MAPPINGS } from './lib/config/config';

export { RIASEC_COLORS } from './lib/config/assessmentResultConstants';

export { RIASEC_NAMES } from './lib/config/assessmentResultConstants';

export { RESPONSE_SCALES } from './lib/config/config';

export { GRADE_RANGES } from './lib/config/config';

export { TRAIT_COLORS } from './lib/config/assessmentResultConstants';

export { default as Question } from './ui/QuestionNavigation';

export { calculateStreamRecommendations } from './lib/streamMatchingEngine';
