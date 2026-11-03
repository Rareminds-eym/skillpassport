import { apiPost } from '@/shared/api/apiClient';
import { uploadMultipleFiles } from '@/shared/api/fileUploadService';
import type {
    CollegeLearnerAssignment,
    CollegeAssignmentStats,
    ServiceResponse,
    UploadedFile,
    LearnerAssignmentStatus,
} from './collegeAssignmentTypes';

export type { CollegeLearnerAssignment, CollegeAssignmentStats } from './collegeAssignmentTypes';

export const fetchCollegeLearnerAssignments = async (learnerId: string): Promise<ServiceResponse<CollegeLearnerAssignment[]>> => {
    try {
        const result = await apiPost('/college-admin/classes', { action: 'fetch-learner-assignments', learnerId });
        if (!result.success) {
            return { data: null, error: result.error || 'Failed to fetch assignments' };
        }
        return { data: result.data || [], error: null };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch assignments';
        return { data: null, error: message };
    }
};

export const getCollegeLearnerAssignmentStats = async (learnerId: string): Promise<ServiceResponse<CollegeAssignmentStats>> => {
    try {
        const result = await apiPost('/college-admin/classes', { action: 'get-learner-assignment-stats', learnerId });
        if (!result.success) {
            return { data: null, error: result.error || 'Failed to fetch assignment statistics' };
        }
        return { data: result.data, error: null };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch assignment statistics';
        return { data: null, error: message };
    }
};

export const updateCollegeLearnerAssignmentStatus = async (
    learnerAssignmentId: string,
    newStatus: LearnerAssignmentStatus
): Promise<ServiceResponse<boolean>> => {
    try {
        const result = await apiPost('/college-admin/classes', { action: 'update-learner-assignment-status', learnerAssignmentId, newStatus });
        if (!result.success) {
            return { data: null, error: result.error || 'Failed to update assignment status' };
        }
        return { data: true, error: null };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update assignment status';
        return { data: null, error: message };
    }
};

export const submitCollegeAssignment = async (
    learnerAssignmentId: string,
    submissionData: {
        submission_content?: string;
        submission_url?: string;
    },
    submissionFiles?: File[]
): Promise<ServiceResponse<boolean>> => {
    try {
        let uploadedFiles: UploadedFile[] = [];

        if (submissionFiles && submissionFiles.length > 0) {
            const folder = `college_assignment_submissions/pending/${learnerAssignmentId}`;
            const results = await uploadMultipleFiles(submissionFiles, folder);

            uploadedFiles = results
                .map((result, index) => {
                    if (result.success && result.url) {
                        const file = submissionFiles[index];
                        return { name: file.name, url: result.url, size: file.size, type: file.type };
                    }
                    return null;
                })
                .filter((file): file is UploadedFile => file !== null);
        }

        const result = await apiPost('/college-admin/classes', {
            action: 'submit-assignment',
            learnerAssignmentId,
            ...submissionData,
            submission_files: uploadedFiles.length > 0 ? uploadedFiles : null,
        });

        if (!result.success) {
            return { data: null, error: result.error || 'Failed to submit assignment' };
        }
        return { data: true, error: null };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to submit assignment';
        return { data: null, error: message };
    }
};

export const fetchCollegeAssignmentSubmissions = async (
    assignmentId: string
): Promise<ServiceResponse<any[]>> => {
    try {
        const result = await apiPost('/college-admin/classes', {
            action: 'get-college-assignment-submissions',
            assignment_id: assignmentId,
        });

        if (!result.success) {
            return { data: null, error: result.error || 'Failed to fetch submissions' };
        }
        return { data: result.data || [], error: null };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch submissions';
        return { data: null, error: message };
    }
};

export const gradeCollegeAssignment = async (
    learnerAssignmentId: string,
    gradingData: {
        grade_received: number;
        total_points?: number;
        instructor_feedback?: string;
        educator_id?: string;
    }
): Promise<ServiceResponse<any>> => {
    try {
        const result = await apiPost('/college-admin/classes', {
            action: 'grade-college-assignment',
            learnerAssignmentId,
            ...gradingData,
        });

        if (!result.success) {
            return { data: null, error: result.error || 'Failed to grade assignment' };
        }
        return { data: result.data, error: null };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to grade assignment';
        return { data: null, error: message };
    }
};
