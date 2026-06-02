import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('educator-assignments-service');

interface SubmissionFile {
  attachment_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  original_filename: string;
}

interface LearnerAssignment {
  learner_assignment_id: string;
  assignment_id: string;
  learner_id: string;
  status: string;
  grade_received?: number;
  grade_percentage?: number;
  instructor_feedback?: string;
  submission_date?: string;
  submission_content?: string;
  submission_url?: string;
  is_late?: boolean;
  graded_date?: string;
  assigned_date?: string;
  updated_date?: string;
  learner?: any;
  submission_files?: SubmissionFile[];
}

interface GradingData {
  grade_received: number;
  instructor_feedback?: string;
  graded_by?: string;
}

export const getAssignmentLearners = async (assignmentId: string): Promise<LearnerAssignment[]> => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getAssignmentLearners',
      assignmentId,
    });
    return result?.data || [];
  } catch (error) {
    logger.error('Fetch assignment learners failed', error instanceof Error ? error : new Error(String(error)), { assignmentId });
    throw error;
  }
};

export const gradeAssignment = async (learnerAssignmentId: string, gradingData: GradingData): Promise<LearnerAssignment> => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'gradeAssignment',
      learnerAssignmentId,
      gradingData,
    });
    return result?.data;
  } catch (error) {
    logger.error('Grade assignment failed', error instanceof Error ? error : new Error(String(error)), { learnerAssignmentId });
    throw error;
  }
};
