import { supabase } from '../lib/supabaseClient';

/**
 * Assignments Service
 * Handles all database operations for student assignments
 * Uses the student_assignments junction table to link students with assignments
 */

/**
 * Fetch all assignments for a specific student
 * @param {string} studentId - The UUID of the student
 * @returns {Promise<Array>} Array of assignments with student-specific data
 */
export const getAssignmentsByStudentId = async (studentId) => {
  try {
    debugger;

    // STEP 1: Convert students.id → students.user_id
    const { data: studentRow, error: mapError } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('id', studentId)
      .single();

    if (mapError) throw mapError;

    const uid = studentRow?.user_id;
    if (!uid) throw new Error('Student user_id not found');

    // STEP 2: Fetch student assignments using user_id
    const { data, error } = await supabase
      .from('student_assignments')
      .select(`
        *,
        assignments (
          assignment_id,
          title,
          description,
          instructions,
          course_name,
          course_code,
          educator_id,
          educator_name,
          total_points,
          assignment_type,
          skill_outcomes,
          assign_classes,
          document_pdf,
          due_date,
          available_from,
          created_date,
          allow_late_submission
        )
      `)
      .eq('student_id', uid)               // <-- FIXED
      .eq('is_deleted', false)
      .order('assignments(due_date)', { ascending: true });

    if (error) throw error;

    // STEP 3: Flatten the output
    const flattenedData = data?.map(item => ({
      ...item.assignments,
      student_assignment_id: item.student_assignment_id,
      status: item.status,
      priority: item.priority,
      grade_received: item.grade_received,
      grade_percentage: item.grade_percentage,
      instructor_feedback: item.instructor_feedback,
      feedback_date: item.feedback_date,
      graded_by: item.graded_by,
      graded_date: item.graded_date,
      submission_date: item.submission_date,
      submission_type: item.submission_type,
      submission_content: item.submission_content,
      submission_url: item.submission_url,
      is_late: item.is_late,
      late_penalty: item.late_penalty,
      assigned_date: item.assigned_date,
      started_date: item.started_date,
      completed_date: item.completed_date
    })) || [];

    return flattenedData;

  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
};

/**
 * Fetch assignments by status for a student
 * @param {string} studentId - The UUID of the student
 * @param {string} status - The status filter (todo, in-progress, submitted, graded)
 * @returns {Promise<Array>} Array of filtered assignments
 */
export const getAssignmentsByStatus = async (studentId, status) => {
  try {
    const { data, error } = await supabase
      .from('student_assignments')
      .select(`
        *,
        assignments (
          assignment_id,
          title,
          description,
          instructions,
          course_name,
          course_code,
          total_points,
          assignment_type,
          skill_outcomes,
          due_date,
          document_pdf
        )
      `)
      .eq('student_id', studentId)
      .eq('status', status)
      .eq('is_deleted', false)
      .order('assignments(due_date)', { ascending: true });

    if (error) throw error;
    
    const flattenedData = data?.map(item => ({
      ...item.assignments,
      student_assignment_id: item.student_assignment_id,
      status: item.status,
      priority: item.priority,
      grade_received: item.grade_received,
      grade_percentage: item.grade_percentage,
      submission_date: item.submission_date,
      is_late: item.is_late
    })) || [];
    
    return flattenedData;
  } catch (error) {
    console.error('Error fetching assignments by status:', error);
    throw error;
  }
};

/**
 * Fetch assignments in a date range (for calendar view)
 * @param {string} studentId - The UUID of the student
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Promise<Array>} Array of assignments in date range
 */
export const getAssignmentsByDateRange = async (studentId, startDate, endDate) => {
  try {
    // First get assignment IDs in the date range
    const { data: assignmentIds, error: assignmentError } = await supabase
      .from('assignments')
      .select('assignment_id')
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .eq('is_deleted', false);
    
    if (assignmentError) throw assignmentError;
    
    if (!assignmentIds || assignmentIds.length === 0) {
      return [];
    }
    
    const ids = assignmentIds.map(a => a.assignment_id);
    
    // Then get student assignments for those IDs
    const { data, error } = await supabase
      .from('student_assignments')
      .select(`
        *,
        assignments (
          assignment_id,
          title,
          description,
          course_name,
          course_code,
          total_points,
          assignment_type,
          due_date
        )
      `)
      .eq('student_id', studentId)
      .in('assignment_id', ids)
      .eq('is_deleted', false)
      .order('assignments(due_date)', { ascending: true });

    if (error) throw error;
    
    const flattenedData = data?.map(item => ({
      ...item.assignments,
      student_assignment_id: item.student_assignment_id,
      status: item.status,
      priority: item.priority,
      grade_received: item.grade_received,
      submission_date: item.submission_date
    })) || [];
    
    return flattenedData;
  } catch (error) {
    console.error('Error fetching assignments by date range:', error);
    throw error;
  }
};

/**
 * Get assignment statistics for a student
 * @param {string} studentId - The UUID of the student
 * @returns {Promise<Object>} Statistics object
 */
export const getAssignmentStats = async (studentId) => {
  try {
    // STEP 1: Convert students.id → students.user_id
    const { data: studentRow, error: mapError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    if (mapError) throw mapError;

    const uid = studentRow?.user_id;
    if (!uid) throw new Error('Student user_id not found');

    // STEP 2: Fetch stats using correct student_id
    const { data, error } = await supabase
      .from('student_assignments')
      .select('status, grade_percentage')
      .eq('student_id', uid)
      .eq('is_deleted', false);

    if (error) throw error;

    const stats = {
      total: data.length,
      todo: data.filter(a => a.status === 'todo').length,
      inProgress: data.filter(a => a.status === 'in-progress').length,
      submitted: data.filter(a => a.status === 'submitted').length,
      graded: data.filter(a => a.status === 'graded').length,
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
    console.error('Error fetching assignment stats:', error);
    throw error;
  }
};


/**
 * Update assignment status
 * @param {string} studentAssignmentId - The UUID of the student_assignment record
 * @param {string} newStatus - New status (todo, in-progress, submitted, graded)
 * @returns {Promise<Object>} Updated student assignment
 */
export const updateAssignmentStatus = async (studentAssignmentId, newStatus) => {
  try {
    const updateData = {
      status: newStatus,
      updated_date: new Date().toISOString()
    };

    // If submitting, add submission date if not present
    if (newStatus === 'submitted') {
      const { data: current } = await supabase
        .from('student_assignments')
        .select('submission_date')
        .eq('student_assignment_id', studentAssignmentId)
        .single();

      if (!current?.submission_date) {
        updateData.submission_date = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('student_assignments')
      .update(updateData)
      .eq('student_assignment_id', studentAssignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating assignment status:', error);
    throw error;
  }
};

/**
 * Get assignment with attachments and student-specific data
 * @param {string} studentId - The UUID of the student
 * @param {string} assignmentId - The UUID of the assignment
 * @returns {Promise<Object>} Assignment with attachments and student data
 */
export const getAssignmentWithAttachments = async (studentId, assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('student_assignments')
      .select(`
        *,
        assignments (
          *,
          assignment_attachments (*)
        )
      `)
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .single();

    if (error) throw error;
    
    // Flatten the response
    const flattened = {
      ...data.assignments,
      student_assignment_id: data.student_assignment_id,
      status: data.status,
      priority: data.priority,
      grade_received: data.grade_received,
      grade_percentage: data.grade_percentage,
      instructor_feedback: data.instructor_feedback,
      feedback_date: data.feedback_date,
      submission_date: data.submission_date,
      submission_type: data.submission_type,
      submission_content: data.submission_content,
      submission_url: data.submission_url,
      is_late: data.is_late,
      late_penalty: data.late_penalty,
      started_date: data.started_date,
      completed_date: data.completed_date
    };
    
    return flattened;
  } catch (error) {
    console.error('Error fetching assignment with attachments:', error);
    throw error;
  }
};

/**
 * Get single student assignment by ID
 * @param {string} studentId - The UUID of the student
 * @param {string} assignmentId - The UUID of the assignment
 * @returns {Promise<Object>} Student assignment with full assignment details
 */
export const getStudentAssignment = async (studentId, assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('student_assignments')
      .select(`
        *,
        assignments (*)
      `)
      .eq('student_id', studentId)
      .eq('assignment_id', assignmentId)
      .single();

    if (error) throw error;
    
    const flattened = {
      ...data.assignments,
      student_assignment_id: data.student_assignment_id,
      status: data.status,
      priority: data.priority,
      grade_received: data.grade_received,
      grade_percentage: data.grade_percentage,
      instructor_feedback: data.instructor_feedback,
      feedback_date: data.feedback_date,
      graded_by: data.graded_by,
      graded_date: data.graded_date,
      submission_date: data.submission_date,
      submission_type: data.submission_type,
      submission_content: data.submission_content,
      submission_url: data.submission_url,
      is_late: data.is_late,
      late_penalty: data.late_penalty,
      assigned_date: data.assigned_date,
      started_date: data.started_date,
      completed_date: data.completed_date
    };
    
    return flattened;
  } catch (error) {
    console.error('Error fetching student assignment:', error);
    throw error;
  }
};

/**
 * Soft delete a student assignment
 * @param {string} studentAssignmentId - The UUID of the student_assignment
 * @returns {Promise<boolean>} Success status
 */
export const deleteStudentAssignment = async (studentAssignmentId) => {
  try {
    const { error } = await supabase
      .from('student_assignments')
      .update({ is_deleted: true, updated_date: new Date().toISOString() })
      .eq('student_assignment_id', studentAssignmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting student assignment:', error);
    throw error;
  }
};

/**
 * Submit assignment (update submission details)
 * @param {string} studentAssignmentId - The UUID of the student_assignment
 * @param {Object} submissionData - Submission details
 * @returns {Promise<Object>} Updated student assignment
 */
export const submitAssignment = async (studentAssignmentId, submissionData) => {
  try {
    const updateData = {
      ...submissionData,
      status: 'submitted',
      submission_date: new Date().toISOString(),
      completed_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('student_assignments')
      .update(updateData)
      .eq('student_assignment_id', studentAssignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    throw error;
  }
};

/**
 * Update student assignment details (priority, notes, etc.)
 * @param {string} studentAssignmentId - The UUID of the student_assignment
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated student assignment
 */
export const updateStudentAssignment = async (studentAssignmentId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('student_assignments')
      .update({ ...updateData, updated_date: new Date().toISOString() })
      .eq('student_assignment_id', studentAssignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating student assignment:', error);
    throw error;
  }
};
