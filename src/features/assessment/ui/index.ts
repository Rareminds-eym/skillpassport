/**
 * Assessment Components - Main Export
 * 
 * All UI components for the assessment feature
 * 
 * @module features/assessment/ui
 */

// Selection screens
// @ts-expect-error - JSX components without type declarations
export { GradeSelectionScreen } from './GradeSelectionScreen';
// @ts-expect-error - JSX components without type declarations
export { CategorySelectionScreen } from './CategorySelectionScreen';
// @ts-expect-error - JSX components without type declarations
export { StreamSelectionScreen } from './StreamSelectionScreen';
// @ts-expect-error - JSX components without type declarations
export { ResumePromptScreen } from './ResumePromptScreen';
// @ts-expect-error - JSX components without type declarations
export { RestrictionScreen } from './RestrictionScreen';

// Assessment result components
// @ts-expect-error - JSX components without type declarations
export { default as AssessmentResult } from './AssessmentResult';
// @ts-expect-error - JSX components without type declarations
export { default as ProgressRing } from './ProgressRing';
// @ts-expect-error - JSX components without type declarations
export { default as SummaryCard } from './SummaryCard';
// @ts-expect-error - JSX components without type declarations
export { default as InfoCard } from './InfoCard';
// @ts-expect-error - JSX components without type declarations
export { default as PrintView } from './PrintView';
// @ts-expect-error - JSX components without type declarations
export { default as ErrorState } from './ErrorState';
// @ts-expect-error - JSX components without type declarations
export { default as LoadingState } from './LoadingState';
// @ts-expect-error - JSX components without type declarations
export { default as ReportHeader } from './ReportHeader';
// @ts-expect-error - JSX components without type declarations
export { default as CourseRecommendationCard } from './CourseRecommendationCard';
// @ts-expect-error - JSX components without type declarations
export { default as PrintViewCollege } from './PrintViewCollege';
// @ts-expect-error - JSX components without type declarations
export { default as PrintViewHigherSecondary } from './PrintViewHigherSecondary';
// @ts-expect-error - JSX components without type declarations
export { default as PrintViewMiddleHighSchool } from './PrintViewMiddleHighSchool';
// @ts-expect-error - JSX components without type declarations
export { default as CareerTrackModal } from './CareerTrackModal';
// @ts-expect-error - JSX components without type declarations
export { default as CoverPage } from './CoverPage';
// @ts-expect-error - JSX components without type declarations
export { default as PrintHeader } from './PrintHeader';

// Test page components
export { default as AssessmentTestPage } from './AssessmentTestPage';
export { QuestionNavigation } from './QuestionNavigation';

// Debug panels
export { AssessmentDebugPanel } from './AssessmentDebugPanel';
export { StreamDebugPanel } from './StreamDebugPanel';
