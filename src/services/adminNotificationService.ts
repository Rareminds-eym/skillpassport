/**
 * Admin Notification Service
 * Creates notifications for admin users when activities require approval
 */

import { supabase } from '../lib/supabaseClient';
import { AdminNotificationType } from '../hooks/useAdminNotifications';

export class AdminNotificationService {
  /**
   * Create a notification for admin users
   * @param recipientId - Admin user ID
   * @param type - Notification type
   * @param title - Notification title
   * @param message - Notification message
   */
  static async createNotification(
    recipientId: string,
    type: AdminNotificationType,
    title: string,
    message: string
  ) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: recipientId,
          type,
          title,
          message,
          read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating admin notification:', error);
        throw error;
      }

      console.log('✅ Admin notification created:', data);
      return data;
    } catch (error) {
      console.error('Failed to create admin notification:', error);
      throw error;
    }
  }

  /**
   * Create training submission notification for school admin
   */
  static async notifyTrainingSubmission(
    schoolId: string,
    studentName: string,
    trainingTitle: string,
    trainingId: string
  ) {
    try {
      // Get school admin user ID
      const { data: schoolAdmin } = await supabase
        .from('school_educators')
        .select('user_id')
        .eq('school_id', schoolId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!schoolAdmin?.user_id) {
        console.log('No school admin found for school:', schoolId);
        return;
      }

      await this.createNotification(
        schoolAdmin.user_id,
        'training_submitted',
        'New Training Submitted',
        `${studentName} submitted "${trainingTitle}" for approval`
      );
    } catch (error) {
      console.error('Failed to notify training submission:', error);
    }
  }

  /**
   * Create experience submission notification for school admin
   */
  static async notifyExperienceSubmission(
    schoolId: string,
    studentName: string,
    experienceTitle: string,
    experienceId: string
  ) {
    try {
      // Get school admin user ID
      const { data: schoolAdmin } = await supabase
        .from('school_educators')
        .select('user_id')
        .eq('school_id', schoolId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!schoolAdmin?.user_id) {
        console.log('No school admin found for school:', schoolId);
        return;
      }

      await this.createNotification(
        schoolAdmin.user_id,
        'experience_submitted',
        'New Experience Submitted',
        `${studentName} submitted "${experienceTitle}" for approval`
      );
    } catch (error) {
      console.error('Failed to notify experience submission:', error);
    }
  }

  /**
   * Create project submission notification for school admin
   */
  static async notifyProjectSubmission(
    schoolId: string,
    studentName: string,
    projectTitle: string,
    projectId: string
  ) {
    try {
      // Get school admin user ID
      const { data: schoolAdmin } = await supabase
        .from('school_educators')
        .select('user_id')
        .eq('school_id', schoolId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!schoolAdmin?.user_id) {
        console.log('No school admin found for school:', schoolId);
        return;
      }

      await this.createNotification(
        schoolAdmin.user_id,
        'project_submitted',
        'New Project Submitted',
        `${studentName} submitted "${projectTitle}" for approval`
      );
    } catch (error) {
      console.error('Failed to notify project submission:', error);
    }
  }

  /**
   * Create college admin notifications
   */
  static async notifyCollegeAdmin(
    collegeId: string,
    type: AdminNotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ) {
    try {
      // Get college admin user ID
      const { data: collegeAdmin } = await supabase
        .from('users')
        .select('id')
        .eq('organizationId', collegeId)
        .eq('role', 'college_admin')
        .maybeSingle();

      if (!collegeAdmin?.id) {
        console.log('No college admin found for college:', collegeId);
        return;
      }

      await this.createNotification(collegeAdmin.id, type, title, message);
    } catch (error) {
      console.error('Failed to notify college admin:', error);
    }
  }

  /**
   * Create approval status notifications for students
   */
  static async notifyApprovalStatus(
    studentId: string,
    type:
      | 'training_approved'
      | 'training_rejected'
      | 'experience_approved'
      | 'experience_rejected'
      | 'project_approved'
      | 'project_rejected',
    itemTitle: string,
    itemId: string,
    notes?: string
  ) {
    try {
      // Get student user ID
      const { data: student } = await supabase
        .from('students')
        .select('user_id, name')
        .eq('id', studentId)
        .maybeSingle();

      if (!student?.user_id) {
        console.log('No user ID found for student:', studentId);
        return;
      }

      const isApproved = type.includes('approved');
      const itemType = type.includes('training')
        ? 'training'
        : type.includes('experience')
          ? 'experience'
          : 'project';

      const title = isApproved
        ? `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Approved`
        : `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Rejected`;

      const message = isApproved
        ? `Your ${itemType} "${itemTitle}" has been approved`
        : `Your ${itemType} "${itemTitle}" was rejected${notes ? `: ${notes}` : ''}`;

      await this.createNotification(student.user_id, type, title, message);
    } catch (error) {
      console.error('Failed to notify approval status:', error);
    }
  }

  /**
   * Create system alert for all admins
   */
  static async createSystemAlert(
    title: string,
    message: string,
    adminType?: 'school_admin' | 'college_admin' | 'university_admin'
  ) {
    try {
      const adminUsers: any[] = [];

      if (!adminType || adminType === 'school_admin') {
        const { data: schoolAdmins } = await supabase
          .from('school_educators')
          .select('user_id')
          .eq('role', 'admin');
        if (schoolAdmins) adminUsers.push(...schoolAdmins);
      }

      if (!adminType || adminType === 'college_admin') {
        const { data: collegeAdmins } = await supabase
          .from('users')
          .select('id as user_id')
          .eq('role', 'college_admin');
        if (collegeAdmins) adminUsers.push(...collegeAdmins);
      }

      if (!adminType || adminType === 'university_admin') {
        const { data: universityAdmins } = await supabase
          .from('users')
          .select('id as user_id')
          .eq('role', 'university_admin');
        if (universityAdmins) adminUsers.push(...universityAdmins);
      }

      // Create notifications for all admin users
      const notifications = adminUsers.map((admin) => ({
        recipient_id: admin.user_id,
        type: 'system_alert' as AdminNotificationType,
        title,
        message,
        read: false,
      }));

      if (notifications.length > 0) {
        const { error } = await supabase.from('notifications').insert(notifications);

        if (error) {
          console.error('Error creating system alerts:', error);
          throw error;
        }

        console.log(`✅ System alert sent to ${notifications.length} admins`);
      }
    } catch (error) {
      console.error('Failed to create system alert:', error);
    }
  }
}
