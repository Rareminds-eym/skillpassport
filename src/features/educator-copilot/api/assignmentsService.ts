import { apiPost } from '@/shared/api/apiClient';
import storageApiService from '@/shared/api/storageApiService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('assignments-service');

export const getAssignmentsByLearnerId = async (learnerId) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getAssignmentsByLearnerId',
      learnerId,
    });
    return result?.data || [];
  } catch (error) {
    logger.error('Fetch assignments failed', error instanceof Error ? error : new Error(String(error)), { learnerId });
    throw error;
  }
};

export const getAssignmentsByStatus = async (learnerId, status) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getAssignmentsByStatus',
      learnerId,
      status,
    });
    return result?.data || [];
  } catch (error) {
    logger.error('Fetch assignments by status failed', error instanceof Error ? error : new Error(String(error)), { learnerId, status });
    throw error;
  }
};

export const getAssignmentsByDateRange = async (learnerId, startDate, endDate) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getAssignmentsByDateRange',
      learnerId,
      startDate,
      endDate,
    });
    return result?.data || [];
  } catch (error) {
    logger.error('Fetch assignments by date range failed', error instanceof Error ? error : new Error(String(error)), { learnerId, startDate, endDate });
    throw error;
  }
};

export const getAssignmentStats = async (learnerId) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getAssignmentStats',
      learnerId,
    });
    return result?.data;
  } catch (error) {
    logger.error('Fetch assignment stats failed', error instanceof Error ? error : new Error(String(error)), { learnerId });
    throw error;
  }
};

export const updateAssignmentStatus = async (learnerAssignmentId, newStatus) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'updateAssignmentStatus',
      learnerAssignmentId,
      newStatus,
    });
    return result?.data;
  } catch (error) {
    logger.error('Update assignment status failed', error instanceof Error ? error : new Error(String(error)), { learnerAssignmentId, newStatus });
    throw error;
  }
};

export const getAssignmentWithAttachments = async (learnerId, assignmentId) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getAssignmentWithAttachments',
      learnerId,
      assignmentId,
    });
    return result?.data;
  } catch (error) {
    logger.error('Fetch assignment with attachments failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

export const getlearnerAssignment = async (learnerId, assignmentId) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getLearnerAssignment',
      learnerId,
      assignmentId,
    });
    return result?.data;
  } catch (error) {
    logger.error('Fetch learner assignment failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

export const deletelearnerAssignment = async (learnerAssignmentId) => {
  try {
    await apiPost('/educator-copilot/actions', {
      action: 'deleteLearnerAssignment',
      learnerAssignmentId,
    });
    return true;
  } catch (error) {
    logger.error('Delete learner assignment failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

export const submitAssignmentWithFile = async (learnerAssignmentId, submissionData) => {
  try {
    const updateData = { ...submissionData, status: 'submitted', submission_date: new Date().toISOString(), completed_date: new Date().toISOString(), updated_date: new Date().toISOString() };
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'submitAssignment',
      learnerAssignmentId,
      submissionData: updateData,
    });
    return result?.data;
  } catch (error) {
    logger.error('Submit assignment with file failed', error instanceof Error ? error : new Error(String(error)), { learnerAssignmentId });
    throw error;
  }
};

export const submitAssignment = async (learnerAssignmentId, submissionData) => {
  try {
    const updateData = { ...submissionData, status: 'submitted', submission_date: new Date().toISOString(), completed_date: new Date().toISOString(), updated_date: new Date().toISOString() };
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'submitAssignment',
      learnerAssignmentId,
      submissionData: updateData,
    });
    return result?.data;
  } catch (error) {
    logger.error('Submit assignment failed', error instanceof Error ? error : new Error(String(error)), { learnerAssignmentId });
    throw error;
  }
};

export const updatelearnerAssignment = async (learnerAssignmentId, updateData) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'updateLearnerAssignment',
      learnerAssignmentId,
      updateData,
    });
    return result?.data;
  } catch (error) {
    logger.error('Update learner assignment failed', error instanceof Error ? error : new Error(String(error)), { learnerAssignmentId });
    throw error;
  }
};

