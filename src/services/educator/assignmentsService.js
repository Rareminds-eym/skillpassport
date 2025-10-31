import { supabase } from '../../lib/supabaseClient';

/**
 * Educator Assignments Service
 * Handles all database operations for educators to create and manage assignments
 * Uses the assignments and assignment_attachments tables
 */

/**
 * Create a new assignment
 * @param {Object} assignmentData - Assignment data
 * @returns {Promise<Object>} Created assignment
 */
export const createAssignment = async (assignmentData) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert([
        {
          title: assignmentData.title,
          description: assignmentData.description,
          instructions: assignmentData.instructions,
          course_name: assignmentData.course_name,
          course_code: assignmentData.course_code,
          educator_id: assignmentData.educator_id,
          educator_name: assignmentData.educator_name,
          total_points: assignmentData.total_points || 100,
          assignment_type: assignmentData.assignment_type,
          skill_outcomes: assignmentData.skill_outcomes,
          assign_classes: assignmentData.assign_classes,
          document_pdf: assignmentData.document_pdf,
          due_date: assignmentData.due_date,
          available_from: assignmentData.available_from,
          allow_late_submission: assignmentData.allow_late_submission ?? true
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

/**
 * Get all assignments created by an educator
 * @param {string} educatorId - The UUID of the educator
 * @returns {Promise<Array>} Array of assignments
 */
export const getAssignmentsByEducator = async (educatorId) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_attachments (*)
      `)
      .eq('educator_id', educatorId)
      .eq('is_deleted', false)
      .order('created_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching educator assignments:', error);
    throw error;
  }
};

/**
 * Get a single assignment by ID
 * @param {string} assignmentId - The UUID of the assignment
 * @returns {Promise<Object>} Assignment with attachments
 */
export const getAssignmentById = async (assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_attachments (*)
      `)
      .eq('assignment_id', assignmentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching assignment:', error);
    throw error;
  }
};

/**
 * Update an assignment
 * @param {string} assignmentId - The UUID of the assignment
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated assignment
 */
export const updateAssignment = async (assignmentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .update({
        ...updates,
        updated_date: new Date().toISOString()
      })
      .eq('assignment_id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }
};

/**
 * Soft delete an assignment
 * @param {string} assignmentId - The UUID of the assignment
 * @returns {Promise<boolean>} Success status
 */
export const deleteAssignment = async (assignmentId) => {
  try {
    const { error } = await supabase
      .from('assignments')
      .update({ 
        is_deleted: true, 
        updated_date: new Date().toISOString() 
      })
      .eq('assignment_id', assignmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw error;
  }
};

/**
 * Add attachment to an assignment
 * @param {string} assignmentId - The UUID of the assignment
 * @param {Object} attachmentData - Attachment details
 * @returns {Promise<Object>} Created attachment
 */
export const addAssignmentAttachment = async (assignmentId, attachmentData) => {
  try {
    const { data, error } = await supabase
      .from('assignment_attachments')
      .insert([
        {
          assignment_id: assignmentId,
          file_name: attachmentData.file_name,
          file_type: attachmentData.file_type,
          file_size: attachmentData.file_size,
          file_url: attachmentData.file_url
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding attachment:', error);
    throw error;
  }
};

/**
 * Remove attachment from an assignment
 * @param {string} attachmentId - The UUID of the attachment
 * @returns {Promise<boolean>} Success status
 */
export const removeAssignmentAttachment = async (attachmentId) => {
  try {
    const { error } = await supabase
      .from('assignment_attachments')
      .delete()
      .eq('attachment_id', attachmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing attachment:', error);
    throw error;
  }
};

/**
 * Assign assignment to students
 * @param {string} assignmentId - The UUID of the assignment
 * @param {Array<string>} studentIds - Array of student UUIDs
 * @param {Object} defaults - Default values for student assignments
 * @returns {Promise<Array>} Created student assignments
 */
export const assignToStudents = async (assignmentId, studentIds, defaults = {}) => {
  try {
    const studentAssignments = studentIds.map(studentId => ({
      assignment_id: assignmentId,
      student_id: studentId,
      status: defaults.status || 'todo',
      priority: defaults.priority || 'medium'
    }));

    const { data, error } = await supabase
      .from('student_assignments')
      .insert(studentAssignments)
      .select();

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error assigning to students:', error);
    throw error;
  }
};

/**
 * Get all students assigned to a specific assignment with their submission status
 * @param {string} assignmentId - The UUID of the assignment
 * @returns {Promise<Array>} Array of students with their assignment status
 */
export const getAssignmentStudents = async (assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('student_assignments')
      .select(`
        *,
        students (
          id,
          name,
          email,
          profile
        )
      `)
      .eq('assignment_id', assignmentId)
      .eq('is_deleted', false)
      .order('assigned_date', { ascending: false });

    if (error) throw error;
    
    // Flatten the response and extract from profile JSONB
    const flattenedData = data?.map(item => {
      const student = item.students;
      const profile = student?.profile || {};
      
      return {
        ...item,
        student: {
          id: student?.id,
          name: student?.name || profile.name || 'Unknown',
          email: student?.email || profile.email || '',
          university: profile.university || '',
          branch_field: profile.branch_field || '',
          college_school_name: profile.college_school_name || '',
          registration_number: profile.registration_number || ''
        }
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
 * @param {string} studentAssignmentId - The UUID of the student_assignment
 * @param {Object} gradingData - Grading details
 * @returns {Promise<Object>} Updated student assignment
 */
export const gradeAssignment = async (studentAssignmentId, gradingData) => {
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

/**
 * Get assignment statistics for educator
 * @param {string} assignmentId - The UUID of the assignment
 * @returns {Promise<Object>} Statistics object
 */
export const getAssignmentStatistics = async (assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('student_assignments')
      .select('status, grade_percentage, is_late')
      .eq('assignment_id', assignmentId)
      .eq('is_deleted', false);

    if (error) throw error;

    const stats = {
      total: data.length,
      todo: data.filter(a => a.status === 'todo').length,
      inProgress: data.filter(a => a.status === 'in-progress').length,
      submitted: data.filter(a => a.status === 'submitted').length,
      graded: data.filter(a => a.status === 'graded').length,
      lateSubmissions: data.filter(a => a.is_late).length,
      averageGrade: 0
    };

    // Calculate average grade for graded assignments
    const gradesArray = data
      .filter(a => a.grade_percentage !== null)
      .map(a => a.grade_percentage);
    
    if (gradesArray.length > 0) {
      stats.averageGrade = Math.round(
        gradesArray.reduce((sum, grade) => sum + grade, 0) / gradesArray.length
      );
    }

    return stats;
  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    throw error;
  }
};

