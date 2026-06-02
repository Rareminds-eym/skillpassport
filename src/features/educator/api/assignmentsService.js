import { apiPost } from '@/shared/api/apiClient';
import storageApiService from '@/shared/api/storageApiService';

export const getEducatorAssignedClassIds = async (educatorId) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-educator-assigned-class-ids', educatorId });
    return res?.data || [];
  } catch (error) {
    console.error('Error fetching educator assigned classes:', error);
    throw error;
  }
};

export const createAssignment = async (assignmentData) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'create-assignment', assignmentData });
    if (!res?.data) throw new Error('Failed to create assignment');
    return res.data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

export const createAssignmentsForClasses = async (baseAssignmentData, classIds) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'create-assignments-for-classes', baseData: baseAssignmentData, classIds });
    return res?.data || [];
  } catch (error) {
    console.error('Error creating assignments for classes:', error);
    throw error;
  }
};

export const getAssignmentsByEducator = async (educatorId) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-assignments-by-educator', educatorId });
    return res?.data || [];
  } catch (error) {
    console.error('Error fetching educator assignments:', error);
    throw error;
  }
};

export const getAssignmentById = async (assignmentId) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-assignment-by-id', assignmentId });
    if (!res?.data) throw new Error('Assignment not found');
    return res.data;
  } catch (error) {
    console.error('Error fetching assignment:', error);
    throw error;
  }
};

export const updateAssignment = async (assignmentId, updates) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'update-assignment', assignmentId, updates });
    if (!res?.data) throw new Error('Failed to update assignment');
    return res.data;
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }
};

export const deleteAssignment = async (assignmentId) => {
  try {
    await apiPost('/educator/actions', { action: 'delete-assignment', assignmentId });
    return true;
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw error;
  }
};

export const addAssignmentAttachment = async (assignmentId, attachmentData) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'add-assignment-attachment', assignmentId, attachmentData });
    if (!res?.data) throw new Error('Failed to add attachment');
    return res.data;
  } catch (error) {
    console.error('Error adding attachment:', error);
    throw error;
  }
};

export const removeAssignmentAttachment = async (attachmentId) => {
  try {
    await apiPost('/educator/actions', { action: 'remove-assignment-attachment', attachmentId });
    return true;
  } catch (error) {
    console.error('Error removing attachment:', error);
    throw error;
  }
};

export const assignTolearners = async (assignmentId, learnerIds, defaults = {}) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'assign-to-learners', assignmentId, learnerIds });
    return res?.data || [];
  } catch (error) {
    console.error('Error assigning to learners:', error);
    throw error;
  }
};

export const getAssignmentLearners = async (assignmentId) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-assignment-learners', assignmentId });
    const data = res?.data || [];

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
    console.error('Error fetching assignment learners:', error);
    throw error;
  }
};

export const gradeAssignment = async (learnerAssignmentId, gradingData) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'grade-assignment', learnerAssignmentId, gradingData });
    if (!res?.data) throw new Error('Failed to grade assignment');
    return res.data;
  } catch (error) {
    console.error('Error grading assignment:', error);
    throw error;
  }
};

export const getAssignmentStatistics = async (assignmentId) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-assignment-statistics', assignmentId });
    return res?.data || { total: 0, todo: 0, inProgress: 0, submitted: 0, graded: 0, lateSubmissions: 0, averageGrade: 0 };
  } catch (error) {
    console.error('Error fetching assignment statistics:', error);
    throw error;
  }
};

export const uploadInstructionFile = async (assignmentId, file, token) => {
  try {
    const timestamp = Date.now();
    const filename = `assignments/${assignmentId}/instructions/${timestamp}_${file.name}`;

    const uploadResult = await storageApiService.uploadFile(file, { filename }, token);
    const originalR2Url = uploadResult.url;

    const res = await apiPost('/educator/actions', {
      action: 'add-assignment-attachment',
      assignmentId,
      attachmentData: {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: originalR2Url
      }
    });

    if (!res?.data) throw new Error('Failed to save attachment record');

    return {
      ...uploadResult,
      attachment_id: res.data.attachment_id,
      file_name: res.data.file_name,
      file_type: res.data.file_type,
      file_size: res.data.file_size,
      accessible_url: originalR2Url
    };
  } catch (error) {
    console.error('Error uploading instruction file:', error);
    throw error;
  }
};

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

