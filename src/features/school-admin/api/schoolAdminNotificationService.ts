/**
 * School Admin Notification Service
 * Handles notifications for school admins about training approvals
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('school-admin-notification');

export class SchoolAdminNotificationService {
  /**
   * Get all notifications for a school admin
   * @param {string} schoolId - School's UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of notifications
   */
  static async getSchoolAdminNotifications(schoolId, options = {}) {
    try {
      const { data, error } = await supabase.rpc('get_school_admin_notifications', {
        admin_school_id: schoolId,
        unread_only: options.unreadOnly || false
      });

      if (error) {
        logger.error('Failed to fetch school admin notifications', new Error('Failed to retrieve notifications'));
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch school admin notifications', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get unread notification count
   * @param {string} schoolId - School's UUID
   * @returns {Promise<number>} Count of unread notifications
   */
  static async getUnreadCount(schoolId) {
    try {
      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        admin_school_id: schoolId,
        admin_type: 'school_admin'
      });

      if (error) {
        logger.error('Failed to fetch unread notification count', new Error('Failed to retrieve count'));
        return 0;
      }

      return data || 0;
    } catch (error) {
      logger.error('Failed to fetch unread notification count', error instanceof Error ? error : new Error('Unknown error'));
      return 0;
    }
  }

  /**
   * Get pending trainings for school admin (Using database approval_authority with fallback)
   * @param {string} schoolId - School's UUID
   * @returns {Promise<Array>} List of pending trainings
   */
  static async getPendingTrainings(schoolId) {
    try {
      // First try: Get trainings where approval_authority = 'school_admin'
      const { data, error } = await supabase
        .from('trainings')
        .select(`
          *,
          student:students!trainings_student_id_fkey (
            id,
            name,
            email,
            student_type,
            school_id,
            university_college_id
          )
        `)
        .eq('approval_status', 'pending')
        .eq('approval_authority', 'school_admin')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch pending trainings', new Error('Failed to retrieve trainings'));
        throw error;
      }

      // Filter by school_id to ensure security
      const filteredTrainings = (data || []).filter(training => {
        const studentSchoolId = training.student?.school_id;
        return studentSchoolId === schoolId;
      });

      // FALLBACK: If no trainings found, check for Rareminds trainings that should be school_admin
      if (filteredTrainings.length === 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('trainings')
          .select(`
            *,
            student:students!trainings_student_id_fkey (
              id,
              name,
              email,
              student_type,
              school_id,
              university_college_id
            )
          `)
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false });

        if (fallbackError) {
          logger.error('Failed to fetch trainings (fallback query)', new Error('Failed to retrieve trainings'));
          throw fallbackError;
        }

        // Manual filtering for Rareminds trainings from school students
        const fallbackTrainings = (fallbackData || []).filter(training => {
          const provider = (training.organization || '').toLowerCase();
          const studentSchoolId = training.student?.school_id;
          const studentType = training.student?.student_type;

          // Show Rareminds trainings from non-college students in this school
          return provider === 'rareminds' &&
                 studentSchoolId === schoolId &&
                 studentType !== 'college_student';
        });

        if (fallbackTrainings.length > 0) {
          // Format fallback trainings
          const formattedFallback = fallbackTrainings.map(training => ({
            ...training,
            student_name: training.student?.name || 'Unknown Student',
            student_email: training.student?.email || 'No email',
            student_school_id: training.student?.school_id,
            student_college_id: training.student?.university_college_id,
            _needsApprovalAuthorityFix: true
          }));

          return formattedFallback;
        }
      }

      // Format for UI
      const formattedTrainings = filteredTrainings.map(training => ({
        ...training,
        student_name: training.student?.name || 'Unknown Student',
        student_email: training.student?.email || 'No email',
        student_school_id: training.student?.school_id,
        student_college_id: training.student?.university_college_id
      }));

      return formattedTrainings;
    } catch (error) {
      logger.error('Failed to fetch pending trainings', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get pending experiences for school admin (Using database approval_authority)
   * @param {string} schoolId - School's UUID
   * @returns {Promise<Array>} List of pending experiences
   */
  static async getPendingExperiences(schoolId) {
    try {
      // Get experiences where approval_authority = 'school_admin' and student belongs to this school
      const { data, error } = await supabase
        .from('experience')
        .select(`
          *,
          student:students!experience_student_id_fkey (
            id,
            name,
            email,
            student_type,
            school_id,
            university_college_id
          )
        `)
        .eq('approval_status', 'pending')
        .eq('approval_authority', 'school_admin')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch pending experiences', new Error('Failed to retrieve experiences'));
        throw error;
      }

      // Filter by school_id to ensure security
      const filteredExperiences = (data || []).filter(experience => {
        const studentSchoolId = experience.student?.school_id;
        return studentSchoolId === schoolId;
      });

      // Format for UI
      const formattedExperiences = filteredExperiences.map(experience => ({
        ...experience,
        student_name: experience.student?.name || 'Unknown Student',
        student_email: experience.student?.email || 'No email',
        student_school_id: experience.student?.school_id,
        student_college_id: experience.student?.university_college_id,
        student_type: experience.student?.student_type
      }));

      return formattedExperiences;
    } catch (error) {
      logger.error('Failed to fetch pending experiences', error instanceof Error ? error : new Error('Unknown error'));
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
        notification_id: notificationId
      });

      if (error) {
        logger.error('Failed to mark notification as read', new Error('Failed to update notification'));
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to mark notification as read', error instanceof Error ? error : new Error('Unknown error'));
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
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingId)
        .eq('approval_status', 'pending')
        .select()
        .single();

      if (error) {
        logger.error('Failed to approve training', new Error('Failed to update training approval status'));
        throw new Error(error.message || 'Failed to approve training');
      }

      if (!data) {
        throw new Error('Training not found or already processed');
      }

      return {
        success: true,
        message: 'Training approved successfully',
        training_id: trainingId
      };
    } catch (error) {
      logger.error('Failed to approve training', error instanceof Error ? error : new Error('Unknown error'));
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
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingId)
        .eq('approval_status', 'pending')
        .select()
        .single();

      if (error) {
        logger.error('Failed to reject training', new Error('Failed to update training rejection status'));
        throw new Error(error.message || 'Failed to reject training');
      }

      if (!data) {
        throw new Error('Training not found or already processed');
      }

      return {
        success: true,
        message: 'Training rejected successfully',
        training_id: trainingId,
        reason: notes
      };
    } catch (error) {
      logger.error('Failed to reject training', error instanceof Error ? error : new Error('Unknown error'));
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
          updated_at: new Date().toISOString()
        })
        .eq('id', experienceId)
        .eq('approval_status', 'pending')
        .select()
        .single();

      if (error) {
        logger.error('Failed to approve experience', new Error('Failed to update experience approval status'));
        throw new Error(error.message || 'Failed to approve experience');
      }

      if (!data) {
        throw new Error('Experience not found or already processed');
      }

      return {
        success: true,
        message: 'Experience approved successfully',
        experience_id: experienceId
      };
    } catch (error) {
      logger.error('Failed to approve experience', error instanceof Error ? error : new Error('Unknown error'));
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
        notes: notes
      });

      if (error) {
        logger.error('Failed to reject experience', new Error('Failed to update experience rejection status'));
        throw new Error(error.message || 'Failed to reject experience');
      }

      // The function returns a JSON object, data should contain the result
      const result = data;

      if (!result || !result.success) {
        const errorMessage = result?.error || 'Unknown error occurred';
        logger.error('Failed to reject experience', new Error('Experience rejection failed'));
        throw new Error(errorMessage);
      }

      return result;
    } catch (error) {
      logger.error('Failed to reject experience', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get pending projects for school admin (Using database approval_authority with fallback)
   * @param {string} schoolId - School's UUID
   * @returns {Promise<Array>} List of pending projects
   */
  static async getPendingProjects(schoolId) {
    try {
      // First try: Get projects where approval_authority = 'school_admin'
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          student:students!projects_student_id_fkey (
            id,
            name,
            email,
            student_type,
            school_id,
            university_college_id
          )
        `)
        .eq('approval_status', 'pending')
        .eq('approval_authority', 'school_admin')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch pending projects', new Error('Failed to retrieve projects'));
        throw error;
      }

      // Filter by school_id to ensure security
      const filteredProjects = (data || []).filter(project => {
        const studentSchoolId = project.student?.school_id;
        return studentSchoolId === schoolId;
      });

      // FALLBACK: If no projects found, check for projects that should be school_admin
      if (filteredProjects.length === 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('projects')
          .select(`
            *,
            student:students!projects_student_id_fkey (
              id,
              name,
              email,
              student_type,
              school_id,
              university_college_id
            )
          `)
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false });

        if (fallbackError) {
          logger.error('Failed to fetch projects (fallback query)', new Error('Failed to retrieve projects'));
          throw fallbackError;
        }

        // Manual filtering for projects from school students
        const fallbackProjects = (fallbackData || []).filter(project => {
          const studentSchoolId = project.student?.school_id;
          const studentType = project.student?.student_type;

          // Show projects from non-college students in this school
          return studentSchoolId === schoolId &&
                 studentType !== 'college_student';
        });

        if (fallbackProjects.length > 0) {
          // Format fallback projects
          const formattedFallback = fallbackProjects.map(project => ({
            ...project,
            student_name: project.student?.name || 'Unknown Student',
            student_email: project.student?.email || 'No email',
            student_school_id: project.student?.school_id,
            student_college_id: project.student?.university_college_id,
            _needsApprovalAuthorityFix: true
          }));

          return formattedFallback;
        }
      }

      // Format for UI
      const formattedProjects = filteredProjects.map(project => ({
        ...project,
        student_name: project.student?.name || 'Unknown Student',
        student_email: project.student?.email || 'No email',
        student_school_id: project.student?.school_id,
        student_college_id: project.student?.university_college_id
      }));

      return formattedProjects;
    } catch (error) {
      logger.error('Failed to fetch pending projects', error instanceof Error ? error : new Error('Unknown error'));
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
      // Validate inputs
      if (!projectId || projectId === 'undefined') {
        throw new Error('Invalid project ID');
      }
      if (!approverId || approverId === 'undefined') {
        throw new Error('Invalid approver ID - user not authenticated');
      }

      // Direct database update since approve_project function doesn't exist
      const { data, error } = await supabase
        .from('projects')
        .update({
          approval_status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          approval_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('approval_status', 'pending')
        .select()
        .single();

      if (error) {
        logger.error('Failed to approve project', new Error('Failed to update project approval status'));
        throw new Error(error.message || 'Failed to approve project');
      }

      if (!data) {
        throw new Error('Project not found or already processed');
      }

      return {
        success: true,
        message: 'Project approved successfully',
        project_id: projectId
      };
    } catch (error) {
      logger.error('Failed to approve project', error instanceof Error ? error : new Error('Unknown error'));
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

      // Validate inputs
      if (!projectId || projectId === 'undefined') {
        throw new Error('Invalid project ID');
      }
      if (!rejectorId || rejectorId === 'undefined') {
        throw new Error('Invalid rejector ID - user not authenticated');
      }

      // Direct database update since reject_project function doesn't exist
      const { data, error } = await supabase
        .from('projects')
        .update({
          approval_status: 'rejected',
          rejected_by: rejectorId,
          rejected_at: new Date().toISOString(),
          approval_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('approval_status', 'pending')
        .select()
        .single();

      if (error) {
        logger.error('Failed to reject project', new Error('Failed to update project rejection status'));
        throw new Error(error.message || 'Failed to reject project');
      }

      if (!data) {
        throw new Error('Project not found or already processed');
      }

      return {
        success: true,
        message: 'Project rejected successfully',
        project_id: projectId,
        reason: notes
      };
    } catch (error) {
      logger.error('Failed to reject project', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Subscribe to real-time notifications (unified system)
   * @param {string} schoolId - School's UUID
   * @param {Function} callback - Callback function for new notifications
   * @returns {Object} Subscription object
   */
  static subscribeToNotifications(schoolId, callback) {
    const subscription = supabase
      .channel('unified_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'training_notifications',
        filter: `school_id=eq.${schoolId}`
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();

    return subscription;
  }
}