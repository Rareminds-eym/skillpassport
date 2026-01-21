/**
 * College Admin Notification Service
 * Handles notifications for college admins about training approvals
 */

import { supabase } from '../lib/supabaseClient';

export class CollegeAdminNotificationService {
  /**
   * Get all notifications for a college admin
   * @param {string} collegeId - College's UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of notifications
   */
  static async getCollegeAdminNotifications(collegeId, options = {}) {
    try {
      const { data, error } = await supabase.rpc('get_college_admin_notifications', {
        admin_college_id: collegeId,
        unread_only: options.unreadOnly || false,
      });

      if (error) {
        console.error('Error fetching college admin notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching college admin notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   * @param {string} collegeId - College's UUID
   * @returns {Promise<number>} Count of unread notifications
   */
  static async getUnreadCount(collegeId) {
    try {
      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        admin_college_id: collegeId,
        admin_type: 'college_admin',
      });

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Get pending trainings for college admin (Using database approval_authority)
   * @param {string} collegeId - College's UUID
   * @returns {Promise<Array>} List of pending trainings
   */
  static async getPendingTrainings(collegeId) {
    try {
      console.log('🎓 Fetching trainings for college admin using approval_authority:', collegeId);

      // Get trainings where approval_authority = 'college_admin' and student belongs to this college
      const { data, error } = await supabase
        .from('trainings')
        .select(
          `
          *,
          student:students!trainings_student_id_fkey (
            id,
            name,
            email,
            student_type,
            school_id,
            university_college_id,
            college_school_name
          )
        `
        )
        .eq('approval_status', 'pending')
        .eq('approval_authority', 'college_admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching trainings:', error);
        throw error;
      }

      // Filter by college_id to ensure security
      const filteredTrainings = (data || []).filter((training) => {
        const studentCollegeId = training.student?.university_college_id;
        return studentCollegeId === collegeId;
      });

      // Format for UI
      const formattedTrainings = filteredTrainings.map((training) => ({
        ...training,
        student_name: training.student?.name || 'Unknown Student',
        student_email: training.student?.email || 'No email',
        student_school_id: training.student?.school_id,
        student_college_id: training.student?.university_college_id,
      }));

      console.log('✅ Found trainings for college admin:', formattedTrainings.length);
      console.log('ℹ️ Using database approval_authority field (automatic routing)');
      return formattedTrainings;
    } catch (error) {
      console.error('❌ Error fetching pending trainings:', error);
      throw error;
    }
  }

  /**
   * Get pending experiences for college admin (Using database approval_authority)
   * @param {string} collegeId - College's UUID
   * @returns {Promise<Array>} List of pending experiences
   */
  static async getPendingExperiences(collegeId) {
    try {
      console.log('🎓 Fetching experiences for college admin using approval_authority:', collegeId);

      // Get experiences where approval_authority = 'college_admin' and student belongs to this college
      const { data, error } = await supabase
        .from('experience')
        .select(
          `
          *,
          student:students!experience_student_id_fkey (
            id,
            name,
            email,
            student_type,
            school_id,
            university_college_id,
            college_school_name
          )
        `
        )
        .eq('approval_status', 'pending')
        .eq('approval_authority', 'college_admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching experiences:', error);
        throw error;
      }

      // Filter by college_id to ensure security
      const filteredExperiences = (data || []).filter((experience) => {
        const studentCollegeId = experience.student?.university_college_id;
        return studentCollegeId === collegeId;
      });

      // Format for UI
      const formattedExperiences = filteredExperiences.map((experience) => ({
        ...experience,
        student_name: experience.student?.name || 'Unknown Student',
        student_email: experience.student?.email || 'No email',
        student_school_id: experience.student?.school_id,
        student_college_id: experience.student?.university_college_id,
        student_type: experience.student?.student_type,
      }));

      console.log('✅ Found experiences for college admin:', formattedExperiences.length);
      console.log('ℹ️ Using database approval_authority field (automatic routing)');
      return formattedExperiences;
    } catch (error) {
      console.error('❌ Error fetching pending experiences:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} Success status
   */
  static async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId,
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Approve training
   * @param {string} trainingId - Training ID
   * @param {string} approverId - Approver's user ID
   * @param {string} notes - Optional approval notes
   * @returns {Promise<Object>} Result object with success status and message
   */
  static async approveTraining(trainingId, approverId, notes = '') {
    try {
      // Direct database update since approve_training function doesn't exist
      const { data, error } = await supabase
        .from('trainings')
        .update({
          approval_status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          approval_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trainingId)
        .eq('approval_status', 'pending')
        .select()
        .single();

      if (error) {
        console.error('Error approving training:', error);
        throw new Error(error.message || 'Failed to approve training');
      }

      if (!data) {
        throw new Error('Training not found or already processed');
      }

      return {
        success: true,
        message: 'Training approved successfully',
        training_id: trainingId,
      };
    } catch (error) {
      console.error('Error approving training:', error);
      throw error;
    }
  }

  /**
   * Reject training
   * @param {string} trainingId - Training ID
   * @param {string} rejectorId - Rejector's user ID
   * @param {string} notes - Rejection reason
   * @returns {Promise<Object>} Result object with success status and message
   */
  static async rejectTraining(trainingId, rejectorId, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }

      // Direct database update since reject_training function doesn't exist
      const { data, error } = await supabase
        .from('trainings')
        .update({
          approval_status: 'rejected',
          rejected_by: rejectorId,
          rejected_at: new Date().toISOString(),
          approval_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trainingId)
        .eq('approval_status', 'pending')
        .select()
        .single();

      if (error) {
        console.error('Error rejecting training:', error);
        throw new Error(error.message || 'Failed to reject training');
      }

      if (!data) {
        throw new Error('Training not found or already processed');
      }

      return {
        success: true,
        message: 'Training rejected successfully',
        training_id: trainingId,
        reason: notes,
      };
    } catch (error) {
      console.error('Error rejecting training:', error);
      throw error;
    }
  }

  /**
   * Approve experience
   * @param {string} experienceId - Experience ID
   * @param {string} approverId - Approver's user ID
   * @param {string} notes - Optional approval notes
   * @returns {Promise<Object>} Result object with success status and message
   */
  static async approveExperience(experienceId, approverId, notes = '') {
    try {
      // Direct database update since approve_experience function doesn't exist
      const { data, error } = await supabase
        .from('experience')
        .update({
          approval_status: 'approved',
          verified: true,
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          approval_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', experienceId)
        .eq('approval_status', 'pending')
        .select()
        .single();

      if (error) {
        console.error('Error approving experience:', error);
        throw new Error(error.message || 'Failed to approve experience');
      }

      if (!data) {
        throw new Error('Experience not found or already processed');
      }

      return {
        success: true,
        message: 'Experience approved successfully',
        experience_id: experienceId,
      };
    } catch (error) {
      console.error('Error approving experience:', error);
      throw error;
    }
  }

  /**
   * Reject experience
   * @param {string} experienceId - Experience ID
   * @param {string} rejectorId - Rejector's user ID
   * @param {string} notes - Rejection reason
   * @returns {Promise<Object>} Result object with success status and message
   */
  static async rejectExperience(experienceId, rejectorId, notes = '') {
    try {
      const { data, error } = await supabase.rpc('reject_experience', {
        experience_id: experienceId,
        rejector_id: rejectorId,
        notes: notes,
      });

      if (error) {
        console.error('Error rejecting experience:', error);
        throw new Error(error.message || 'Failed to reject experience');
      }

      // The function returns a JSON object, data should contain the result
      const result = data;

      if (!result || !result.success) {
        const errorMessage = result?.error || 'Unknown error occurred';
        console.error('Experience rejection failed:', errorMessage);
        throw new Error(errorMessage);
      }

      return result;
    } catch (error) {
      console.error('Error rejecting experience:', error);
      throw error;
    }
  }

  /**
   * Get pending projects for college admin (Using database approval_authority)
   * @param {string} collegeId - College's UUID
   * @returns {Promise<Array>} List of pending projects
   */
  static async getPendingProjects(collegeId) {
    try {
      console.log('🎓 Fetching projects for college admin using approval_authority:', collegeId);

      // Get projects where approval_authority = 'college_admin' and student belongs to this college
      const { data, error } = await supabase
        .from('projects')
        .select(
          `
          *,
          student:students!projects_student_id_fkey (
            id,
            name,
            email,
            student_type,
            school_id,
            university_college_id,
            college_school_name
          )
        `
        )
        .eq('approval_status', 'pending')
        .eq('approval_authority', 'college_admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching projects:', error);
        throw error;
      }

      // Filter by college_id to ensure security
      const filteredProjects = (data || []).filter((project) => {
        const studentCollegeId = project.student?.university_college_id;
        return studentCollegeId === collegeId;
      });

      // Format for UI
      const formattedProjects = filteredProjects.map((project) => ({
        ...project,
        student_name: project.student?.name || 'Unknown Student',
        student_email: project.student?.email || 'No email',
        student_school_id: project.student?.school_id,
        student_college_id: project.student?.university_college_id,
      }));

      console.log('✅ Found projects for college admin:', formattedProjects.length);
      console.log('ℹ️ Using database approval_authority field (automatic routing)');
      return formattedProjects;
    } catch (error) {
      console.error('❌ Error fetching pending projects:', error);
      throw error;
    }
  }

  /**
   * Approve project
   * @param {string} projectId - Project ID
   * @param {string} approverId - Approver's user ID
   * @param {string} notes - Optional approval notes
   * @returns {Promise<Object>} Result object with success status and message
   */
  static async approveProject(projectId, approverId, notes = '') {
    try {
      // Direct database update since approve_project function doesn't exist
      const { data, error } = await supabase
        .from('projects')
        .update({
          approval_status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          approval_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('approval_status', 'pending')
        .select()
        .single();

      if (error) {
        console.error('Error approving project:', error);
        throw new Error(error.message || 'Failed to approve project');
      }

      if (!data) {
        throw new Error('Project not found or already processed');
      }

      return {
        success: true,
        message: 'Project approved successfully',
        project_id: projectId,
      };
    } catch (error) {
      console.error('Error approving project:', error);
      throw error;
    }
  }

  /**
   * Reject project
   * @param {string} projectId - Project ID
   * @param {string} rejectorId - Rejector's user ID
   * @param {string} notes - Rejection reason
   * @returns {Promise<Object>} Result object with success status and message
   */
  static async rejectProject(projectId, rejectorId, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }

      // Direct database update since reject_project function doesn't exist
      const { data, error } = await supabase
        .from('projects')
        .update({
          approval_status: 'rejected',
          rejected_by: rejectorId,
          rejected_at: new Date().toISOString(),
          approval_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('approval_status', 'pending')
        .select()
        .single();

      if (error) {
        console.error('Error rejecting project:', error);
        throw new Error(error.message || 'Failed to reject project');
      }

      if (!data) {
        throw new Error('Project not found or already processed');
      }

      return {
        success: true,
        message: 'Project rejected successfully',
        project_id: projectId,
        reason: notes,
      };
    } catch (error) {
      console.error('Error rejecting project:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time notifications (unified system)
   * @param {string} collegeId - College's UUID
   * @param {Function} callback - Callback function for new notifications
   * @returns {Object} Subscription object
   */
  static subscribeToNotifications(collegeId, callback) {
    const subscription = supabase
      .channel('unified_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'training_notifications',
          filter: `college_id=eq.${collegeId}`,
        },
        (payload) => {
          const notificationType = payload.new.training_id
            ? 'training'
            : payload.new.experience_id
              ? 'experience'
              : payload.new.project_id
                ? 'project'
                : 'unknown';
          console.log(`🔔 New ${notificationType} notification received:`, payload.new);
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  }
}
