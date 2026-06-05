import { apiPost } from '@/shared/api/apiClient';
import type { MarkEntry, GradingScale, ApiResponse, BulkImportResult } from '@/shared/types/college';

export const markEntryService = {
  async enterMarks(entries: Partial<MarkEntry>[]): Promise<ApiResponse<MarkEntry[]>> {
    try {
      const result: any = await apiPost('/college-admin/marks', { action: 'enter-marks', entries });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: { code: 'ENTRY_ERROR', message: error?.message || error?.error?.message || 'Failed to enter marks' } };
    }
  },

  async bulkUploadMarks(assessmentId: string, csvData: any[]): Promise<ApiResponse<BulkImportResult>> {
    try {
      const result: BulkImportResult = { success: 0, failed: 0, errors: [] };
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const entry = { assessment_id: assessmentId, learner_id: row.learner_id, marks_obtained: parseFloat(row.marks_obtained), is_absent: row.is_absent === 'true' || row.is_absent === true, is_exempt: row.is_exempt === 'true' || row.is_exempt === true, remarks: row.remarks, entered_by: row.entered_by };
        const entryResult = await this.enterMarks([entry]);
        if (entryResult.success) { result.success++; } else { result.failed++; result.errors.push({ row: i + 2, field: 'marks', message: entryResult.error?.message || 'Unknown error' }); }
      }
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: { code: 'BULK_UPLOAD_ERROR', message: error?.message || error?.error?.message || 'Failed to upload marks' } };
    }
  },

  async submitMarks(assessmentId: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/marks', { action: 'submit-marks', assessment_id: assessmentId });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'SUBMIT_ERROR', message: error?.message || error?.error?.message || 'Failed to submit marks' } };
    }
  },

  async lockMarks(assessmentId: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/marks', { action: 'lock-marks', assessment_id: assessmentId });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'LOCK_ERROR', message: error?.message || error?.error?.message || 'Failed to lock marks' } };
    }
  },

  async moderateMarks(entryId: string, newMarks: number, reason: string, moderatedBy: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/marks', { action: 'moderate-marks', entry_id: entryId, marks_obtained: newMarks, reason, moderated_by: moderatedBy });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'MODERATION_ERROR', message: error?.message || error?.error?.message || 'Failed to moderate marks' } };
    }
  },

  async publishResults(assessmentId: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/marks', { action: 'publish-results', assessment_id: assessmentId });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'PUBLISH_ERROR', message: error?.message || error?.error?.message || 'Failed to publish results' } };
    }
  },

  calculateGradeFromPercentage(percentage: number): string {
    if (percentage >= 90) return 'O';
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B+';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    return 'F';
  },

  calculateGrades(marks: number, gradingScale: GradingScale[]): string {
    for (const scale of gradingScale) {
      if (marks >= scale.min_marks && marks <= scale.max_marks) return scale.grade;
    }
    return 'F';
  },

  async updateSGPACGPA(learnerId: string): Promise<ApiResponse<void>> {
    try {
      await apiPost('/college-admin/admissions', { action: 'update-cgpa', learner_id: learnerId });
      return { success: true, data: undefined };
    } catch (error: any) {
      return { success: false, error: { code: 'CGPA_UPDATE_ERROR', message: error?.message || error?.error?.message || 'Failed to update SGPA/CGPA' } };
    }
  },

  async getMarkEntries(filters: { assessment_id?: string; learner_id?: string; is_locked?: boolean }): Promise<ApiResponse<MarkEntry[]>> {
    try {
      const result: any = await apiPost('/college-admin/marks', { action: 'get-mark-entries', ...filters });
      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: { code: 'FETCH_ERROR', message: error?.message || error?.error?.message || 'Failed to fetch mark entries' } };
    }
  },
};
