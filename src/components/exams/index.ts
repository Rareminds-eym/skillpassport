// Export all exam components for easier imports
export { default as StatsCard } from './StatsCard';
export { default as StatusBadge } from './StatusBadge';
export { default as TypeBadge } from './TypeBadge';
export { default as ModalWrapper } from './ModalWrapper';
export { default as WorkflowStepper } from './WorkflowStepper';
export { default as ExamCard } from './ExamCard';
export { default as CreateExamForm } from './CreateExamForm';
export { default as ExamWorkflowManager } from './ExamWorkflowManager';

// Export workflow step components
export { default as ExamCreationStep } from './workflow/ExamCreationStep';
export { default as TimetableStep } from './workflow/TimetableStep';
export { default as InvigilationStep } from './workflow/InvigilationStep';
export { default as MarksEntryStep } from './workflow/MarksEntryStep';
export { default as ModerationStep } from './workflow/ModerationStep';
export { default as PublishingStep } from './workflow/PublishingStep';
export { default as ResultsStep } from './workflow/ResultsStep';

// Export types and constants
export * from './types';