export const submitAssignmentWithStagedFiles = async (learnerAssignmentId, files, learnerId, assignmentId, token) => {
  try {
    if (files.length === 0) {
      const result: any = await apiPost('/educator-copilot/actions', {
        action: 'submitAssignmentWithStagedFiles',
        learnerAssignmentId,
        files: [],
        assignmentId,
      });
      return result?.data;
    }

    const uploadPromises = files.map(async (file) => {
      const timestamp = Date.now();
      const filename = `assignments/${assignmentId}/submissions/${learnerAssignmentId}/${timestamp}_${file.name}`;
      return await storageApiService.uploadFile(file, { filename }, token);
    });

    const uploadResults = await Promise.all(uploadPromises);

    const stagedFiles = files.map((file, index) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      url: uploadResults[index]?.url || '',
    }));

    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'submitAssignmentWithStagedFiles',
      learnerAssignmentId,
      files: stagedFiles,
      assignmentId,
    });

    return result?.data;
  } catch (error) {
    throw error;
  }
};

export const getlearnerSubmissionFiles = async (assignmentId, learnerAssignmentId) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getLearnerSubmissionFiles',
      assignmentId,
      learnerAssignmentId,
    });
    return result?.data || [];
  } catch (error) {
    logger.error('Fetch learner submission files failed', error instanceof Error ? error : new Error(String(error)), { assignmentId, learnerAssignmentId });
    throw error;
  }
};

export const getAssignmentWithFiles = async (learnerId, assignmentId) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getAssignmentWithFiles',
      learnerId,
      assignmentId,
    });
    return result?.data;
  } catch (error) {
    logger.error('Fetch assignment with files failed', error instanceof Error ? error : new Error(String(error)), { learnerId, assignmentId });
    throw error;
  }
};

export const deletelearnerSubmissionFile = async (attachmentId, learnerAssignmentId, token) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'deleteLearnerSubmissionFile',
      attachmentId,
      learnerAssignmentId,
    });

    if (result?.data?.file_url) {
      const fileKey = result.data.file_url.split('/').pop();
      try {
        await storageApiService.deleteFile(fileKey, token);
      } catch (storageError) {
        logger.warn('Failed to delete submission file from storage', { attachmentId, error: storageError instanceof Error ? storageError.message : String(storageError) });
      }
    }

    return true;
  } catch (error) {
    logger.error('Delete learner submission file failed', error instanceof Error ? error : new Error(String(error)), { attachmentId, learnerAssignmentId });
    throw error;
  }
};

export const uploadInstructionFile = async (assignmentId, file, token) => {
  try {
    const timestamp = Date.now();
    const filename = `assignments/${assignmentId}/instructions/${timestamp}_${file.name}`;

    const uploadResult = await storageApiService.uploadFile(file, { filename }, token);

    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'uploadInstructionFile',
      assignmentId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl: uploadResult.url,
    });

    return { ...result?.data, url: uploadResult.url };
  } catch (error) {
    logger.error('Upload instruction file failed', error instanceof Error ? error : new Error(String(error)), { assignmentId });
    throw error;
  }
};

export const deleteInstructionFile = async (attachmentId, token) => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'deleteInstructionFile',
      attachmentId,
    });

    if (result?.data?.file_url) {
      const fileKey = result.data.file_url.split('/').pop();
      try {
        await storageApiService.deleteFile(fileKey, token);
      } catch (storageError) {
        logger.warn('Failed to delete instruction file from storage', { attachmentId, error: storageError instanceof Error ? storageError.message : String(storageError) });
      }
    }

    return true;
  } catch (error) {
    logger.error('Delete instruction file failed', error instanceof Error ? error : new Error(String(error)), { attachmentId });
    throw error;
  }
};
