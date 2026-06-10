import { apiPost } from '@/shared/api/apiClient';
import { curriculumChangeFallbackService } from './curriculumChangeFallbackService';

export interface PendingChange {
  id: string;
  change_type: 'unit_add' | 'unit_edit' | 'unit_delete' |
                'outcome_add' | 'outcome_edit' | 'outcome_delete' |
                'curriculum_edit';
  entity_id?: string;
  timestamp: string;
  requested_by: string;
  requester_name: string;
  request_message?: string;
  status: 'pending' | 'approved' | 'rejected';
  before?: any;
  after?: any;
  data?: any;
}

class CurriculumChangeRequestService {
  async requiresApproval(curriculumId: string): Promise<{
    requiresApproval: boolean;
    reason?: string;
  }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'requires-approval',
        curriculum_id: curriculumId
      });

      if (!result.success) {
        return { requiresApproval: false };
      }

      return {
        requiresApproval: result.data?.requiresApproval || false,
        reason: result.data?.reason
      };
    } catch (error: any) {
      return { requiresApproval: false };
    }
  }

  async submitChangeRequest(
    curriculumId: string,
    changeType: string,
    data: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'submit-change-request',
        curriculum_id: curriculumId,
        change_type: changeType,
        data,
        message
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to submit change request' };
      }

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }

  async submitUnitAdd(
    curriculumId: string,
    unitData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await curriculumChangeFallbackService.submitUnitAdd(curriculumId, unitData, message);
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }

  async submitUnitEdit(
    curriculumId: string,
    unitId: string,
    beforeData: any,
    afterData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await curriculumChangeFallbackService.addPendingChange(
        curriculumId,
        'unit_edit',
        unitId,
        { before: beforeData, after: afterData },
        message || 'Editing unit'
      );
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }

  async submitUnitDelete(
    curriculumId: string,
    unitId: string,
    unitData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await curriculumChangeFallbackService.addPendingChange(
        curriculumId,
        'unit_delete',
        unitId,
        { data: unitData },
        message || 'Deleting unit'
      );
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async submitOutcomeAdd(
    curriculumId: string,
    outcomeData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await curriculumChangeFallbackService.submitOutcomeAdd(curriculumId, outcomeData, message);
    } catch (error: any) {
      let errorMessage = 'Failed to submit change request';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      if (errorMessage.includes('User not authenticated')) {
        errorMessage = 'Authentication expired. Please refresh the page and try again.';
      } else if (errorMessage.includes('function') && errorMessage.includes('does not exist')) {
        errorMessage = 'System configuration error. Please contact support.';
      }

      return { success: false, error: errorMessage };
    }
  }

  async submitOutcomeEdit(
    curriculumId: string,
    outcomeId: string,
    beforeData: any,
    afterData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await curriculumChangeFallbackService.addPendingChange(
        curriculumId,
        'outcome_edit',
        outcomeId,
        { before: beforeData, after: afterData },
        message || 'Editing learning outcome'
      );
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async submitOutcomeDelete(
    curriculumId: string,
    outcomeId: string,
    outcomeData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await curriculumChangeFallbackService.addPendingChange(
        curriculumId,
        'outcome_delete',
        outcomeId,
        { data: outcomeData },
        message || 'Deleting learning outcome'
      );
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async submitCurriculumEdit(
    curriculumId: string,
    beforeData: any,
    afterData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await curriculumChangeFallbackService.addPendingChange(
        curriculumId,
        'curriculum_edit',
        null,
        { before: beforeData, after: afterData },
        message || 'Editing curriculum details'
      );
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPendingChanges(curriculumId: string): Promise<{
    success: boolean;
    data?: PendingChange[];
    error?: string;
  }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'get-pending-changes',
        curriculum_id: curriculumId
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to fetch pending changes' };
      }

      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async approveChange(
    curriculumId: string,
    changeId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await curriculumChangeFallbackService.approvePendingChange(curriculumId, changeId, reviewNotes);
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }

  async rejectChange(
    curriculumId: string,
    changeId: string,
    reviewNotes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await curriculumChangeFallbackService.rejectPendingChange(curriculumId, changeId, reviewNotes);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async cancelChangeRequest(
    curriculumId: string,
    changeId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await curriculumChangeFallbackService.cancelPendingChange(curriculumId, changeId);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async cancelChange(
    curriculumId: string,
    changeId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.cancelChangeRequest(curriculumId, changeId);
  }

  async getChangeRequestDetails(requestId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      return await curriculumChangeFallbackService.getCurriculumChangeDetails(requestId);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getAllPendingChangesForUniversity(universityId?: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const result = await apiPost<any>('/college-admin/curriculum-changes', {
        action: 'get-all-curriculum-changes',
        university_id: universityId
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to fetch pending changes' };
      }

      return { success: true, data: result.data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const curriculumChangeRequestService = new CurriculumChangeRequestService();
