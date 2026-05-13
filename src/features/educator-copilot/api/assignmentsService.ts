import { supabase } from '@/shared/api/supabaseClient';
import storageApiService from '@/shared/api/storageApiService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('assignments-service');

/**
 * Assignments Service
 * Handles all database operations for learner assignments
 * Uses the learner_assignments junction table to link learners with assignments
 * Enhanced with file upload support for learner submissions
 */

/**
 * Fetch all assignments for a specific learner
 * @param {string} learnerId - The UUID of the learner
 * @returns {Promise<Array>} Array of assignments with learner-specific data
 */
export const getAssignmentsByLearnerId = async (learnerId) => {
  try {
    // STEP 1: Convert learners.id → learners.user_id
    const { data: learnerRow, error: mapError } = await supabase
      .from('learners')
      .select('id, user_id')
      .eq('id', learnerId)
      .maybeSingle();

    if (mapError) throw mapError;

    const uid = learnerRow?.user_id;
    if (!uid) throw new Error('Learner user_id not found');

    // STEP 2: Fetch learner assignments using user_id
    const { data, error } = await supabase
      .from('learner_assignments')
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
      .eq('learner_id', uid)               // <-- FIXED
      .eq('is_deleted', false)
      .order('assignments(created_date)', { ascending: false }); // Show newest assignments first

    if (error) throw error;

    // STEP 3: Flatten the output
    const flattenedData = data?.map(item => ({
      ...item.assignments,
      learner_assignment_id: item.learner_assignment_id,
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
    logger.error('Fetch assignments failed', error instanceof Error ? error : new Error(String(error)), {
      learnerId
    });
    throw error;
  }
};

/**
 * Fetch assignments by status for a learner
 * @param {string} learnerId - The UUID of the learner
 * @param {string} status - The status filter (todo, in-progress, submitted, graded)
 * @returns {Promise<Array>} Array of filtered assignments
 */
export const getAssignmentsByStatus = async (learnerId, status) => {
  try {
    const { data, error } = await supabase
      .from('learner_assignments')
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
      .eq('learner_id', learnerId)
      .eq('status', status)
      .eq('is_deleted', false)
      .order('assignments(due_date)', { ascending: true });

    if (error) throw error;
    
    const flattenedData = data?.map(item => ({
      ...item.assignments,
      learner_assignment_id: item.learner_assignment_id,
      status: item.status,
      priority: item.priority,
      grade_received: item.grade_received,
      grade_percentage: item.grade_percentage,
      submission_date: item.submission_date,
      is_late: item.is_late
    })) || [];
    
    return flattenedData;
  } catch (error) {
    logger.error('Fetch assignments by status failed', error instanceof Error ? error : new Error(String(error)), {
      learnerId,
      status
    });
    throw error;
  }
};

/**
 * Fetch assignments in a date range (for calendar view)
 * @param {string} learnerId - The UUID of the learner
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Promise<Array>} Array of assignments in date range
 */
export const getAssignmentsByDateRange = async (learnerId, startDate, endDate) => {
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
    
    // Then get learner assignments for those IDs
    const { data, error } = await supabase
      .from('learner_assignments')
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
      .eq('learner_id', learnerId)
      .in('assignment_id', ids)
      .eq('is_deleted', false)
      .order('assignments(due_date)', { ascending: true });

    if (error) throw error;
    
    const flattenedData = data?.map(item => ({
      ...item.assignments,
      learner_assignment_id: item.learner_assignment_id,
      status: item.status,
      priority: item.priority,
      grade_received: item.grade_received,
      submission_date: item.submission_date
    })) || [];
    
    return flattenedData;
  } catch (error) {
    logger.error('Fetch assignments by date range failed', error instanceof Error ? error : new Error(String(error)), {
      learnerId,
      startDate,
      endDate
    });
    throw error;
  }
};

/**
 * Get assignment statistics for a learner
 * @param {string} learnerId - The UUID of the learner
 * @returns {Promise<Object>} Statistics object
 */
export const getAssignmentStats = async (learnerId) => {
  try {
    // STEP 1: Convert learners.id → learners.user_id
    const { data: learnerRow, error: mapError } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', learnerId)
      .maybeSingle();

    if (mapError) throw mapError;

    const uid = learnerRow?.user_id;
    if (!uid) throw new Error('Learner user_id not found');

    // STEP 2: Fetch stats using correct learner_id
    const { data, error } = await supabase
      .from('learner_assignments')
      .select('status, grade_percentage')
      .eq('learner_id', uid)
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
    logger.error('Fetch assignment stats failed', error instanceof Error ? error : new Error(String(error)), {
      learnerId
    });
    throw error;
  }
};


/**
 * Update assignment status
 * @param {string} learnerAssignmentId - The UUID of the learner_assignment record
 * @param {string} newStatus - New status (todo, in-progress, submitted, graded)
 * @returns {Promise<Object>} Updated learner assignment
 */
export const updateAssignmentStatus = async (learnerAssignmentId, newStatus) => {
  try {
    const updateData = {
      status: newStatus,
      updated_date: new Date().toISOString()
    };

    // If submitting, add submission date if not present
    if (newStatus === 'submitted') {
      const { data: current } = await supabase
        .from('learner_assignments')
        .select('submission_date')
        .eq('learner_assignment_id', learnerAssignmentId)
        .single();

      if (!current?.submission_date) {
        updateData.submission_date = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('learner_assignments')
      .update(updateData)
      .eq('learner_assignment_id', learnerAssignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Update assignment status failed', error instanceof Error ? error : new Error(String(error)), {
      learnerAssignmentId,
      newStatus
    });
    throw error;
  }
};

/**
 * Get assignment with attachments and learner-specific data
 * @param {string} learnerId - The UUID of the learner
 * @param {string} assignmentId - The UUID of the assignment
 * @returns {Promise<Object>} Assignment with attachments and learner data
 */
export const getAssignmentWithAttachments = async (learnerId, assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('learner_assignments')
      .select(`
        *,
        assignments (
          *,
          assignment_attachments (*)
        )
      `)
      .eq('learner_id', learnerId)
      .eq('assignment_id', assignmentId)
      .single();

    if (error) throw error;
    
    // Flatten the response
    const flattened = {
      ...data.assignments,
      learner_assignment_id: data.learner_assignment_id,
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
    logger.error('Fetch assignment with attachments failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Get single learner assignment by ID
 * @param {string} learnerId - The UUID of the learner
 * @param {string} assignmentId - The UUID of the assignment
 * @returns {Promise<Object>} Learner assignment with full assignment details
 */
export const getlearnerAssignment = async (learnerId, assignmentId) => {
  try {
    const { data, error } = await supabase
      .from('learner_assignments')
      .select(`
        *,
        assignments (*)
      `)
      .eq('learner_id', learnerId)
      .eq('assignment_id', assignmentId)
      .single();

    if (error) throw error;
    
    const flattened = {
      ...data.assignments,
      learner_assignment_id: data.learner_assignment_id,
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
    logger.error('Fetch learner assignment failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Soft delete a learner assignment
 * @param {string} learnerAssignmentId - The UUID of the learner_assignment
 * @returns {Promise<boolean>} Success status
 */
export const deletelearnerAssignment = async (learnerAssignmentId) => {
  try {
    const { error } = await supabase
      .from('learner_assignments')
      .update({ is_deleted: true, updated_date: new Date().toISOString() })
      .eq('learner_assignment_id', learnerAssignmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Delete learner assignment failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Submit assignment with file upload
 * @param {string} learnerAssignmentId - The UUID of the learner_assignment
 * @param {Object} submissionData - Submission details including file info
 * @returns {Promise<Object>} Updated learner assignment
 */
export const submitAssignmentWithFile = async (learnerAssignmentId, submissionData) => {
  try {
    const updateData = {
      ...submissionData,
      status: 'submitted',
      submission_date: new Date().toISOString(),
      completed_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('learner_assignments')
      .update(updateData)
      .eq('learner_assignment_id', learnerAssignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Submit assignment with file failed', error instanceof Error ? error : new Error(String(error)), {
      learnerAssignmentId
    });
    throw error;
  }
};

/**
 * Submit assignment (update submission details)
 * @param {string} learnerAssignmentId - The UUID of the learner_assignment
 * @param {Object} submissionData - Submission details
 * @returns {Promise<Object>} Updated learner assignment
 */
export const submitAssignment = async (learnerAssignmentId, submissionData) => {
  try {
    const updateData = {
      ...submissionData,
      status: 'submitted',
      submission_date: new Date().toISOString(),
      completed_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('learner_assignments')
      .update(updateData)
      .eq('learner_assignment_id', learnerAssignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Submit assignment failed', error instanceof Error ? error : new Error(String(error)), {
      learnerAssignmentId
    });
    throw error;
  }
};

/**
 * Update learner assignment details (priority, notes, etc.)
 * @param {string} learnerAssignmentId - The UUID of the learner_assignment
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated learner assignment
 */
export const updatelearnerAssignment = async (learnerAssignmentId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('learner_assignments')
      .update({ ...updateData, updated_date: new Date().toISOString() })
      .eq('learner_assignment_id', learnerAssignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Update learner assignment failed', error instanceof Error ? error : new Error(String(error)), {
      learnerAssignmentId
    });
    throw error;
  }
};

// =====================================================
// NEW FILE SUBMISSION FUNCTIONS FOR LEARNERS
// =====================================================

/**
 * Submit assignment with staged files (files uploaded only when submitting)
 * @param {string} learnerAssignmentId - Learner assignment UUID
 * @param {Array<File>} files - Array of files to upload
 * @param {string} learnerId - Learner UUID (from learners table)
 * @param {string} assignmentId - Assignment UUID
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Submission result
 */
export const submitAssignmentWithStagedFiles = async (learnerAssignmentId, files, learnerId, assignmentId, token) => {
  try {
    if (files.length === 0) {
      // No files to upload, just update status
      const { data, error } = await supabase
        .from('learner_assignments')
        .update({
          status: 'submitted',
          submission_type: 'text',
          submission_date: new Date().toISOString(),
          completed_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        })
        .eq('learner_assignment_id', learnerAssignmentId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    // Upload files to R2 storage
    const uploadPromises = files.map(async (file) => {
      const timestamp = Date.now();
      const filename = `assignments/${assignmentId}/submissions/${learnerAssignmentId}/${timestamp}_${file.name}`;
      return await storageApiService.uploadFile(file, { filename }, token);
    });
    
    const uploadResults = await Promise.all(uploadPromises);
    
    // Save files to assignment_attachments with LEARNER: prefix
    const attachmentPromises = files.map(async (file, index) => {
      const uploadResult = uploadResults[index];
      
      return await supabase
        .from('assignment_attachments')
        .insert({
          assignment_id: assignmentId,
          file_name: `LEARNER:${learnerAssignmentId}:${file.name}`, // ✅ LEARNER FILE (with prefix)
          file_type: file.type,
          file_size: file.size,
          file_url: uploadResult.url // Store original R2 URL
        })
        .select()
        .single();
    });
    
    await Promise.all(attachmentPromises);
    
    // Update learner assignment status
    const fileNames = files.map(file => file.name).join(',');
    const { data, error } = await supabase
      .from('learner_assignments')
      .update({
        status: 'submitted',
        submission_type: 'file', // ✅ Fixed: use 'file' not 'files'
        submission_content: fileNames, // Store file names for reference
        submission_url: uploadResults[0]?.url || null, // Store first file URL for backward compatibility
        submission_date: new Date().toISOString(),
        completed_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      })
      .eq('learner_assignment_id', learnerAssignmentId)
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get learner's own submission files
 * @param {string} assignmentId - Assignment UUID
 * @param {string} learnerAssignmentId - Learner assignment UUID
 * @returns {Promise<Array>} List of learner's submission files
 */
export const getlearnerSubmissionFiles = async (assignmentId, learnerAssignmentId) => {
  try {
    const { data, error } = await supabase
      .from('assignment_attachments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .like('file_name', `LEARNER:${learnerAssignmentId}:%`) // ✅ Only this learner's files
      .order('uploaded_date', { ascending: false });
      
    if (error) throw error;
    
    // Add original filename without prefix
    const filesWithOriginalNames = data?.map(file => ({
      ...file,
      original_filename: file.file_name.replace(/^LEARNER:[^:]+:/, '')
    })) || [];
    
    return filesWithOriginalNames;
  } catch (error) {
    logger.error('Fetch learner submission files failed', error instanceof Error ? error : new Error(String(error)), {
      assignmentId,
      learnerAssignmentId
    });
    throw error;
  }
};

/**
 * Get assignment with instruction files and learner's submission files
 * @param {string} learnerId - Learner UUID (from learners table)
 * @param {string} assignmentId - Assignment UUID
 * @returns {Promise<Object>} Assignment with instruction files and learner's submission files
 */
export const getAssignmentWithFiles = async (learnerId, assignmentId) => {
  try {
    // Get basic assignment data
    const assignment = await getAssignmentWithAttachments(learnerId, assignmentId);
    
    // Get instruction files (educator files - no prefix)
    const { data: instructionFiles, error: instructionError } = await supabase
      .from('assignment_attachments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .not('file_name', 'like', 'LEARNER:%') // ✅ Only educator files
      .order('uploaded_date', { ascending: false });
      
    if (instructionError) throw instructionError;
    
    // Get learner's submission files
    const submissionFiles = await getlearnerSubmissionFiles(assignmentId, assignment.learner_assignment_id);
    
    return {
      ...assignment,
      instruction_files: instructionFiles || [],
      submission_files: submissionFiles
    };
  } catch (error) {
    logger.error('Fetch assignment with files failed', error instanceof Error ? error : new Error(String(error)), {
      learnerId,
      assignmentId
    });
    throw error;
  }
};

/**
 * Delete learner's submission file
 * @param {string} attachmentId - Attachment UUID
 * @param {string} learnerAssignmentId - Learner assignment UUID (for verification)
 * @param {string} token - Auth token
 * @returns {Promise<boolean>} Success status
 */
export const deletelearnerSubmissionFile = async (attachmentId, learnerAssignmentId, token) => {
  try {
    // Get file info and verify it belongs to this learner
    const { data: attachment, error: fetchError } = await supabase
      .from('assignment_attachments')
      .select('file_url, file_name')
      .eq('attachment_id', attachmentId)
      .like('file_name', `LEARNER:${learnerAssignmentId}:%`) // ✅ Verify ownership
      .single();
      
    if (fetchError) throw fetchError;
    
    // Extract file key from URL for R2 deletion
    const fileKey = attachment.file_url.split('/').pop();
    
    // Delete from R2 storage
    try {
      await storageApiService.deleteFile(fileKey, token);
    } catch (storageError) {
      logger.warn('Failed to delete submission file from storage', {
        attachmentId,
        error: storageError instanceof Error ? storageError.message : String(storageError)
      });
      // Continue with database deletion even if storage deletion fails
    }
    
    // Delete from database
    const { error } = await supabase
      .from('assignment_attachments')
      .delete()
      .eq('attachment_id', attachmentId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Delete learner submission file failed', error instanceof Error ? error : new Error(String(error)), {
      attachmentId,
      learnerAssignmentId
    });
    throw error;
  }
};

// =====================================================
// EDUCATOR FILE UPLOAD FUNCTIONS
// =====================================================

/**
 * Upload instruction file for an assignment (educator)
 * @param {string} assignmentId - Assignment UUID
 * @param {File} file - File to upload
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Upload result with attachment record
 */
export const uploadInstructionFile = async (assignmentId, file, token) => {
  try {
    const timestamp = Date.now();
    const filename = `assignments/${assignmentId}/instructions/${timestamp}_${file.name}`;
    
    // Upload to R2 storage
    const uploadResult = await storageApiService.uploadFile(file, { filename }, token);
    
    // Save to assignment_attachments (no prefix = educator file)
    const { data, error } = await supabase
      .from('assignment_attachments')
      .insert({
        assignment_id: assignmentId,
        file_name: file.name, // ✅ EDUCATOR FILE (no prefix)
        file_type: file.type,
        file_size: file.size,
        file_url: uploadResult.url
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      ...data,
      url: uploadResult.url
    };
  } catch (error) {
    logger.error('Upload instruction file failed', error instanceof Error ? error : new Error(String(error)), {
      assignmentId
    });
    throw error;
  }
};

/**
 * Delete instruction file (educator)
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
      .not('file_name', 'like', 'LEARNER:%') // ✅ Only educator files
      .single();
      
    if (fetchError) throw fetchError;
    
    // Extract file key from URL for R2 deletion
    const fileKey = attachment.file_url.split('/').pop();
    
    // Delete from R2 storage
    try {
      await storageApiService.deleteFile(fileKey, token);
    } catch (storageError) {
      logger.warn('Failed to delete instruction file from storage', {
        attachmentId,
        error: storageError instanceof Error ? storageError.message : String(storageError)
      });
    }
    
    // Delete from database
    const { error } = await supabase
      .from('assignment_attachments')
      .delete()
      .eq('attachment_id', attachmentId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Delete instruction file failed', error instanceof Error ? error : new Error(String(error)), {
      attachmentId
    });
    throw error;
  }
};
