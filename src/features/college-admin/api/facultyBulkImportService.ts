import { apiPost } from '@/shared/api/apiClient';
import type { ApiResponse } from '@/shared/types/college';

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
  const response = await apiPost<{ data: T }>(path, body);
  if (!response || response.data === null || response.data === undefined) {
    throw new Error('API returned empty data');
  }
  return response.data;
}

export const facultyBulkImportService = {
  async queueBulkUpload(csvData: string, organizationId: string): Promise<ApiResponse<{ batch_id: string }>> {
    return handleApiCall(
      () => extractData<{ batch_id: string }>('/college-admin/faculty', {
        action: 'bulk-upload-faculty-csv',
        csv_data: csvData,
        organization_id: organizationId,
        college_id: organizationId,
      }),
      'QUEUE_ERROR',
      'Failed to queue bulk faculty upload',
    );
  },

  async getBulkStatus(batchId: string): Promise<ApiResponse<BulkUploadStatus>> {
    return handleApiCall(
      () => extractData<BulkUploadStatus>('/college-admin/faculty', {
        action: 'bulk-upload-faculty-status',
        batch_id: batchId,
      }),
      'STATUS_ERROR',
      'Failed to get batch status',
    );
  },

  async getBulkErrors(batchId: string): Promise<ApiResponse<{ errors: BulkUploadError[]; total_errors: number }>> {
    return handleApiCall(
      () => extractData<{ errors: BulkUploadError[]; total_errors: number }>('/college-admin/faculty', {
        action: 'bulk-upload-faculty-errors',
        batch_id: batchId,
      }),
      'ERRORS_ERROR',
      'Failed to get batch errors',
    );
  },
};