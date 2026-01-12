/**
 * Assessment Results - Main Export
 * 
 * Re-exports from the assessment-result page module for convenience.
 * The actual components remain in pages/student/assessment-result/ for routing.
 * 
 * @module features/assessment/results
 */

// =============================================================================
// HOOKS (named export)
// =============================================================================
// @ts-expect-error - JS file without type declarations
export { useAssessmentResults } from '../../../pages/student/assessment-result/hooks/useAssessmentResults';

// =============================================================================
// UTILITIES (default exports)
// =============================================================================
// @ts-expect-error - JS file without type declarations
export { calculateStreamRecommendations, default as streamMatchingEngine } from '../../../pages/student/assessment-result/utils/streamMatchingEngine';

// Note: courseMatchingEngine exports are complex - import directly if needed
// export { COURSE_KNOWLEDGE_BASE, DEGREE_PROGRAMS, calculateCourseRecommendations } from '../../../pages/student/assessment-result/utils/courseMatchingEngine';

// =============================================================================
// CONSTANTS (named exports)
// =============================================================================
// Note: RIASEC_NAMES, RIASEC_COLORS, TRAIT_NAMES, TRAIT_COLORS are already 
// exported from constants/config.ts - import from there instead
export {
  PRINT_STYLES,
  // @ts-expect-error - JS file without type declarations
} from '../../../pages/student/assessment-result/constants';

// =============================================================================
// COMPONENTS (re-export from components/index.js which uses default exports)
// =============================================================================
export {
  ProgressRing,
  SummaryCard,
  InfoCard,
  PrintView,
  ErrorState,
  LoadingState,
  ReportHeader,
  CourseRecommendationCard,
  // Section components
  CareerSection,
  ProfileSection,
  RecommendedCoursesSection,
  RoadmapSection,
  SkillsSection,
  // @ts-expect-error - JS file without type declarations
} from '../../../pages/student/assessment-result/components';
