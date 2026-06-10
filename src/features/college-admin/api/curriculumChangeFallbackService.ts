import { apiPost } from '@/shared/api/apiClient';
import { AdminNotificationService } from '@/features/admin';

export class CurriculumChangeFallbackService {
  async addPendingChange(
    curriculumId: string,
    changeType: string,
    entityId: string | null,
    changeData: any,
    message?: string
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'add-pending-change',
        curriculum_id: curriculumId,
        change_type: changeType,
        entity_id: entityId,
        change_data: changeData,
        message
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to add pending change' };
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  async submitOutcomeAdd(
    curriculumId: string,
    outcomeData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.addPendingChange(
      curriculumId,
      'outcome_add',
      null,
      { data: outcomeData },
      message || 'Adding new learning outcome'
    );

    return {
      success: result.success,
      error: result.error
    };
  }

  async submitUnitAdd(
    curriculumId: string,
    unitData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.addPendingChange(
      curriculumId,
      'unit_add',
      null,
      { data: unitData },
      message || 'Adding new unit'
    );

    return {
      success: result.success,
      error: result.error
    };
  }

  async approveCurriculumByHOD(
    curriculumId: string,
    changeId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.approvePendingChange(curriculumId, changeId, reviewNotes);
  }

  async approvePendingChange(
    curriculumId: string,
    changeId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'approve-curriculum-by-hod',
        curriculum_id: curriculumId,
        change_id: changeId,
        review_notes: reviewNotes
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to approve change' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  async rejectCurriculumByHOD(
    curriculumId: string,
    changeId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.rejectPendingChange(curriculumId, changeId, reviewNotes);
  }

  async rejectPendingChange(
    curriculumId: string,
    changeId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'reject-curriculum-by-hod',
        curriculum_id: curriculumId,
        change_id: changeId,
        review_notes: reviewNotes
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to reject change' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  async cancelCurriculumChange(
    curriculumId: string,
    changeId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.cancelPendingChange(curriculumId, changeId);
  }

  async cancelPendingChange(
    curriculumId: string,
    changeId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'cancel-curriculum-change',
        curriculum_id: curriculumId,
        change_id: changeId
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to cancel change' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  async requestModification(
    curriculumId: string,
    changeId: string,
    notes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'request-modification',
        curriculum_id: curriculumId,
        change_id: changeId,
        notes
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to request modification' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  async getAllCurriculumChanges(filters?: {
    status?: string;
    college_id?: string;
  }): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'get-all-curriculum-changes',
        ...filters
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to fetch curriculum changes' };
      }

      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  async getCurriculumChangeDetails(changeId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'get-curriculum-change-details',
        change_id: changeId
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to fetch change details' };
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  async getNotificationCount(): Promise<{ success: boolean; data?: number; error?: string }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'get-notification-count'
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to fetch notification count' };
      }

      return { success: true, data: result.data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  async approveAllChanges(
    curriculumId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; results?: { approved: number; failed: number }; error?: string }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'approve-all-changes',
        curriculum_id: curriculumId,
        review_notes: reviewNotes
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to approve all changes' };
      }

      return { success: true, results: result.data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }
}

export const curriculumChangeFallbackService = new CurriculumChangeFallbackService();