export const createAssignmentWithStagedFiles = async (assignmentData, instructionFiles, token) => {
  try {
    const assignment = await createAssignment(assignmentData);

    if (instructionFiles && instructionFiles.length > 0) {
      console.log('Uploading staged files for assignment:', assignment.assignment_id);
      const uploadResults = await uploadMultipleInstructionFiles(
        assignment.assignment_id,
        instructionFiles,
        token
      );
      assignment.instruction_files = uploadResults;
    }

    return assignment;
  } catch (error) {
    console.error('Error creating assignment with staged files:', error);
    throw error;
  }
};

export const createAssignmentsForClassesWithStagedFiles = async (baseAssignmentData, classIds, instructionFiles, token) => {
  try {
    const createdAssignments = await createAssignmentsForClasses(baseAssignmentData, classIds);

    if (instructionFiles && instructionFiles.length > 0) {
      console.log('Uploading staged files for', createdAssignments.length, 'assignments');

      for (const assignment of createdAssignments) {
        const uploadResults = await uploadMultipleInstructionFiles(
          assignment.assignment_id,
          instructionFiles,
          token
        );
        assignment.instruction_files = uploadResults;
      }
    }

    return createdAssignments;
  } catch (error) {
    console.error('Error creating assignments with staged files:', error);
    throw error;
  }
};

export const getInstructionFiles = async (assignmentId) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-assignment-attachments', assignmentId });
    return res?.data || [];
  } catch (error) {
    console.error('Error fetching instruction files:', error);
    throw error;
  }
};

export const getlearnerSubmissionFiles = async (assignmentId) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-assignment-attachments', assignmentId, fileNamePattern: 'LEARNER:%' });
    const data = res?.data || [];

    const groupedFiles = {};
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
    console.error('Error fetching learner submission files:', error);
    throw error;
  }
};

export const getlearnerSubmissionFilesByLearnerId = async (assignmentId, learnerAssignmentId) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-assignment-attachments', assignmentId, fileNamePattern: `LEARNER:${learnerAssignmentId}:%` });
    const data = res?.data || [];

    return data?.map(file => ({
      ...file,
      original_filename: file.file_name.replace(/^LEARNER:[^:]+:/, '')
    })) || [];
  } catch (error) {
    console.error('Error fetching learner submission files by learner ID:', error);
    throw error;
  }
};

export const getEducatorAssignmentsWithStats = async (educatorId) => {
  try {
    const assignments = await getAssignmentsByEducator(educatorId);

    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const stats = await getAssignmentStatistics(assignment.assignment_id);

        const instructionFiles = assignment.assignment_attachments?.filter(
          att => !att.file_name.startsWith('LEARNER:')
        ) || [];

        const submissionFiles = assignment.assignment_attachments?.filter(
          att => att.file_name.startsWith('LEARNER:')
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

export const getAssignmentSubmissionsWithFiles = async (assignmentId) => {
  try {
    const learnerAssignments = await getAssignmentLearners(assignmentId);
    const submissionFiles = await getlearnerSubmissionFiles(assignmentId);

    const submissionsWithFiles = learnerAssignments.map(submission => ({
      ...submission,
      submission_files: submissionFiles[submission.learner_assignment_id] || []
    }));

    return submissionsWithFiles;
  } catch (error) {
    console.error('Error fetching assignment submissions with files:', error);
    throw error;
  }
};

export const deleteInstructionFile = async (attachmentId, token) => {
  try {
    const res = await apiPost('/educator/actions', { action: 'get-attachment-by-id', attachmentId });
    const attachment = res?.data;

    if (attachment?.file_url) {
      try {
        let originalUrl = attachment.file_url;

        if (attachment.file_url.includes('/document-access?url=')) {
          const urlParams = new URLSearchParams(attachment.file_url.split('?')[1]);
          const encodedUrl = urlParams.get('url');
          if (encodedUrl) {
            originalUrl = decodeURIComponent(encodedUrl);
          }
        }

        await storageApiService.deleteFile(originalUrl, token);
      } catch (storageError) {
        // Continue with database deletion even if storage deletion fails
      }
    }

    await apiPost('/educator/actions', { action: 'remove-assignment-attachment', attachmentId });
    return true;
  } catch (error) {
    console.error('Error deleting instruction file:', error);
    throw error;
  }
};
