/**
 * Context Exports - Redirected to Zustand Store
 * 
 * @module features/assessment/career-test/context
 */

// Re-export the Zustand store hooks for backward compatibility
export { 
  useAssessmentStore as useAssessmentContext,
  useAssessmentStatus,
  useAssessmentAnswers,
  useAssessmentCurrentQuestion,
  useAssessmentTime,
  useAssessmentFlowActions,
  useAssessmentNavigation,
  useAssessmentSections,
  useAssessmentQuestion,
  useAssessmentDatabase,
  useAssessmentAdaptive
} from '../../../../stores/assessmentStore';

// For components that need the provider pattern, they can now use the store directly
export const AssessmentProvider = ({ children }: { children: React.ReactNode }) => children;
