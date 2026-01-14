// ============================================================================
// CURRICULUM CHANGE REQUEST SERVICE
// ============================================================================
// Handles all curriculum change approval operations
// ============================================================================

import { supabase } from '../lib/supabaseClient';

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
  /**
   * Check if curriculum requires approval for changes
   */
  async requiresApproval(curriculumId: string): Promise<{
    requiresApproval: boolean;
    reason?: string;
  }> {
    try {
      const { data: curriculum, error } = await supabase
        .from('college_curriculums')
        .select('status, university_id')
        .eq('id', curriculumId)
        .single();
      
      if (error) throw error;
      
      // Requires approval if:
      // 1. Curriculum is published
      // 2. College is affiliated with university
      const requiresApproval = 
        curriculum.status === 'published' && 
        curriculum.university_id !== null;
      
      return {
        requiresApproval,
        reason: requiresApproval 
          ? 'Published curriculum in affiliated college requires university approval'
          : undefined
      };
    } catch (error: any) {
      console.error('Error checking approval requirement:', error);
      return { requiresApproval: false };
    }
  }

  /**
   * Submit change request for UNIT ADD
   */
  async submitUnitAdd(
    curriculumId: string,
    unitData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const changeData = {
        data: unitData
      };
      
      const { data, error } = await supabase.rpc('add_pending_change', {
        p_curriculum_id: curriculumId,
        p_change_type: 'unit_add',
        p_entity_id: null,
        p_change_data: changeData,
        p_message: message || 'Adding new unit'
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error submitting unit add:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit change request for UNIT EDIT
   */
  async submitUnitEdit(
    curriculumId: string,
    unitId: string,
    beforeData: any,
    afterData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const changeData = {
        before: beforeData,
        after: afterData
      };
      
      const { data, error } = await supabase.rpc('add_pending_change', {
        p_curriculum_id: curriculumId,
        p_change_type: 'unit_edit',
        p_entity_id: unitId,
        p_change_data: changeData,
        p_message: message || 'Editing unit'
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error submitting unit edit:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit change request for UNIT DELETE
   */
  async submitUnitDelete(
    curriculumId: string,
    unitId: string,
    unitData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const changeData = {
        data: unitData
      };
      
      const { data, error } = await supabase.rpc('add_pending_change', {
        p_curriculum_id: curriculumId,
        p_change_type: 'unit_delete',
        p_entity_id: unitId,
        p_change_data: changeData,
        p_message: message || 'Deleting unit'
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error submitting unit delete:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit change request for OUTCOME ADD
   */
  async submitOutcomeAdd(
    curriculumId: string,
    outcomeData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const changeData = {
        data: outcomeData
      };
      
      const { data, error } = await supabase.rpc('add_pending_change', {
        p_curriculum_id: curriculumId,
        p_change_type: 'outcome_add',
        p_entity_id: null,
        p_change_data: changeData,
        p_message: message || 'Adding new learning outcome'
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error submitting outcome add:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit change request for OUTCOME EDIT
   */
  async submitOutcomeEdit(
    curriculumId: string,
    outcomeId: string,
    beforeData: any,
    afterData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const changeData = {
        before: beforeData,
        after: afterData
      };
      
      const { data, error } = await supabase.rpc('add_pending_change', {
        p_curriculum_id: curriculumId,
        p_change_type: 'outcome_edit',
        p_entity_id: outcomeId,
        p_change_data: changeData,
        p_message: message || 'Editing learning outcome'
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error submitting outcome edit:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit change request for OUTCOME DELETE
   */
  async submitOutcomeDelete(
    curriculumId: string,
    outcomeId: string,
    outcomeData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const changeData = {
        data: outcomeData
      };
      
      const { data, error } = await supabase.rpc('add_pending_change', {
        p_curriculum_id: curriculumId,
        p_change_type: 'outcome_delete',
        p_entity_id: outcomeId,
        p_change_data: changeData,
        p_message: message || 'Deleting learning outcome'
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error submitting outcome delete:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit change request for CURRICULUM EDIT
   */
  async submitCurriculumEdit(
    curriculumId: string,
    beforeData: any,
    afterData: any,
    message?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const changeData = {
        before: beforeData,
        after: afterData
      };
      
      const { data, error } = await supabase.rpc('add_pending_change', {
        p_curriculum_id: curriculumId,
        p_change_type: 'curriculum_edit',
        p_entity_id: null,
        p_change_data: changeData,
        p_message: message || 'Editing curriculum details'
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error submitting curriculum edit:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending changes for a curriculum
   */
  async getPendingChanges(curriculumId: string): Promise<{
    success: boolean;
    data?: PendingChange[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_pending_changes', {
        p_curriculum_id: curriculumId
      });
      
      if (error) throw error;
      
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching pending changes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve a pending change (University Admin)
   */
  async approveChange(
    curriculumId: string,
    changeId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('approve_pending_change', {
        p_curriculum_id: curriculumId,
        p_change_id: changeId,
        p_review_notes: reviewNotes || null
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error approving change:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a pending change (University Admin)
   */
  async rejectChange(
    curriculumId: string,
    changeId: string,
    reviewNotes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('reject_pending_change', {
        p_curriculum_id: curriculumId,
        p_change_id: changeId,
        p_review_notes: reviewNotes
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error rejecting change:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel a pending change (College Admin)
   */
  async cancelChange(
    curriculumId: string,
    changeId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('cancel_pending_change', {
        p_curriculum_id: curriculumId,
        p_change_id: changeId
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error canceling change:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all pending changes for university admin
   * Uses the simpler function that automatically gets current user's university
   */
  async getAllPendingChangesForUniversity(universityId?: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      // Try the new simpler function first (no parameters needed)
      const { data, error } = await supabase.rpc('get_my_university_pending_changes');
      
      if (error) {
        // Fallback to the old function if the new one doesn't exist
        console.log('Trying fallback function with universityId:', universityId);
        if (!universityId) {
          throw new Error('University ID is required for fallback function');
        }
        
        const fallbackResult = await supabase.rpc(
          'get_all_pending_changes_for_university',
          { p_university_id: universityId }
        );
        
        if (fallbackResult.error) throw fallbackResult.error;
        return { success: true, data: fallbackResult.data || [] };
      }
      
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching university pending changes:', error);
      return { success: false, error: error.message };
    }
  }
}

export const curriculumChangeRequestService = new CurriculumChangeRequestService();
