import { supabase } from '../../lib/supabaseClient';

/**
 * Educator Assignments Service
 * Handles all database operations for educators to create and manage assignments
 * Uses the assignments and assignment_attachments tables
 */

/**
 * Get class IDs assigned to an educator
 * @param {string} educatorId - The UUID of the educator
 * @returns {Promise<Array>} Array of class IDs
 */
export const getEducatorAssignedClassIds = async (educatorId) => {
  try {
    const { data, error } = await supabase
      .from('school_educator_class_assignments')
      .select('class_id')
      .eq('educator_id', educatorId);

    if (error) throw error;
    return (data || []).map(ac => ac.class_id);
  } catch (error) {
    console.error('Error fetching educator assigned classes:', error);
    throw error;
  }
};

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
          school_class_id: assignmentData.school_class_id || null,
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
 * Create multiple assignments for multiple classes
 * @param {Object} baseAssignmentData - Base assignment data
 * @param {Array<string>} classIds - Array of class UUIDs
 * @returns {Promise<Array>} Created assignments
 */
export const createAssignmentsForClasses = async (baseAssignmentData, classIds) => {
  try {
    const assignmentsToInsert = classIds.map(classId => ({
      title: baseAssignmentData.title,
      description: baseAssignmentData.description,
      instructions: baseAssignmentData.instructions,
      course_name: baseAssignmentData.course_name,
      course_code: baseAssignmentData.course_code,
      educator_id: baseAssignmentData.educator_id,
      educator_name: baseAssignmentData.educator_name,
      total_points: baseAssignmentData.total_points || 100,
      assignment_type: baseAssignmentData.assignment_type,
      skill_outcomes: baseAssignmentData.skill_outcomes,
      assign_classes: classId,
      school_class_id: classId,
      document_pdf: baseAssignmentData.document_pdf,
      due_date: baseAssignmentData.due_date,
      available_from: baseAssignmentData.available_from,
      allow_late_submission: baseAssignmentData.allow_late_submission ?? true
    }));

    const { data, error } = await supabase
      .from('assignments')
      .insert(assignmentsToInsert)
      .select();

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error creating assignments for classes:', error);
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
    // Fetch all assignments created by this educator
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_attachments (*),
        school_classes (id, name, grade, section)
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
    // Get already assigned students
    const { data: existingAssignments, error: checkError } = await supabase
      .from('student_assignments')
      .select('student_id')
      .eq('assignment_id', assignmentId)
      .in('student_id', studentIds);

    if (checkError) throw checkError;

    const existingStudentIds = existingAssignments?.map(a => a.student_id) || [];
    const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));

    if (newStudentIds.length === 0) {
      return [];
    }

    // STEP 1: Convert students.id → students.user_id
    const { data: userIdMappings, error: mapError } = await supabase
      .from('students')
      .select('id, user_id')
      .in('id', newStudentIds);

    if (mapError) throw mapError;

    const mappedStudentIds = userIdMappings.map(s => s.user_id);

    // STEP 2: Create assignment objects
    const studentAssignments = mappedStudentIds.map(uid => ({
      assignment_id: assignmentId,
      student_id: uid,                       // FIXED
      status: defaults.status || 'todo',
      priority: defaults.priority || 'medium'
    }));

    // STEP 3: Insert new rows
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

    // Flatten the response using actual column names
    const flattenedData = data?.map(item => {
      const student = item.students;

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

