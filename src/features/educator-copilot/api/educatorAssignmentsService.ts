import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('educator-assignments-service');

/**
 * Educator Assignments Service
 * Handles educator-specific assignment operations like grading and viewing learner submissions
 */

interface Learner {
  id: string;
  name: string;
  email: string;
  university?: string;
  branch_field?: string;
  college_school_name?: string;
  registration_number?: string;
}

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
  learner?: Learner;
  submission_files?: SubmissionFile[];
}

interface GradingData {
  grade_received: number;
  instructor_feedback?: string;
  graded_by?: string;
}

/**
 * Get all submission files for an assignment grouped by learner
 */
const getlearnerSubmissionFiles = async (assignmentId: string): Promise<Record<string, SubmissionFile[]>> => {
  try {
    const { data, error } = await supabase
      .from('assignment_attachments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .like('file_name', 'LEARNER:%')
      .order('uploaded_date', { ascending: false });
      
    if (error) throw error;
    
    const groupedFiles: Record<string, SubmissionFile[]> = {};
    data?.forEach(file => {
      const match = file.file_name.match(/^LEARNER:([^:]+):/);
      if (match) {
        const learnerAssignmentId = match[1];
        if (!groupedFiles[learnerAssignmentId]) {
          groupedFiles[learnerAssignmentId] = [];
        }
        
        const originalFilename = file.file_name.replace(/^LEARNER:[^:]+:/, '');
        groupedFiles[learnerAssignmentId].push({
          ...file,
          original_filename: originalFilename
        });
      }
    });
    
    return groupedFiles;
  } catch (error) {
    logger.error('Fetch learner submission files failed', error instanceof Error ? error : new Error(String(error)), { assignmentId });
    throw error;
  }
};

/**
 * Get all learners assigned to a specific assignment with their submission status and files
 */
export const getAssignmentLearners = async (assignmentId: string): Promise<LearnerAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('learner_assignments')
      .select(`
        *,
        learners (
          id,
          name,
          email,
          university,
          branch_field,
          college_school_name,
          registration_number
        )
      `)
      .eq('assignment_id', assignmentId)
      .eq('is_deleted', false)
      .order('assigned_date', { ascending: false });

    if (error) throw error;

    const submissionFiles = await getlearnerSubmissionFiles(assignmentId);

    const flattenedData = data?.map(item => {
      const learner = item.learners;
      const learnerSubmissionFiles = submissionFiles[item.learner_assignment_id] || [];

      return {
        ...item,
        learner: {
          id: learner?.id,
          name: learner?.name || 'Unknown',
          email: learner?.email || '',
          university: learner?.university || '',
          branch_field: learner?.branch_field || '',
          college_school_name: learner?.college_school_name || '',
          registration_number: learner?.registration_number || ''
        },
        submission_files: learnerSubmissionFiles
      };
    }) || [];

    return flattenedData;
  } catch (error) {
    logger.error('Fetch assignment learners failed', error instanceof Error ? error : new Error(String(error)), { assignmentId });
    throw error;
  }
};

/**
 * Grade a learner's assignment submission
 */
export const gradeAssignment = async (learnerAssignmentId: string, gradingData: GradingData): Promise<LearnerAssignment> => {
  try {
    const { data, error } = await supabase
      .from('learner_assignments')
      .update({
        grade_received: gradingData.grade_received,
        instructor_feedback: gradingData.instructor_feedback,
        graded_by: gradingData.graded_by,
        graded_date: new Date().toISOString(),
        feedback_date: new Date().toISOString(),
        status: 'graded',
        updated_date: new Date().toISOString()
      })
      .eq('learner_assignment_id', learnerAssignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Grade assignment failed', error instanceof Error ? error : new Error(String(error)), { learnerAssignmentId });
    throw error;
  }
};
