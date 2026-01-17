// ============================================================================
// CURRICULUM CHANGE REQUEST SERVICE
// ============================================================================
// Handles all curriculum change approval operations
// ============================================================================

import { supabase } from '../lib/supabaseClient';
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
      // Use fallback method directly to avoid RPC authentication issues
      console.log('Using fallback method for unit add...');
      return await curriculumChangeFallbackService.submitUnitAdd(curriculumId, unitData, message);
      
    } catch (error: any) {
      console.error('Error submitting unit add:', error);
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Unknown error occurred';
      return { success: false, error: errorMessage };
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
      // Use fallback method directly to avoid RPC authentication issues
      console.log('Using fallback method for unit edit...');
      return await curriculumChangeFallbackService.addPendingChange(
        curriculumId,
        'unit_edit',
        unitId,
        { before: beforeData, after: afterData },
        message || 'Editing unit'
      );
      
    } catch (error: any) {
      console.error('Error submitting unit edit:', error);
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Unknown error occurred';
      return { success: false, error: errorMessage };
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
      // Use fallback method directly to avoid RPC authentication issues
      console.log('Using fallback method for unit delete...');
      return await curriculumChangeFallbackService.addPendingChange(
        curriculumId,
        'unit_delete',
        unitId,
        { data: unitData },
        message || 'Deleting unit'
      );
      
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
      // Check authentication before making the request
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return { 
          success: false, 
          error: 'You must be logged in to make changes to the curriculum. Please refresh the page and try again.' 
        };
      }

      console.log('User authenticated for outcome add:', user.email);

      // Use fallback method directly to avoid RPC authentication issues
      console.log('Using fallback method for outcome add...');
      return await curriculumChangeFallbackService.submitOutcomeAdd(curriculumId, outcomeData, message);

    } catch (error: any) {
      console.error('Error submitting outcome add:', error);
      // Handle different error formats
      let errorMessage = 'Failed to submit change request';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Provide user-friendly error messages
      if (errorMessage.includes('User not authenticated')) {
        errorMessage = 'Authentication expired. Please refresh the page and try again.';
      } else if (errorMessage.includes('function') && errorMessage.includes('does not exist')) {
        errorMessage = 'System configuration error. Please contact support.';
      }
      
      return { success: false, error: errorMessage };
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
      // Use fallback method directly to avoid RPC authentication issues
      console.log('Using fallback method for outcome edit...');
      return await curriculumChangeFallbackService.addPendingChange(
        curriculumId,
        'outcome_edit',
        outcomeId,
        { before: beforeData, after: afterData },
        message || 'Editing learning outcome'
      );
      
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
      // Use fallback method directly to avoid RPC authentication issues
      console.log('Using fallback method for outcome delete...');
      return await curriculumChangeFallbackService.addPendingChange(
        curriculumId,
        'outcome_delete',
        outcomeId,
        { data: outcomeData },
        message || 'Deleting learning outcome'
      );
      
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
      // Use fallback method directly to avoid RPC authentication issues
      console.log('Using fallback method for curriculum edit...');
      return await curriculumChangeFallbackService.addPendingChange(
        curriculumId,
        'curriculum_edit',
        null,
        { before: beforeData, after: afterData },
        message || 'Editing curriculum details'
      );
      
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
      // Use direct database query instead of RPC
      const { data: curriculum, error } = await supabase
        .from('college_curriculums')
        .select('pending_changes')
        .eq('id', curriculumId)
        .single();
      
      if (error) throw error;
      
      const pendingChanges = curriculum?.pending_changes || [];
      return { success: true, data: pendingChanges };
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
      // Use fallback method directly to avoid RPC authentication issues
      console.log('Using fallback method for change approval...');
      return await curriculumChangeFallbackService.approvePendingChange(curriculumId, changeId, reviewNotes);
    } catch (error: any) {
      console.error('Error approving change:', error);
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Unknown error occurred';
      return { success: false, error: errorMessage };
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
      // Use fallback method directly to avoid RPC authentication issues
      console.log('Using fallback method for change rejection...');
      return await curriculumChangeFallbackService.rejectPendingChange(curriculumId, changeId, reviewNotes);
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
      // Use fallback method directly to avoid RPC authentication issues
      console.log('Using fallback method for change cancellation...');
      return await curriculumChangeFallbackService.cancelPendingChange(curriculumId, changeId);
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
      // Use direct database query instead of RPC functions
      console.log('Fetching pending changes for university:', universityId);
      
      // Query college_curriculums with pending changes
      const { data: curriculums, error } = await supabase
        .from('college_curriculums')
        .select(`
          id,
          status,
          academic_year,
          pending_changes,
          created_at,
          college_id,
          course:college_courses!college_curriculums_course_id_fkey(course_name, course_code),
          departments(name),
          programs(name)
        `)
        .eq('has_pending_changes', true)
        .eq('university_id', universityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching curriculums with pending changes:', error);
        return { success: false, error: error.message };
      }

      // Get college names for the curriculums
      const collegeIds = [...new Set(curriculums?.map(c => c.college_id).filter(Boolean))] || [];
      let collegeMap: { [key: string]: string } = {};
      
      if (collegeIds.length > 0) {
        // Try to get college names from curriculum_approval_dashboard view
        const { data: collegeData } = await supabase
          .from('curriculum_approval_dashboard')
          .select('college_id, college_name')
          .in('college_id', collegeIds);
        
        if (collegeData) {
          collegeData.forEach(college => {
            collegeMap[college.college_id] = college.college_name;
          });
        }
      }

      // Transform the data to flatten pending changes
      const pendingChanges: any[] = [];
      
      curriculums?.forEach(curriculum => {
        if (curriculum.pending_changes && Array.isArray(curriculum.pending_changes)) {
          curriculum.pending_changes.forEach((change: any) => {
            if (change.status === 'pending') {
              pendingChanges.push({
                curriculum_id: curriculum.id,
                curriculum_status: curriculum.status,
                academic_year: curriculum.academic_year,
                course_name: curriculum.course?.course_name,
                course_code: curriculum.course?.course_code,
                department_name: curriculum.departments?.name,
                program_name: curriculum.programs?.name,
                college_name: collegeMap[curriculum.college_id] || 'Unknown College',
                college_id: curriculum.college_id,
                
                // Change details - using field names expected by frontend
                change_id: change.id,
                change_type: change.change_type,
                change_timestamp: change.request_date || change.request_timestamp, // Frontend expects this field name
                request_date: change.request_date || change.request_timestamp,
                request_message: change.request_message,
                requester_name: change.requester_name,
                requested_by: change.requested_by,
                status: change.status,
                data: change.data,
                change_data: change.data, // Frontend expects this field name
                curriculum_name: curriculum.course?.course_name // Frontend expects this field name
              });
            }
          });
        }
      });

      console.log(`Found ${pendingChanges.length} pending changes`);
      return { success: true, data: pendingChanges };
      
    } catch (error: any) {
      console.error('Error fetching university pending changes:', error);
      return { success: false, error: error.message };
    }
  }
}

export const curriculumChangeRequestService = new CurriculumChangeRequestService();
