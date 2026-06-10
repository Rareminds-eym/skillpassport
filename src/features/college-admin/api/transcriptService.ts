import { apiPost } from '@/shared/api/apiClient';
import type { Transcript, TranscriptData, ApiResponse } from '@/shared/types/college';

export const transcriptService = {
  async generateTranscript(data: Partial<Transcript>): Promise<ApiResponse<Transcript>> {
    try {
      if (!data.learner_id || !data.semester_from || !data.semester_to) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Learner ID and semester range are required' } };
      }
      const result: any = await apiPost('/college-admin/transcripts', { action: 'generate', ...data });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'GENERATE_ERROR', message: error?.message || error?.error?.message || 'Failed to generate transcript' } };
    }
  },

  async batchGenerateTranscripts(filters: { department_id?: string; program_id?: string; graduation_year?: number; type: 'provisional' | 'final' }): Promise<ApiResponse<Transcript[]>> {
    try {
      const result: any = await apiPost('/college-admin/transcripts', { action: 'batch-generate', ...filters });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: { code: 'BATCH_GENERATE_ERROR', message: error?.message || error?.error?.message || 'Failed to batch generate transcripts' } };
    }
  },

  async approveTranscript(id: string, approvedBy: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/transcripts', { action: 'approve', id, approved_by: approvedBy });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'APPROVE_ERROR', message: error?.message || error?.error?.message || 'Failed to approve transcript' } };
    }
  },

  async downloadTranscriptPDF(id: string): Promise<ApiResponse<Blob>> {
    try {
      const result: any = await apiPost('/college-admin/transcripts', { action: 'get-transcripts', id });
      const transcript = result.data?.[0];
      if (!transcript?.file_url) return { success: false, error: { code: 'NOT_FOUND', message: 'Transcript PDF not found' } };
      const response = await fetch(transcript.file_url);
      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error: any) {
      return { success: false, error: { code: 'DOWNLOAD_ERROR', message: error?.message || error?.error?.message || 'Failed to download transcript' } };
    }
  },

  async verifyTranscript(verificationId: string): Promise<ApiResponse<TranscriptData>> {
    try {
      const result: any = await apiPost('/college-admin/transcripts', { action: 'verify', verification_id: verificationId });
      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: { code: 'VERIFY_ERROR', message: error?.message || error?.error?.message || 'Failed to verify transcript' } };
    }
  },

  async getTranscripts(filters: { learner_id?: string; type?: 'provisional' | 'final'; status?: string }): Promise<ApiResponse<Transcript[]>> {
    try {
      const result: any = await apiPost('/college-admin/transcripts', { action: 'get-transcripts', ...filters });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: { code: 'FETCH_ERROR', message: error?.message || error?.error?.message || 'Failed to fetch transcripts' } };
    }
  },

  async publishTranscript(id: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/transcripts', { action: 'publish', id });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'PUBLISH_ERROR', message: error?.message || error?.error?.message || 'Failed to publish transcript' } };
    }
  },
};
