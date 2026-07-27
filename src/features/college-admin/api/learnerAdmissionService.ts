import { apiPost } from '@/shared/api/apiClient';
import type { LearnerAdmission, ApiResponse } from '@/shared/types/college';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if ('message' in record && typeof record.message === 'string') {
      return record.message;
    }
    if ('error' in record && record.error && typeof record.error === 'object') {
      const innerRecord = record.error as Record<string, unknown>;
      if ('message' in innerRecord && typeof innerRecord.message === 'string') {
        return innerRecord.message;
      }
    }
  }
  return fallback;
}

async function handleApiCall<T>(
  fn: () => Promise<T>,
  errorCode: string,
  fallbackMessage: string,
): Promise<ApiResponse<T>> {
  try {
    const result = await fn();
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = extractErrorMessage(error, fallbackMessage);
    return {
      success: false,
      error: {
        code: errorCode,
        message,
      },
    };
  }
}

export interface BulkUploadStatus {
  batch_id: string;
  status: string;
  total_rows: number;
  processed_rows: number;
  success_count: number;
  failed_count: number;
  pending_count: number;
  progress_percentage: number;
  created_at: string;
  completed_at?: string;
  errors_count: number;
}

export interface BulkUploadError {
  row: number;
  email: string;
  error: string;
}

async function extractData<T>(path: string, body: unknown): Promise<T> {
  const { data } = await apiPost<{ data: T }>(path, body);
  if (data === null || data === undefined) {
    throw new Error('API returned empty data');
  }
  return data;
}

export const learnerAdmissionService = {
  async createApplication(data: Partial<LearnerAdmission>): Promise<ApiResponse<LearnerAdmission>> {
    return handleApiCall(
      () => extractData<LearnerAdmission>('/college-admin/admissions', { action: 'create-application', ...data }),
      'CREATE_ERROR',
      'Failed to create application',
    );
  },

  async verifyDocuments(id: string, documentIds: string[]): Promise<ApiResponse<void>> {
    return handleApiCall(
      async () => { await apiPost('/college-admin/admissions', { action: 'verify-documents', id, document_ids: documentIds }); },
      'VERIFY_ERROR',
      'Failed to verify documents',
    );
  },

  async approveAdmission(id: string): Promise<ApiResponse<void>> {
    return handleApiCall(
      async () => { await apiPost('/college-admin/admissions', { action: 'approve-admission', id }); },
      'APPROVE_ERROR',
      'Failed to approve admission',
    );
  },

  async generateRollNumber(programId: string, year: number): Promise<ApiResponse<string>> {
    return handleApiCall(
      async () => {
        const { data } = await apiPost<{ data: { roll_number: string } }>('/college-admin/admissions', { action: 'generate-roll-number', program_id: programId, year });
        if (!data?.roll_number) throw new Error('roll_number not returned');
        return data.roll_number;
      },
      'GENERATE_ERROR',
      'Failed to generate roll number',
    );
  },

  async enrollLearner(id: string, rollNumber: string): Promise<ApiResponse<void>> {
    return handleApiCall(
      async () => { await apiPost('/college-admin/admissions', { action: 'enroll-learner', id, roll_number: rollNumber }); },
      'ENROLL_ERROR',
      'Failed to enroll learner',
    );
  },

  async promoteToNextSemester(learnerIds: string[]): Promise<ApiResponse<{ success: string[]; failed: string[] }>> {
    return handleApiCall(
      () => extractData<{ success: string[]; failed: string[] }>('/college-admin/admissions', { action: 'promote-semester', learner_ids: learnerIds }),
      'PROMOTION_ERROR',
      'Failed to promote learners',
    );
  },

  async checkGraduationEligibility(learnerId: string): Promise<ApiResponse<{ eligible: boolean; reason?: string }>> {
    return handleApiCall(
      () => extractData<{ eligible: boolean; reason?: string }>('/college-admin/admissions', { action: 'check-graduation', learner_id: learnerId }),
      'ELIGIBILITY_ERROR',
      'Failed to check eligibility',
    );
  },

  async markAsGraduated(learnerIds: string[]): Promise<ApiResponse<void>> {
    return handleApiCall(
      async () => { await apiPost('/college-admin/admissions', { action: 'mark-graduated', learner_ids: learnerIds }); },
      'GRADUATION_ERROR',
      'Failed to mark as graduated',
    );
  },

  async bulkImportlearners(csvData: string, organizationId: string): Promise<ApiResponse<{ batch_id: string }>> {
    return this.queueBulkUpload(csvData, organizationId);
  },

  async updateCGPA(learnerId: string): Promise<ApiResponse<number>> {
    return handleApiCall(
      async () => {
        const { data } = await apiPost<{ data: { cgpa: number } }>('/college-admin/admissions', { action: 'update-cgpa', learner_id: learnerId });
        if (data?.cgpa === undefined) throw new Error('cgpa not returned');
        return data.cgpa;
      },
      'CGPA_ERROR',
      'Failed to calculate CGPA',
    );
  },

  async queueBulkUpload(csvData: string, organizationId: string): Promise<ApiResponse<{ batch_id: string }>> {
    return handleApiCall(
      () => extractData<{ batch_id: string }>('/college-admin/admissions', {
        action: 'bulk-upload-csv',
        csv_data: csvData,
        organization_id: organizationId,
      }),
      'QUEUE_ERROR',
      'Failed to queue bulk upload',
    );
  },

  async getBulkStatus(batchId: string): Promise<ApiResponse<BulkUploadStatus>> {
    return handleApiCall(
      () => extractData<BulkUploadStatus>('/college-admin/admissions', {
        action: 'bulk-upload-status',
        batch_id: batchId,
      }),
      'STATUS_ERROR',
      'Failed to get batch status',
    );
  },

  async getBulkErrors(batchId: string): Promise<ApiResponse<{ errors: BulkUploadError[]; total_errors: number }>> {
    return handleApiCall(
      () => extractData<{ errors: BulkUploadError[]; total_errors: number }>('/college-admin/admissions', {
        action: 'bulk-upload-errors',
        batch_id: batchId,
      }),
      'ERRORS_ERROR',
      'Failed to get batch errors',
    );
  },

  async getlearnerAdmissions(filters: {
    program_id?: string;
    department_id?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<LearnerAdmission[]>> {
    return handleApiCall(
      () => extractData<LearnerAdmission[]>('/college-admin/admissions', { action: 'get-admissions', ...filters }),
      'FETCH_ERROR',
      'Failed to fetch admissions',
    );
  },
};
