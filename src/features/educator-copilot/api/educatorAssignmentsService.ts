import { supabase } from '@/shared/api/supabaseClient';

/**
 * Educator Assignments Service
 * Handles educator-specific assignment operations like grading and viewing student submissions
 */

interface Student {
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

interface StudentAssignment {
  student_assignment_id: string;
  assignment_id: string;
  student_id: string;
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
  student?: Student;
  submission_files?: SubmissionFile[];
}

interface GradingData {
  grade_received: number;
  instructor_feedback?: string;
  graded_by?: string;
}

/**
 * Get all submission files for an assignment grouped by student
 */
const getStudentSubmissionFiles = async (assignmentId: string): Promise<Record<string, SubmissionFile[]>> => {
  try {
    const { data, error } = await supabase
      .from('assignment_attachments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .like('file_name', 'STUDENT:%')
      .order('uploaded_date', { ascending: false });
      
    if (error) throw error;
    
    const groupedFiles: Record<string, SubmissionFile[]> = {};
    data?.forEach(file => {
      const match = file.file_name.match(/^STUDENT:([^:]+):/);
      if (match) {
        const studentAssignmentId = match[1];
        if (!groupedFiles[studentAssignmentId]) {
          groupedFiles[studentAssignmentId] = [];
        }
        
        const originalFilename = file.file_name.replace(/^STUDENT:[^:]+:/, '');
        groupedFiles[studentAssignmentId].push({
          ...file,
          original_filename: originalFilename
        });
      }
    });
    
    return groupedFiles;
  } catch (error) {
    console.error('Error fetching student submission files:', error);
    throw error;
  }
};

/**
 * Get all students assigned to a specific assignment with their submission status and files
 */
export const getAssignmentStudents = async (assignmentId: string): Promise<StudentAssignment[]> => {
  try {
    const { data, error } = await supabase
      .from('student_assignments')
      .select(`
        *,
        students (
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

    const submissionFiles = await getStudentSubmissionFiles(assignmentId);

    const flattenedData = data?.map(item => {
      const student = item.students;
      const studentSubmissionFiles = submissionFiles[item.student_assignment_id] || [];

      return {
        ...item,
        student: {
          id: student?.id,
          name: student?.name || 'Unknown',
          email: student?.email || '',
          university: student?.university || '',
          branch_field: student?.branch_field || '',
          college_school_name: student?.college_school_name || '',
          registration_number: student?.registration_number || ''
        },
        submission_files: studentSubmissionFiles
      };
    }) || [];

    return flattenedData;
  } catch (error) {
    console.error('Error fetching assignment students:', error);
    throw error;
  }
};

/**
 * Grade a student's assignment submission
 */
export const gradeAssignment = async (studentAssignmentId: string, gradingData: GradingData): Promise<StudentAssignment> => {
  try {
    const { data, error } = await supabase
      .from('student_assignments')
      .update({
        grade_received: gradingData.grade_received,
        instructor_feedback: gradingData.instructor_feedback,
        graded_by: gradingData.graded_by,
        graded_date: new Date().toISOString(),
        feedback_date: new Date().toISOString(),
        status: 'graded',
        updated_date: new Date().toISOString()
      })
      .eq('student_assignment_id', studentAssignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error grading assignment:', error);
    throw error;
  }
};
