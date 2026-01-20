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
      console.log('🔍 Starting approval process:', {
        curriculumId,
        changeId,
        reviewNotes
      });

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Authentication failed:', authError);
        return { 
          success: false, 
          error: 'Authentication required. Please refresh the page and try again.' 
        };
      }

      console.log('✅ User authenticated:', user.email);

      // Get curriculum with pending changes
      const { data: curriculum, error: fetchError } = await supabase
        .from('college_curriculums')
        .select('pending_changes, change_history, status')
        .eq('id', curriculumId)
        .single();

      if (fetchError) {
        console.error('❌ Failed to fetch curriculum:', fetchError);
        return { success: false, error: 'Curriculum not found' };
      }

      console.log('📋 Curriculum fetched:', {
        status: curriculum.status,
        pendingChangesCount: curriculum.pending_changes?.length || 0
      });

      const pendingChanges = curriculum.pending_changes || [];
      const changeIndex = pendingChanges.findIndex((change: any) => change.id === changeId);

      if (changeIndex === -1) {
        console.error('❌ Change not found in pending changes:', {
          changeId,
          availableChanges: pendingChanges.map((c: any) => c.id)
        });
        return { success: false, error: 'Change request not found' };
      }

      const change = pendingChanges[changeIndex];
      console.log('📝 Found change to approve:', {
        changeType: change.change_type,
        entityId: change.entity_id,
        requestedBy: change.requester_name
      });

      // Apply the change based on type
      console.log('🔧 Applying change to database...');
      const applyResult = await this.applyChange(curriculumId, change, user.id);
      
      if (!applyResult.success) {
        console.error('❌ Failed to apply change:', applyResult.error);
        return applyResult;
      }

      console.log('✅ Change applied successfully to database');

      // Remove from pending changes
      const updatedPendingChanges = pendingChanges.filter((_: any, index: number) => index !== changeIndex);
      console.log('📊 Updated pending changes count:', updatedPendingChanges.length);

      // Add to change history
      const currentChangeHistory = curriculum.change_history || [];
      const historyEntry = {
        id: changeId,
        action: 'change_approved',
        change_type: change.change_type,
        request_timestamp: new Date().toISOString(),
        approval_timestamp: new Date().toISOString(),
        user_id: user.id,
        user_name: 'University Admin',
        review_notes: reviewNotes,
        applied: true,
        original_change: change // Store the original change for audit trail
      };
      const updatedChangeHistory = [...currentChangeHistory, historyEntry];

      // Update curriculum with new pending changes and history
      console.log('💾 Updating curriculum record...');
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
        console.error('❌ Failed to update curriculum record:', updateError);
        return { success: false, error: 'Failed to update curriculum: ' + updateError.message };
      }

      console.log('🎉 Approval process completed successfully');

      // Send notification to college admin about approval
      try {
        console.log('📧 Sending approval notification...');
        
        // Get curriculum details for notification
        const { data: curriculumDetails, error: detailsError } = await supabase
          .from('college_curriculums')
          .select(`
            course:college_courses!college_curriculums_course_id_fkey(course_name),
            departments(name),
            college_id
          `)
          .eq('id', curriculumId)
          .single();

        if (!detailsError && curriculumDetails) {
          // Get college admin who requested the change
          const { data: collegeAdmins, error: adminsError } = await supabase
            .from('users')
            .select('id, email, firstName, lastName')
            .eq('organizationId', curriculumDetails.college_id)
            .eq('role', 'college_admin');

          if (!adminsError && collegeAdmins && collegeAdmins.length > 0) {
            const courseName = curriculumDetails.course?.course_name || 'Unknown Course';
            const departmentName = curriculumDetails.departments?.name || 'Unknown Department';
            const changeTypeLabel = change.change_type === 'outcome_add' ? 'Learning Outcome Addition' :
                                  change.change_type === 'outcome_edit' ? 'Learning Outcome Edit' :
                                  change.change_type === 'unit_add' ? 'Unit Addition' :
                                  change.change_type === 'unit_edit' ? 'Unit Edit' :
                                  'Curriculum Change';

            const notificationTitle = `${changeTypeLabel} Approved`;
            const notificationMessage = `Your ${changeTypeLabel.toLowerCase()} for ${courseName} (${departmentName}) has been approved by the university admin and is now live.`;

            // Send to the original requester if they're still a college admin
            const originalRequester = collegeAdmins.find(admin => admin.id === change.requested_by);
            if (originalRequester) {
              await AdminNotificationService.createNotification(
                originalRequester.id,
                'change_approved',
                notificationTitle,
                notificationMessage
              );
              console.log('✅ Approval notification sent to:', originalRequester.email);
            }
          }
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send approval notification:', notificationError);
        // Don't fail the entire operation if notification fails
      }

      return { success: true };
    } catch (error: any) {
      console.error('💥 Error in approvePendingChange fallback:', error);
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
      console.log('🚫 Starting rejection process:', {
        curriculumId,
        changeId,
        reviewNotes
      });

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Authentication failed:', authError);
        return { 
          success: false, 
          error: 'Authentication required. Please refresh the page and try again.' 
        };
      }

      console.log('✅ User authenticated:', user.email);

      // Get curriculum with pending changes
      const { data: curriculum, error: fetchError } = await supabase
        .from('college_curriculums')
        .select('pending_changes, change_history')
        .eq('id', curriculumId)
        .single();

      if (fetchError) {
        console.error('❌ Failed to fetch curriculum:', fetchError);
        return { success: false, error: 'Curriculum not found' };
      }

      const pendingChanges = curriculum.pending_changes || [];
      const changeIndex = pendingChanges.findIndex((change: any) => change.id === changeId);

      if (changeIndex === -1) {
        console.error('❌ Change not found in pending changes:', {
          changeId,
          availableChanges: pendingChanges.map((c: any) => c.id)
        });
        return { success: false, error: 'Change request not found' };
      }

      const change = pendingChanges[changeIndex];
      console.log('📝 Found change to reject:', {
        changeType: change.change_type,
        entityId: change.entity_id,
        requestedBy: change.requester_name
      });

      // Remove from pending changes
      const updatedPendingChanges = pendingChanges.filter((_: any, index: number) => index !== changeIndex);
      console.log('📊 Updated pending changes count:', updatedPendingChanges.length);

      // Add to change history
      const currentChangeHistory = curriculum.change_history || [];
      const historyEntry = {
        id: changeId,
        action: 'change_rejected',
        change_type: change.change_type,
        request_timestamp: new Date().toISOString(),
        rejection_timestamp: new Date().toISOString(),
        user_id: user.id,
        user_name: 'University Admin',
        review_notes: reviewNotes,
        applied: false,
        original_change: change // Store the original change for audit trail
      };
      const updatedChangeHistory = [...currentChangeHistory, historyEntry];

      // Update curriculum
      console.log('💾 Updating curriculum record...');
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
        console.error('❌ Failed to update curriculum record:', updateError);
        return { success: false, error: 'Failed to update curriculum: ' + updateError.message };
      }

      console.log('🎉 Rejection process completed successfully');

      // Send notification to college admin about rejection
      try {
        console.log('📧 Sending rejection notification...');
        
        // Get curriculum details for notification
        const { data: curriculumDetails, error: detailsError } = await supabase
          .from('college_curriculums')
          .select(`
            course:college_courses!college_curriculums_course_id_fkey(course_name),
            departments(name),
            college_id
          `)
          .eq('id', curriculumId)
          .single();

        if (!detailsError && curriculumDetails) {
          // Get college admin who requested the change
          const { data: collegeAdmins, error: adminsError } = await supabase
            .from('users')
            .select('id, email, firstName, lastName')
            .eq('organizationId', curriculumDetails.college_id)
            .eq('role', 'college_admin');

          if (!adminsError && collegeAdmins && collegeAdmins.length > 0) {
            const courseName = curriculumDetails.course?.course_name || 'Unknown Course';
            const departmentName = curriculumDetails.departments?.name || 'Unknown Department';
            const changeTypeLabel = change.change_type === 'outcome_add' ? 'Learning Outcome Addition' :
                                  change.change_type === 'outcome_edit' ? 'Learning Outcome Edit' :
                                  change.change_type === 'unit_add' ? 'Unit Addition' :
                                  change.change_type === 'unit_edit' ? 'Unit Edit' :
                                  'Curriculum Change';

            const notificationTitle = `${changeTypeLabel} Rejected`;
            const notificationMessage = `Your ${changeTypeLabel.toLowerCase()} for ${courseName} (${departmentName}) has been rejected. Feedback: ${reviewNotes || 'No specific feedback provided.'}`;

            // Send to the original requester if they're still a college admin
            const originalRequester = collegeAdmins.find(admin => admin.id === change.requested_by);
            if (originalRequester) {
              await AdminNotificationService.createNotification(
                originalRequester.id,
                'change_rejected',
                notificationTitle,
                notificationMessage
              );
              console.log('✅ Rejection notification sent to:', originalRequester.email);
            }
          }
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send rejection notification:', notificationError);
        // Don't fail the entire operation if notification fails
      }

      return { success: true };
    } catch (error: any) {
      console.error('💥 Error in rejectPendingChange fallback:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Apply the actual change to the database tables
   */
  private async applyChange(curriculumId: string, change: any, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const changeType = change.change_type;
      
      console.log('🔧 Applying change:', {
        changeType,
        changeId: change.id,
        entityId: change.entity_id,
        changeData: change.data
      });

      // Extract change data with multiple fallback paths
      let changeData = change.data;
      
      // Handle nested data structures
      if (changeData?.data) {
        changeData = changeData.data;
      }

      if (changeType === 'outcome_add') {
        // Extract outcome data with multiple field name variations
        const unitId = changeData.unitId || changeData.unit_id;
        const outcomeText = changeData.outcome || changeData.outcome_text || changeData.outcomeText;
        const bloomLevel = changeData.bloomLevel || changeData.bloom_level || 'Apply';
        const assessmentMappings = changeData.assessmentMappings || changeData.assessment_mappings || [];

        console.log('📝 Adding outcome:', {
          unitId,
          outcomeText,
          bloomLevel,
          assessmentMappings
        });

        if (!unitId) {
          console.error('❌ Missing unit ID in outcome add data:', changeData);
          return { success: false, error: 'Unit ID is required but not found in change data' };
        }

        if (!outcomeText) {
          console.error('❌ Missing outcome text in outcome add data:', changeData);
          return { success: false, error: 'Outcome text is required but not found in change data' };
        }

        const { data: insertedOutcome, error } = await supabase
          .from('college_curriculum_outcomes')
          .insert({
            curriculum_id: curriculumId,
            unit_id: unitId,
            outcome_text: outcomeText,
            bloom_level: bloomLevel,
            assessment_mappings: assessmentMappings,
            created_by: userId,
            updated_by: userId
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Failed to add outcome:', error);
          return { success: false, error: 'Failed to add outcome: ' + error.message };
        }

        console.log('✅ Outcome added successfully:', insertedOutcome?.id);

      } else if (changeType === 'unit_add') {
        // Extract unit data with multiple field name variations
        const name = changeData.name;
        const code = changeData.code;
        const description = changeData.description || '';
        const credits = changeData.credits;
        const estimatedDuration = changeData.estimatedDuration || changeData.estimated_duration;
        const durationUnit = changeData.durationUnit || changeData.duration_unit || 'hours';

        console.log('📚 Adding unit:', {
          name,
          code,
          description,
          credits,
          estimatedDuration,
          durationUnit
        });

        if (!name) {
          console.error('❌ Missing unit name in unit add data:', changeData);
          return { success: false, error: 'Unit name is required but not found in change data' };
        }

        if (!code) {
          console.error('❌ Missing unit code in unit add data:', changeData);
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
          console.error('❌ Failed to check existing units:', orderError);
          return { success: false, error: 'Failed to check existing units: ' + orderError.message };
        }

        const nextOrderIndex = existingUnits && existingUnits.length > 0 
          ? (existingUnits[0].order_index || 0) + 1 
          : 1;

        const { data: insertedUnit, error } = await supabase
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
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Failed to add unit:', error);
          return { success: false, error: 'Failed to add unit: ' + error.message };
        }

        console.log('✅ Unit added successfully:', insertedUnit?.id);

      } else if (changeType === 'outcome_edit') {
        // For edit operations, extract the 'after' data which contains the new values
        let afterData = changeData.after || changeData;
        
        // Handle nested after data
        if (afterData?.data) {
          afterData = afterData.data;
        }

        console.log('✏️ Editing outcome:', {
          entityId: change.entity_id,
          beforeData: changeData.before,
          afterData: afterData
        });

        if (!change.entity_id) {
          console.error('❌ Missing entity ID for outcome edit');
          return { success: false, error: 'Entity ID is required for outcome edit' };
        }

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
        } else if (afterData.outcomeText !== undefined) {
          updateData.outcome_text = afterData.outcomeText;
        }

        // Update bloom level if provided
        if (afterData.bloom_level !== undefined) {
          updateData.bloom_level = afterData.bloom_level;
        } else if (afterData.bloomLevel !== undefined) {
          updateData.bloom_level = afterData.bloomLevel;
        }

        // Update assessment mappings if provided - CRITICAL FIX
        if (afterData.assessment_mappings !== undefined) {
          updateData.assessment_mappings = afterData.assessment_mappings;
        } else if (afterData.assessmentMappings !== undefined) {
          updateData.assessment_mappings = afterData.assessmentMappings;
        }

        console.log('📊 Updating outcome with data:', updateData);

        const { data: updatedOutcome, error } = await supabase
          .from('college_curriculum_outcomes')
          .update(updateData)
          .eq('id', change.entity_id)
          .select()
          .single();

        if (error) {
          console.error('❌ Failed to update outcome:', error);
          return { success: false, error: 'Failed to update outcome: ' + error.message };
        }

        console.log('✅ Outcome updated successfully:', updatedOutcome?.id);

      } else if (changeType === 'unit_edit') {
        // For unit edit, extract the 'after' data
        let afterData = changeData.after || changeData;
        
        // Handle nested after data
        if (afterData?.data) {
          afterData = afterData.data;
        }

        console.log('✏️ Editing unit:', {
          entityId: change.entity_id,
          beforeData: changeData.before,
          afterData: afterData
        });

        if (!change.entity_id) {
          console.error('❌ Missing entity ID for unit edit');
          return { success: false, error: 'Entity ID is required for unit edit' };
        }

        // Build update object
        const updateData: any = {
          updated_by: userId,
          updated_at: new Date().toISOString()
        };

        // Update fields if provided
        if (afterData.name !== undefined) updateData.name = afterData.name;
        if (afterData.code !== undefined) updateData.code = afterData.code;
        if (afterData.description !== undefined) updateData.description = afterData.description;
        if (afterData.credits !== undefined) updateData.credits = afterData.credits;
        if (afterData.estimated_duration !== undefined) updateData.estimated_duration = afterData.estimated_duration;
        if (afterData.estimatedDuration !== undefined) updateData.estimated_duration = afterData.estimatedDuration;
        if (afterData.duration_unit !== undefined) updateData.duration_unit = afterData.duration_unit;
        if (afterData.durationUnit !== undefined) updateData.duration_unit = afterData.durationUnit;
        if (afterData.order_index !== undefined) updateData.order_index = afterData.order_index;
        if (afterData.orderIndex !== undefined) updateData.order_index = afterData.orderIndex;

        console.log('📚 Updating unit with data:', updateData);

        const { data: updatedUnit, error } = await supabase
          .from('college_curriculum_units')
          .update(updateData)
          .eq('id', change.entity_id)
          .select()
          .single();

        if (error) {
          console.error('❌ Failed to update unit:', error);
          return { success: false, error: 'Failed to update unit: ' + error.message };
        }

        console.log('✅ Unit updated successfully:', updatedUnit?.id);

      } else if (changeType === 'outcome_delete') {
        console.log('🗑️ Deleting outcome:', change.entity_id);

        if (!change.entity_id) {
          console.error('❌ Missing entity ID for outcome delete');
          return { success: false, error: 'Entity ID is required for outcome delete' };
        }

        const { error } = await supabase
          .from('college_curriculum_outcomes')
          .delete()
          .eq('id', change.entity_id);

        if (error) {
          console.error('❌ Failed to delete outcome:', error);
          return { success: false, error: 'Failed to delete outcome: ' + error.message };
        }

        console.log('✅ Outcome deleted successfully');

      } else if (changeType === 'unit_delete') {
        console.log('🗑️ Deleting unit:', change.entity_id);

        if (!change.entity_id) {
          console.error('❌ Missing entity ID for unit delete');
          return { success: false, error: 'Entity ID is required for unit delete' };
        }

        // First delete all outcomes in this unit
        const { error: outcomeDeleteError } = await supabase
          .from('college_curriculum_outcomes')
          .delete()
          .eq('unit_id', change.entity_id);

        if (outcomeDeleteError) {
          console.error('❌ Failed to delete unit outcomes:', outcomeDeleteError);
          return { success: false, error: 'Failed to delete unit outcomes: ' + outcomeDeleteError.message };
        }

        // Then delete the unit
        const { error } = await supabase
          .from('college_curriculum_units')
          .delete()
          .eq('id', change.entity_id);

        if (error) {
          console.error('❌ Failed to delete unit:', error);
          return { success: false, error: 'Failed to delete unit: ' + error.message };
        }

        console.log('✅ Unit and its outcomes deleted successfully');

      } else if (changeType === 'curriculum_edit') {
        // Handle curriculum-level edits
        let afterData = changeData.after || changeData;
        
        console.log('📋 Editing curriculum:', {
          curriculumId,
          beforeData: changeData.before,
          afterData: afterData
        });

        // Build update object for curriculum
        const updateData: any = {
          updated_by: userId,
          updated_at: new Date().toISOString()
        };

        // Update curriculum fields if provided
        if (afterData.academic_year !== undefined) updateData.academic_year = afterData.academic_year;
        if (afterData.semester !== undefined) updateData.semester = afterData.semester;
        if (afterData.description !== undefined) updateData.description = afterData.description;

        console.log('📋 Updating curriculum with data:', updateData);

        const { data: updatedCurriculum, error } = await supabase
          .from('college_curriculums')
          .update(updateData)
          .eq('id', curriculumId)
          .select()
          .single();

        if (error) {
          console.error('❌ Failed to update curriculum:', error);
          return { success: false, error: 'Failed to update curriculum: ' + error.message };
        }

        console.log('✅ Curriculum updated successfully');

      } else {
        console.error('❌ Unknown change type:', changeType);
        return { success: false, error: 'Unknown change type: ' + changeType };
      }

      console.log('🎉 Change applied successfully');
      return { success: true };
    } catch (error: any) {
      console.error('💥 Error applying change:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }
}

export const curriculumChangeFallbackService = new CurriculumChangeFallbackService();