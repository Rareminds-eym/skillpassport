import { apiPost } from '@/shared/api/apiClient';
import type { LearnerAdmission, ApiResponse, BulkImportResult } from '@/shared/types/college';

export const learnerAdmissionService = {
  async createApplication(data: Partial<LearnerAdmission>): Promise<ApiResponse<LearnerAdmission>> {
    try {
      const result: any = await apiPost('/college-admin/admissions', { action: 'create-application', ...data });
      return { success: true, data: result.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error?.message || error?.error?.message || 'Failed to create application',
        },
      };
    }
  },

  async verifyDocuments(id: string, documentIds: string[]): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/admissions', { action: 'verify-documents', id, document_ids: documentIds });
      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VERIFY_ERROR',
          message: error?.message || error?.error?.message || 'Failed to verify documents',
        },
      };
    }
  },

  async approveAdmission(id: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/admissions', { action: 'approve-admission', id });
      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'APPROVE_ERROR',
          message: error?.message || error?.error?.message || 'Failed to approve admission',
        },
      };
    }
  },

  async generateRollNumber(programId: string, year: number): Promise<ApiResponse<string>> {
    try {
      const result: any = await apiPost('/college-admin/admissions', { action: 'generate-roll-number', program_id: programId, year });
      return { success: true, data: result.data.roll_number };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GENERATE_ERROR',
          message: error?.message || error?.error?.message || 'Failed to generate roll number',
        },
      };
    }
  },

  async enrollLearner(id: string, rollNumber: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/admissions', { action: 'enroll-learner', id, roll_number: rollNumber });
      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ENROLL_ERROR',
          message: error?.message || error?.error?.message || 'Failed to enroll learner',
        },
      };
    }
  },

  async promoteToNextSemester(learnerIds: string[]): Promise<ApiResponse<{ success: string[]; failed: string[] }>> {
    try {
      const result: any = await apiPost('/college-admin/admissions', { action: 'promote-semester', learner_ids: learnerIds });
      return { success: true, data: result.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'PROMOTION_ERROR',
          message: error?.message || error?.error?.message || 'Failed to promote learners',
        },
      };
    }
  },

  async checkGraduationEligibility(learnerId: string): Promise<ApiResponse<{ eligible: boolean; reason?: string }>> {
    try {
      const result: any = await apiPost('/college-admin/admissions', { action: 'check-graduation', learner_id: learnerId });
      return { success: true, data: result.data };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ELIGIBILITY_ERROR',
          message: error?.message || error?.error?.message || 'Failed to check eligibility',
        },
      };
    }
  },

  async markAsGraduated(learnerIds: string[]): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/admissions', { action: 'mark-graduated', learner_ids: learnerIds });
      return { success: true, data: undefined };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GRADUATION_ERROR',
          message: error?.message || error?.error?.message || 'Failed to mark as graduated',
        },
      };
    }
  },

  async bulkImportlearners(csvData: any[]): Promise<ApiResponse<BulkImportResult>> {
    try {
      const result: BulkImportResult = { success: 0, failed: 0, errors: [] };
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 2;
        if (!row.program_id || !row.department_id || !row.personal_details) {
          result.failed++;
          result.errors.push({ row: rowNumber, field: 'required', message: 'Missing required fields' });
          continue;
        }
        const createResult = await this.createApplication(row);
        if (createResult.success) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push({ row: rowNumber, field: createResult.error?.code || 'unknown', message: createResult.error?.message || 'Unknown error' });
        }
      }
      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BULK_IMPORT_ERROR',
          message: error?.message || error?.error?.message || 'Failed to import learners',
        },
      };
    }
  },

  async updateCGPA(learnerId: string): Promise<ApiResponse<number>> {
    try {
      const result: any = await apiPost('/college-admin/admissions', { action: 'update-cgpa', learner_id: learnerId });
      return { success: true, data: result.data.cgpa };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CGPA_ERROR',
          message: error?.message || error?.error?.message || 'Failed to calculate CGPA',
        },
      };
    }
  },

  async getlearnerAdmissions(filters: {
    program_id?: string;
    department_id?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<LearnerAdmission[]>> {
    try {
      const result: any = await apiPost('/college-admin/admissions', { action: 'get-admissions', ...filters });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error?.message || error?.error?.message || 'Failed to fetch admissions',
        },
      };
    }
  },
};
