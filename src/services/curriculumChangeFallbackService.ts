/**
 * Fallback implementation for curriculum change requests
 * Uses direct database operations instead of RPC functions to avoid auth issues
 */

import { supabase } from '../lib/supabaseClient';
import { AdminNotificationService } from './adminNotificationService';

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
        .select('firstName, lastName, email')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.warn('Could not fetch user details:', userError);
      }

      // Construct full name from firstName and lastName
      const fullName = userData ? 
        `${userData.firstName || ''}${userData.lastName ? ' ' + userData.lastName : ''}`.trim() : 
        null;

      // Generate change ID
      const changeId = crypto.randomUUID();

      // Create change object
      const changeObject = {
        id: changeId,
        change_type: changeType,
        entity_id: entityId,
        request_timestamp: new Date().toISOString(),
        request_date: new Date().toISOString(),
        requested_by: user.id,
        requester_name: fullName || userData?.email || 'Unknown User',
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
        user_name: fullName || userData?.email || 'Unknown User',
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

      // Create notification for university admins
      try {
        console.log('🔔 Attempting to create notification for university admins...');
        
        // Get curriculum details for notification
        const { data: curriculumDetails, error: detailsError } = await supabase
          .from('college_curriculums')
          .select(`
            course:college_courses!college_curriculums_course_id_fkey(course_name),
            departments(name),
            university_id
          `)
          .eq('id', curriculumId)
          .single();

        if (detailsError) {
          console.error('❌ Error fetching curriculum details for notification:', detailsError);
          throw detailsError;
        }

        console.log('✅ Curriculum details fetched:', {
          university_id: curriculumDetails?.university_id,
          course_name: curriculumDetails?.course?.course_name,
          department_name: curriculumDetails?.departments?.name
        });

        if (curriculumDetails?.university_id) {
          // Get university admins
          const { data: universityAdmins, error: adminsError } = await supabase
            .from('users')
            .select('id, email, firstName, lastName')
            .eq('organizationId', curriculumDetails.university_id)
            .eq('role', 'university_admin');

          if (adminsError) {
            console.error('❌ Error fetching university admins:', adminsError);
            throw adminsError;
          }

          console.log(`✅ Found ${universityAdmins?.length || 0} university admin(s):`, 
            universityAdmins?.map(admin => admin.email));

          if (universityAdmins && universityAdmins.length > 0) {
            const courseName = curriculumDetails.course?.course_name || 'Unknown Course';
            const departmentName = curriculumDetails.departments?.name || 'Unknown Department';
            const changeTypeLabel = changeType === 'outcome_add' ? 'New Learning Outcome' :
                                  changeType === 'outcome_edit' ? 'Learning Outcome Edit' :
                                  changeType === 'unit_add' ? 'New Unit' :
                                  changeType === 'unit_edit' ? 'Unit Edit' :
                                  'Curriculum Change';

            const notificationTitle = `${changeTypeLabel} Approval Required`;
            const notificationMessage = `${fullName || 'College Admin'} has submitted a ${changeTypeLabel.toLowerCase()} for ${courseName} (${departmentName}) that requires your approval.`;

            console.log('📝 Notification details:', {
              title: notificationTitle,
              message: notificationMessage,
              type: 'approval_required',
              recipients: universityAdmins.length
            });

            // Send notification to all university admins
            let successCount = 0;
            for (const admin of universityAdmins) {
              try {
                console.log(`📤 Sending notification to: ${admin.email}`);
                
                await AdminNotificationService.createNotification(
                  admin.id,
                  'approval_required',
                  notificationTitle,
                  notificationMessage
                );

                successCount++;
                console.log(`✅ Notification sent successfully to ${admin.email}`);
              } catch (notifError) {
                console.error(`❌ Error sending notification to ${admin.email}:`, notifError);
              }
            }

            console.log(`🎉 Notifications sent to ${successCount}/${universityAdmins.length} university admin(s)`);
          } else {
            console.warn('⚠️ No university admins found for this university');
          }
        } else {
          console.warn('⚠️ No university_id found in curriculum details');
        }
      } catch (notificationError) {
        console.error('❌ Failed to send notification:', notificationError);
        // Don't fail the entire operation if notification fails
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
   * Cancel pending change using direct database operations
   */
  async cancelPendingChange(
    curriculumId: string,
    changeId: string
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

      // Remove from pending changes
      const updatedPendingChanges = pendingChanges.filter((_: any, index: number) => index !== changeIndex);

      // Add to change history
      const currentChangeHistory = curriculum.change_history || [];
      const historyEntry = {
        id: changeId,
        action: 'change_cancelled',
        change_type: change.change_type,
        request_timestamp: new Date().toISOString(),
        user_id: user.id,
        user_name: 'College Admin',
        applied: false
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
      console.error('Error in cancelPendingChange fallback:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Reject pending change using direct database operations
   */
  async rejectPendingChange(
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

      // Remove from pending changes
      const updatedPendingChanges = pendingChanges.filter((_: any, index: number) => index !== changeIndex);

      // Add to change history
      const currentChangeHistory = curriculum.change_history || [];
      const historyEntry = {
        id: changeId,
        action: 'change_rejected',
        change_type: change.change_type,
        request_timestamp: new Date().toISOString(),
        user_id: user.id,
        user_name: 'University Admin',
        review_notes: reviewNotes,
        applied: false
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
      console.error('Error in rejectPendingChange fallback:', error);
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
        // Handle the actual data structure: data.data.unitId, data.data.outcome, etc.
        const unitId = changeData.unitId || changeData.unit_id;
        const outcomeText = changeData.outcome || changeData.outcome_text;
        const bloomLevel = changeData.bloomLevel || changeData.bloom_level || 'Apply';
        const assessmentMappings = changeData.assessmentMappings || changeData.assessment_mappings || [];

        if (!unitId) {
          return { success: false, error: 'Unit ID is required but not found in change data' };
        }

        if (!outcomeText) {
          return { success: false, error: 'Outcome text is required but not found in change data' };
        }

        const { error } = await supabase
          .from('college_curriculum_outcomes')
          .insert({
            curriculum_id: curriculumId,
            unit_id: unitId,
            outcome_text: outcomeText,
            bloom_level: bloomLevel,
            assessment_mappings: assessmentMappings,
            created_by: userId,
            updated_by: userId
          });

        if (error) {
          return { success: false, error: 'Failed to add outcome: ' + error.message };
        }

      } else if (changeType === 'unit_add') {
        // Handle the actual data structure and calculate next available order
        const name = changeData.name;
        const code = changeData.code;
        const description = changeData.description || '';
        const credits = changeData.credits;
        const estimatedDuration = changeData.estimatedDuration || changeData.estimated_duration;
        const durationUnit = changeData.durationUnit || changeData.duration_unit || 'hours';

        if (!name) {
          return { success: false, error: 'Unit name is required but not found in change data' };
        }

        if (!code) {
          return { success: false, error: 'Unit code is required but not found in change data' };
        }

        // Get the next available order index
        const { data: existingUnits, error: orderError } = await supabase
          .from('college_curriculum_units')
          .select('order_index')
          .eq('curriculum_id', curriculumId)
          .order('order_index', { ascending: false })
          .limit(1);

        if (orderError) {
          return { success: false, error: 'Failed to check existing units: ' + orderError.message };
        }

        const nextOrderIndex = existingUnits && existingUnits.length > 0 
          ? (existingUnits[0].order_index || 0) + 1 
          : 1;

        const { error } = await supabase
          .from('college_curriculum_units')
          .insert({
            curriculum_id: curriculumId,
            name: name,
            code: code,
            description: description,
            credits: credits,
            estimated_duration: estimatedDuration,
            duration_unit: durationUnit,
            order_index: nextOrderIndex,
            created_by: userId,
            updated_by: userId
          });

        if (error) {
          return { success: false, error: 'Failed to add unit: ' + error.message };
        }

      } else if (changeType === 'outcome_edit') {
        // Handle outcome edit - extract data from the 'after' field for edit operations
        const afterData = change.data?.after || changeData.after || changeData;
        
        // Build update object with all possible fields
        const updateData: any = {
          updated_by: userId,
          updated_at: new Date().toISOString()
        };

        // Update outcome text if provided
        if (afterData.outcome_text !== undefined) {
          updateData.outcome_text = afterData.outcome_text;
        } else if (afterData.outcome !== undefined) {
          updateData.outcome_text = afterData.outcome;
        }

        // Update bloom level if provided
        if (afterData.bloom_level !== undefined) {
          updateData.bloom_level = afterData.bloom_level;
        } else if (afterData.bloomLevel !== undefined) {
          updateData.bloom_level = afterData.bloomLevel;
        }

        // Update assessment mappings if provided - this is the key fix
        if (afterData.assessment_mappings !== undefined) {
          updateData.assessment_mappings = afterData.assessment_mappings;
        } else if (afterData.assessmentMappings !== undefined) {
          updateData.assessment_mappings = afterData.assessmentMappings;
        }

        console.log('Updating outcome with data:', updateData);
        console.log('Entity ID:', change.entity_id);

        const { error } = await supabase
          .from('college_curriculum_outcomes')
          .update(updateData)
          .eq('id', change.entity_id);

        if (error) {
          console.error('Failed to update outcome:', error);
          return { success: false, error: 'Failed to update outcome: ' + error.message };
        }

        console.log('Outcome updated successfully');

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