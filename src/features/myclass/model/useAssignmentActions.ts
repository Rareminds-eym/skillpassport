import { useState, useCallback } from 'react';
import { updateAssignmentStatus, submitAssignmentWithStagedFiles, getAssignmentWithFiles } from '@/features/educator-copilot';
import { Assignment } from '@/features/myclass';
import { isOverdue } from '@/features/myclass';
import { getAuthSession, validateStorageConfig } from '@/features/myclass';
import { getUploadErrorMessage } from '@/features/myclass';

interface UseAssignmentActionsProps {
  studentId: string | undefined;
  onAssignmentsUpdate: (updater: (prev: Assignment[]) => Assignment[]) => void;
  onStatsRefresh: () => Promise<void>;
  onNotification: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const useAssignmentActions = ({
  studentId,
  onAssignmentsUpdate,
  onStatsRefresh,
  onNotification
}: UseAssignmentActionsProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const canSubmitAssignment = (assignment: Assignment) => {
    if (assignment.status === 'submitted' || assignment.status === 'graded') {
      return false;
    }
    if (!isOverdue(assignment.due_date)) {
      return true;
    }
    return assignment.allow_late_submission === true;
  };

  const handleStatusChange = useCallback(async (
    assignmentId: string,
    studentAssignmentId: string,
    newStatus: string,
    assignment: Assignment
  ) => {
    try {
      if (newStatus === 'submitted' && !canSubmitAssignment(assignment)) {
        onNotification('error', 'Submission Not Allowed',
          'Late submission is not allowed for this assignment and the due date has passed.');
        return;
      }

      await updateAssignmentStatus(studentAssignmentId, newStatus);

      onAssignmentsUpdate(prev => prev.map(a =>
        a.assignment_id === assignmentId
          ? {
            ...a,
            status: newStatus as any,
            submission_date: newStatus === 'submitted' && !a.submission_date
              ? new Date().toISOString()
              : a.submission_date
          }
          : a
      ));

      await onStatsRefresh();

      const statusLabels: Record<string, string> = {
        'todo': 'To Do',
        'in-progress': 'In Progress',
        'submitted': 'Submitted',
        'graded': 'Graded'
      };
      onNotification('success', 'Status Updated',
        `Assignment status changed to ${statusLabels[newStatus] || newStatus}`);
    } catch (error) {
      onNotification('error', 'Update Failed',
        'Failed to update assignment status. Please try again.');
    }
  }, [onAssignmentsUpdate, onStatsRefresh, onNotification]);

  const handleUploadSubmit = useCallback(async (
    assignment: Assignment,
    stagedFiles: File[],
    onSuccess: () => void
  ) => {
    if (!studentId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const session = await getAuthSession();
      validateStorageConfig();

      setUploadProgress(10);

      await submitAssignmentWithStagedFiles(
        assignment.student_assignment_id,
        stagedFiles,
        studentId,
        assignment.assignment_id,
        session.access_token
      );

      setUploadProgress(100);

      onAssignmentsUpdate(prev => prev.map(a =>
        a.assignment_id === assignment.assignment_id
          ? { ...a, status: 'submitted', submission_date: new Date().toISOString() }
          : a
      ));

      await onStatsRefresh();

      setTimeout(() => {
        onSuccess();
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (error: any) {
      const errorMessage = getUploadErrorMessage(error);
      onNotification('error', 'Upload Failed', errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [studentId, onAssignmentsUpdate, onStatsRefresh, onNotification]);

  const loadAssignmentDetails = useCallback(async (assignmentId: string) => {
    if (!studentId) return null;

    try {
      return await getAssignmentWithFiles(studentId, assignmentId);
    } catch (error) {
      throw error;
    }
  }, [studentId]);

  return {
    isUploading,
    uploadProgress,
    canSubmitAssignment,
    handleStatusChange,
    handleUploadSubmit,
    loadAssignmentDetails
  };
};
