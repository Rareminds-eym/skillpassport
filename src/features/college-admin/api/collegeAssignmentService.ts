import { apiPost } from '@/shared/api/apiClient';
import { uploadMultipleFiles } from '@/shared/api/fileUploadService';
import type {
  Department,
  Program,
  ProgramSection,
  Course,
  CollegeLearner,
  CollegeAssignment,
  CreateAssignmentData,
  ServiceResponse,
} from './collegeAssignmentTypes';

export * from './collegeAssignmentTypes';

export const fetchEducatorDepartments = async (educatorUserId: string): Promise<ServiceResponse<Department[]>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', { action: 'get-educator-departments', educator_user_id: educatorUserId });
    return { data: result.data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch departments' };
  }
};

export const fetchEducatorPrograms = async (educatorUserId: string, departmentId?: string): Promise<ServiceResponse<Program[]>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', { action: 'get-educator-programs', educator_user_id: educatorUserId, department_id: departmentId });
    return { data: result.data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch programs' };
  }
};

export const fetchEducatorProgramSections = async (educatorUserId: string): Promise<ServiceResponse<ProgramSection[]>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', { action: 'get-educator-sections', educator_user_id: educatorUserId });
    return { data: result.data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch program sections' };
  }
};

export const fetchEducatorCoursesByProgram = async (educatorUserId: string, programId: string): Promise<ServiceResponse<Course[]>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', { action: 'get-educator-courses', educator_user_id: educatorUserId, program_id: programId });
    return { data: result.data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch courses' };
  }
};

export const fetchProgramSectionlearners = async (sectionId: string): Promise<ServiceResponse<CollegeLearner[]>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', { action: 'get-section-learners', section_id: sectionId });
    return { data: result.data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch learners' };
  }
};

export const createCollegeAssignment = async (
  assignmentData: CreateAssignmentData,
  educatorUserId: string,
  instructionFiles?: File[]
): Promise<ServiceResponse<CollegeAssignment>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', {
      action: 'create-assignment',
      educator_user_id: educatorUserId,
      ...assignmentData,
    });

    let uploadedFiles: Array<{ name: string; url: string; size: number; type: string }> = [];

    if (instructionFiles && instructionFiles.length > 0) {
      const folder = `college_assignments_tasks/${educatorUserId}/${result.data.assignment_id}`;
      const results = await uploadMultipleFiles(instructionFiles, folder);

      uploadedFiles = results
        .map((r, i) => {
          if (r.success && r.url) {
            const file = instructionFiles[i];
            return { name: file.name, url: r.url, size: file.size, type: file.type };
          }
          return null;
        })
        .filter((f): f is { name: string; url: string; size: number; type: string } => f !== null);

      if (uploadedFiles.length > 0) {
        const updateResult: any = await apiPost('/college-admin/assignments', {
          action: 'update-assignment',
          assignment_id: result.data.assignment_id,
          instruction_files: uploadedFiles,
        });
        result.data.instruction_files = updateResult.data.instruction_files || uploadedFiles;
      }
    }

    const assignment: CollegeAssignment = {
      ...result.data,
      program_name: result.data.program_name,
      department_name: result.data.department_name,
      status: 'active',
      instruction_files: uploadedFiles.length > 0 ? uploadedFiles : (result.data.instruction_files || []),
    };

    return { data: assignment, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to create assignment' };
  }
};

export const fetchEducatorAssignments = async (educatorUserId: string): Promise<ServiceResponse<CollegeAssignment[]>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', { action: 'get-educator-assignments', educator_user_id: educatorUserId });
    return { data: result.data || [], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch assignments' };
  }
};

export const ensurelearnerUserAccounts = async (learners: CollegeLearner[]): Promise<ServiceResponse<string[]>> => {
  try {
    if (learners.length === 0) return { data: null, error: 'No learners provided' };
    const result: any = await apiPost('/college-admin/assignments', { action: 'ensure-user-accounts', learners: learners.map(l => ({ id: l.id, email: l.email, user_id: l.user_id })) });
    if (!result?.data?.length) return { data: null, error: 'No valid user accounts found for selected learners.' };
    return { data: result.data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to find user accounts' };
  }
};

export const assignTaskTolearners = async (assignmentId: string, learnerUserIds: string[]): Promise<ServiceResponse<boolean>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', { action: 'assign-task-to-learners', assignment_id: assignmentId, learner_user_ids: learnerUserIds });
    return { data: result.data === true, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to assign task to learners' };
  }
};

export const getAssignmentStatistics = async (educatorUserId: string): Promise<ServiceResponse<{
  totalAssignments: number;
  activeAssignments: number;
  totalSubmissions: number;
  pendingReviews: number;
  averageScore: number;
}>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', { action: 'get-assignment-stats', educator_user_id: educatorUserId });
    return { data: result.data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch statistics' };
  }
};

export const deleteAssignment = async (assignmentId: string): Promise<ServiceResponse<boolean>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', { action: 'delete-assignment', assignment_id: assignmentId });
    return { data: result.data === true, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to delete assignment' };
  }
};

export const updateAssignment = async (assignmentId: string, updateData: Partial<CreateAssignmentData>): Promise<ServiceResponse<CollegeAssignment>> => {
  try {
    const result: any = await apiPost('/college-admin/assignments', { action: 'update-assignment', assignment_id: assignmentId, ...updateData });
    return { data: result.data || null, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to update assignment' };
  }
};
