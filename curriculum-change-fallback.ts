/**
 * Fallback implementation for curriculum change requests
 * Uses direct database operations instead of RPC functions to avoid auth issues
 */

import { supabase } from '../lib/supabaseClient';

export class CurriculumChangeFallbackService {
  /**
   * Add pending change using direct database operations
   */
  async addPendingChange(
    curriculumId: string,
    changeType: string,
    entityId: string | null,
    changeData: any,
    message?: string
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { 
          success: false, 
          error: 'Authentication required. Please refresh the page and try again.' 
        };
      }

      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.warn('Could not fetch user details:', userError);
      }

      // Generate change ID
      const changeId = crypto.randomUUID();

      // Create change object
      const changeObject = {
        id: changeId,
        change_type: changeType,
        entity_id: entityId,
        request_timestamp: new Date().toISOString(),
        requested_by: user.id,
        requester_name: userData?.name || userData?.email || 'Unknown User',
        request_message: message,
        status: 'pending',
        data: changeData
      };

      // Get current pending changes
      const { data: curriculum, error: fetchError } = await supabase
        .from('college_curriculums')
        .select('pending_changes, change_history')
        .eq('id', curriculumId)
        .single();

      if (fetchError) {
        return { success: false, error: 'Curriculum not found or access denied' };
      }

      // Update pending changes array
      const currentPendingChanges = curriculum.pending_changes || [];
      const updatedPendingChanges = [...currentPendingChanges, changeObject];

      // Update change history
      const currentChangeHistory = curriculum.change_history || [];
      const historyEntry = {
        id: changeId,
        action: 'change_requested',
        change_type: changeType,
        request_timestamp: new Date().toISOString(),
        user_id: user.id,
        user_name: userData?.name || userData?.email || 'Unknown User',
        message: message
      };
      const updatedChangeHistory = [...currentChangeHistory, historyEntry];

      // Update the curriculum
      const { error: updateError } = await supabase
        .from('college_curriculums')
        .update({
          pending_changes: updatedPendingChanges,
          change_history: updatedChangeHistory,
          has_pending_changes: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', curriculumId);

      if (updateError) {
        return { success: false, error: 'Failed to save change request: ' + updateError.message };
      }

      return { success: true, data: changeId };
    } catch (error: any) {
      console.error('Error in addPendingChange fallback:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Submit outcome add using fallback method
   */
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

  /**
   * Submit unit add using fallback method
   */
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

  /**
   * Approve pending change using direct database operations
   */
  async approvePendingChange(
    curriculumId: string,
    changeId: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { 
          success: false, 
          error: 'Authentication required. Please refresh the page and try again.' 
        };
      }

      // Get curriculum with pending changes
      const { data: curriculum, error: fetchError } = await supabase
        .from('college_curriculums')
        .select('pending_changes, change_history')
        .eq('id', curriculumId)
        .single();

      if (fetchError) {
        return { success: false, error: 'Curriculum not found' };
      }

      const pendingChanges = curriculum.pending_changes || [];
      const changeIndex = pendingChanges.findIndex((change: any) => change.id === changeId);

      if (changeIndex === -1) {
        return { success: false, error: 'Change request not found' };
      }

      const change = pendingChanges[changeIndex];

      // Apply the change based on type
      const applyResult = await this.applyChange(curriculumId, change, user.id);
      if (!applyResult.success) {
        return applyResult;
      }

      // Remove from pending changes
      const updatedPendingChanges = pendingChanges.filter((_: any, index: number) => index !== changeIndex);

      // Add to change history
      const currentChangeHistory = curriculum.change_history || [];
      const historyEntry = {
        id: changeId,
        action: 'change_approved',
        change_type: change.change_type,
        request_timestamp: new Date().toISOString(),
        user_id: user.id,
        user_name: 'University Admin',
        review_notes: reviewNotes,
        applied: true
      };
      const updatedChangeHistory = [...currentChangeHistory, historyEntry];

      // Update curriculum
      const { error: updateError } = await supabase
        .from('college_curriculums')
        .update({
          pending_changes: updatedPendingChanges,
          change_history: updatedChangeHistory,
          has_pending_changes: updatedPendingChanges.length > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', curriculumId);

      if (updateError) {
        return { success: false, error: 'Failed to update curriculum: ' + updateError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in approvePendingChange fallback:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Apply the actual change to the database tables
   */
  private async applyChange(curriculumId: string, change: any, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const changeType = change.change_type;
      const changeData = change.data?.data || change.data;

      if (changeType === 'outcome_add') {
        const { error } = await supabase
          .from('college_curriculum_outcomes')
          .insert({
            curriculum_id: curriculumId,
            unit_id: changeData.unit_id,
            outcome_text: changeData.outcome_text,
            bloom_level: changeData.bloom_level,
            assessment_mappings: changeData.assessment_mappings || [],
            created_by: userId,
            updated_by: userId
          });

        if (error) {
          return { success: false, error: 'Failed to add outcome: ' + error.message };
        }

      } else if (changeType === 'unit_add') {
        const { error } = await supabase
          .from('college_curriculum_units')
          .insert({
            curriculum_id: curriculumId,
            name: changeData.name,
            code: changeData.code,
            description: changeData.description,
            credits: changeData.credits,
            estimated_duration: changeData.estimated_duration,
            duration_unit: changeData.duration_unit,
            order_index: changeData.order_index || 1,
            created_by: userId,
            updated_by: userId
          });

        if (error) {
          return { success: false, error: 'Failed to add unit: ' + error.message };
        }

      } else if (changeType === 'outcome_edit') {
        const { error } = await supabase
          .from('college_curriculum_outcomes')
          .update({
            outcome_text: changeData.outcome_text,
            bloom_level: changeData.bloom_level,
            assessment_mappings: changeData.assessment_mappings || [],
            updated_by: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', change.entity_id);

        if (error) {
          return { success: false, error: 'Failed to update outcome: ' + error.message };
        }

      } else if (changeType === 'unit_edit') {
        const { error } = await supabase
          .from('college_curriculum_units')
          .update({
            name: changeData.name,
            code: changeData.code,
            description: changeData.description,
            credits: changeData.credits,
            estimated_duration: changeData.estimated_duration,
            duration_unit: changeData.duration_unit,
            order_index: changeData.order_index,
            updated_by: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', change.entity_id);

        if (error) {
          return { success: false, error: 'Failed to update unit: ' + error.message };
        }

      } else if (changeType === 'outcome_delete') {
        const { error } = await supabase
          .from('college_curriculum_outcomes')
          .delete()
          .eq('id', change.entity_id);

        if (error) {
          return { success: false, error: 'Failed to delete outcome: ' + error.message };
        }

      } else if (changeType === 'unit_delete') {
        const { error } = await supabase
          .from('college_curriculum_units')
          .delete()
          .eq('id', change.entity_id);

        if (error) {
          return { success: false, error: 'Failed to delete unit: ' + error.message };
        }

      } else {
        return { success: false, error: 'Unknown change type: ' + changeType };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error applying change:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }
}

export const curriculumChangeFallbackService = new CurriculumChangeFallbackService();