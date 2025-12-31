import { supabase } from '../../lib/supabaseClient';
import storageApiService from '../storageApiService';

/**
 * Educator Assignments Service
 * Handles all database operations for educators to create and manage assignments
 * Uses the assignments and assignment_attachments tables with file upload support
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
 * Get all students assigned to a specific assignment with their submission status and files
 * @param {string} assignmentId - The UUID of the assignment
 * @returns {Promise<Array>} Array of students with their assignment status and submission files
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

    // Get all submission files for this assignment
    const submissionFiles = await getStudentSubmissionFiles(assignmentId);

    // Flatten the response using actual column names and add submission files
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

// =====================================================
// NEW FILE UPLOAD FUNCTIONS FOR ASSIGNMENT SYSTEM
// =====================================================

/**
 * Upload instruction file for assignment (Educator files)
 * @param {string} assignmentId - Assignment UUID
 * @param {File} file - File to upload
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Upload result with attachment record
 */
export const uploadInstructionFile = async (assignmentId, file, token) => {
  try {
    const timestamp = Date.now();
    const filename = `assignments/${assignmentId}/instructions/${timestamp}_${file.name}`;
    
    // Upload file to R2 storage
    const uploadResult = await storageApiService.uploadFile(file, { filename }, token);
    
    // Store the original R2 URL in database (not the proxy URL)
    // The frontend will convert to proxy URLs when displaying
    const originalR2Url = uploadResult.url;
    
    // Save to assignment_attachments table (educator file - no prefix)
    const { data, error } = await supabase
      .from('assignment_attachments')
      .insert({
        assignment_id: assignmentId,
        file_name: file.name, // ✅ EDUCATOR FILE (no prefix)
        file_type: file.type,
        file_size: file.size,
        file_url: originalR2Url // Store original R2 URL, not proxy URL
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return { 
      ...uploadResult, 
      attachment_id: data.attachment_id,
      file_name: data.file_name,
      file_type: data.file_type,
      file_size: data.file_size,
      accessible_url: originalR2Url
    };
  } catch (error) {
    console.error('Error uploading instruction file:', error);
    throw error;
  }
};

/**
 * Upload multiple instruction files for assignment
 * @param {string} assignmentId - Assignment UUID
 * @param {Array<File>} files - Array of files to upload
 * @param {string} token - Auth token
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleInstructionFiles = async (assignmentId, files, token) => {
  try {
    const uploadPromises = files.map(file => uploadInstructionFile(assignmentId, file, token));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple instruction files:', error);
    throw error;
  }
};

/**
 * Create assignment with staged files (files uploaded after assignment creation)
 * @param {Object} assignmentData - Assignment details
 * @param {Array<File>} instructionFiles - Array of instruction files to upload after creation
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Created assignment with file upload results
 */
export const createAssignmentWithStagedFiles = async (assignmentData, instructionFiles, token) => {
  try {
    // Create assignment first
    const assignment = await createAssignment(assignmentData);
    
    // Upload instruction files after assignment is created
    if (instructionFiles && instructionFiles.length > 0) {
      console.log('Uploading staged files for assignment:', assignment.assignment_id);
      const uploadResults = await uploadMultipleInstructionFiles(
        assignment.assignment_id, 
        instructionFiles, 
        token
      );
      
      // Add file info to assignment object
      assignment.instruction_files = uploadResults;
    }
    
    return assignment;
  } catch (error) {
    console.error('Error creating assignment with staged files:', error);
    throw error;
  }
};

/**
 * Create multiple assignments for multiple classes with staged files
 * @param {Object} baseAssignmentData - Base assignment data
 * @param {Array<string>} classIds - Array of class UUIDs
 * @param {Array<File>} instructionFiles - Array of instruction files to upload after creation
 * @param {string} token - Auth token
 * @returns {Promise<Array>} Created assignments with file upload results
 */
export const createAssignmentsForClassesWithStagedFiles = async (baseAssignmentData, classIds, instructionFiles, token) => {
  try {
    // Create assignments first
    const createdAssignments = await createAssignmentsForClasses(baseAssignmentData, classIds);
    
    // Upload instruction files to each assignment
    if (instructionFiles && instructionFiles.length > 0) {
      console.log('Uploading staged files for', createdAssignments.length, 'assignments');
      
      for (const assignment of createdAssignments) {
        const uploadResults = await uploadMultipleInstructionFiles(
          assignment.assignment_id, 
          instructionFiles, 
          token
        );
        
        // Add file info to assignment object
        assignment.instruction_files = uploadResults;
      }
    }
    
    return createdAssignments;
  } catch (error) {
    console.error('Error creating assignments with staged files:', error);
    throw error;
  }
};

/**
 * Get instruction files for assignment (Educator files only)
 * @param {string} assignmentId - Assignment UUID
 * @returns {Promise<Array>} List of instruction files with accessible URLs
 */
export const getInstructionFiles = async (assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('assignment_attachments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .not('file_name', 'like', 'STUDENT:%') // ✅ Only educator files (no STUDENT: prefix)
      .order('uploaded_date', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    // Return files as-is - URL conversion is handled in the frontend
    return data || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Get all student submission files for an assignment
 * @param {string} assignmentId - Assignment UUID
 * @returns {Promise<Array>} List of student submission files grouped by student
 */
export const getStudentSubmissionFiles = async (assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('assignment_attachments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .like('file_name', 'STUDENT:%') // ✅ Only student files (with STUDENT: prefix)
      .order('uploaded_date', { ascending: false });
      
    if (error) throw error;
    
    // Group files by student_assignment_id
    const groupedFiles = {};
    data?.forEach(file => {
      // Extract student_assignment_id from file_name: "STUDENT:sa-uuid-001:filename.pdf"
      const match = file.file_name.match(/^STUDENT:([^:]+):/);
      if (match) {
        const studentAssignmentId = match[1];
        if (!groupedFiles[studentAssignmentId]) {
          groupedFiles[studentAssignmentId] = [];
        }
        
        // Add original filename without prefix
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
 * Get specific student's submission files for an assignment
 * @param {string} assignmentId - Assignment UUID
 * @param {string} studentAssignmentId - Student assignment UUID
 * @returns {Promise<Array>} List of student's submission files
 */
export const getStudentSubmissionFilesByStudentId = async (assignmentId, studentAssignmentId) => {
  try {
    const { data, error } = await supabase
      .from('assignment_attachments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .like('file_name', `STUDENT:${studentAssignmentId}:%`) // ✅ Specific student's files
      .order('uploaded_date', { ascending: false });
      
    if (error) throw error;
    
    // Add original filename without prefix
    const filesWithOriginalNames = data?.map(file => ({
      ...file,
      original_filename: file.file_name.replace(/^STUDENT:[^:]+:/, '')
    })) || [];
    
    return filesWithOriginalNames;
  } catch (error) {
    console.error('Error fetching student submission files by student ID:', error);
    throw error;
  }
};

/**
 * Get educator's assignments with statistics and file counts
 * @param {string} educatorId - Educator UUID
 * @returns {Promise<Array>} Assignments with submission stats and file info
 */
export const getEducatorAssignmentsWithStats = async (educatorId) => {
  try {
    const assignments = await getAssignmentsByEducator(educatorId);
    
    // Get statistics for each assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const stats = await getAssignmentStatistics(assignment.assignment_id);
        
        // Count instruction files (educator files)
        const instructionFiles = assignment.assignment_attachments?.filter(
          att => !att.file_name.startsWith('STUDENT:')
        ) || [];
        
        // Count submission files (student files)
        const submissionFiles = assignment.assignment_attachments?.filter(
          att => att.file_name.startsWith('STUDENT:')
        ) || [];
        
        return {
          ...assignment,
          stats: {
            ...stats,
            submissionRate: stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0
          },
          file_counts: {
            instruction_files: instructionFiles.length,
            submission_files: submissionFiles.length
          }
        };
      })
    );
    
    return assignmentsWithStats;
  } catch (error) {
    console.error('Error fetching educator assignments with stats:', error);
    throw error;
  }
};

/**
 * Get assignment submissions with files for educator review
 * @param {string} assignmentId - Assignment UUID
 * @returns {Promise<Array>} List of submissions with student info and files
 */
export const getAssignmentSubmissionsWithFiles = async (assignmentId) => {
  try {
    // Get student assignments
    const studentAssignments = await getAssignmentStudents(assignmentId);
    
    // Get all submission files grouped by student
    const submissionFiles = await getStudentSubmissionFiles(assignmentId);
    
    // Combine student assignments with their files
    const submissionsWithFiles = studentAssignments.map(submission => ({
      ...submission,
      submission_files: submissionFiles[submission.student_assignment_id] || []
    }));
    
    return submissionsWithFiles;
  } catch (error) {
    console.error('Error fetching assignment submissions with files:', error);
    throw error;
  }
};

/**
 * Delete instruction file
 * @param {string} attachmentId - Attachment UUID
 * @param {string} token - Auth token
 * @returns {Promise<boolean>} Success status
 */
export const deleteInstructionFile = async (attachmentId, token) => {
  try {
    // Get file info first
    const { data: attachment, error: fetchError } = await supabase
      .from('assignment_attachments')
      .select('file_url, file_name')
      .eq('attachment_id', attachmentId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    // Delete from R2 storage using the original R2 URL
    if (attachment.file_url) {
      try {
        let originalUrl = attachment.file_url;
        
        // If it's a proxy URL, extract the original R2 URL
        if (attachment.file_url.includes('/document-access?url=')) {
          const urlParams = new URLSearchParams(attachment.file_url.split('?')[1]);
          const encodedUrl = urlParams.get('url');
          if (encodedUrl) {
            originalUrl = decodeURIComponent(encodedUrl);
          }
        }
        
        // Use the corrected storageApiService.deleteFile function with original R2 URL
        await storageApiService.deleteFile(originalUrl, token);
      } catch (storageError) {
        // Continue with database deletion even if storage deletion fails
      }
    }
    
    // Delete from database (always do this regardless of storage deletion)
    const { error, count } = await supabase
      .from('assignment_attachments')
      .delete()
      .eq('attachment_id', attachmentId);
      
    if (error) {
      throw error;
    }
    
    // Verify deletion by checking if record still exists
    const { data: verifyData, error: verifyError } = await supabase
      .from('assignment_attachments')
      .select('attachment_id')
      .eq('attachment_id', attachmentId);
      
    return true;
  } catch (error) {
    throw error;
  }
};

