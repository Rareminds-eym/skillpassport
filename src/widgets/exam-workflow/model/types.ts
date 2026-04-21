/**
 * Exam Workflow Widget Types
 */

export interface ExamWorkflowProps {
  examId?: string
  onComplete?: () => void
  onCancel?: () => void
}
