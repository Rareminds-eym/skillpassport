/**
 * Admin Notification Service
 * Creates notifications for admin users when activities require approval
 */

import type { AdminNotificationType } from '../model/types';
import { getLogger } from '@/shared/config/logging';
import { apiPost } from '@/shared/api/apiClient';

const logger = getLogger('admin-notification-service');

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
      const { data } = await apiPost('/admin-notifications', { action: 'create', recipient_id: recipientId, type, title, message });

      return data;
    } catch (error) {
      logger.error('Create admin notification exception', error instanceof Error ? error : new Error(String(error)), { recipientId, type });
      throw error;
    }
  }

  /**
   * Create training submission notification for school admin
   */
  static async notifyTrainingSubmission(
    schoolId: string,
    learnerName: string,
    trainingTitle: string,
    trainingId: string
  ) {
    try {
      await apiPost('/admin-notifications', { action: 'notify-training-submission', school_id: schoolId, learner_name: learnerName, training_title: trainingTitle, training_id: trainingId });
    } catch (error) {
      logger.error('Notify training submission failed', error instanceof Error ? error : new Error(String(error)), { schoolId, trainingId });
    }
  }

  /**
   * Create experience submission notification for school admin
   */
  static async notifyExperienceSubmission(
    schoolId: string,
    learnerName: string,
    experienceTitle: string,
    experienceId: string
  ) {
    try {
      await apiPost('/admin-notifications', { action: 'notify-experience-submission', school_id: schoolId, learner_name: learnerName, experience_title: experienceTitle, experience_id: experienceId });
    } catch (error) {
      logger.error('Notify experience submission failed', error instanceof Error ? error : new Error(String(error)), { schoolId, experienceId });
    }
  }

  /**
   * Create project submission notification for school admin
   */
  static async notifyProjectSubmission(
    schoolId: string,
    learnerName: string,
    projectTitle: string,
    projectId: string
  ) {
    try {
      await apiPost('/admin-notifications', { action: 'notify-project-submission', school_id: schoolId, learner_name: learnerName, project_title: projectTitle, project_id: projectId });
    } catch (error) {
      logger.error('Notify project submission failed', error instanceof Error ? error : new Error(String(error)), { schoolId, projectId });
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
      await apiPost('/admin-notifications', { action: 'notify-college-admin', college_id: collegeId, type, title, message, metadata });
    } catch (error) {
      logger.error('Notify college admin failed', error instanceof Error ? error : new Error(String(error)), { collegeId, type });
    }
  }

  /**
   * Create approval status notifications for learners
   */
  static async notifyApprovalStatus(
    learnerId: string,
    type: 'training_approved' | 'training_rejected' | 'experience_approved' | 'experience_rejected' | 'project_approved' | 'project_rejected',
    itemTitle: string,
    itemId: string,
    notes?: string
  ) {
    try {
      await apiPost('/admin-notifications', { action: 'notify-approval-status', learner_id: learnerId, type, item_title: itemTitle, item_id: itemId, notes });
    } catch (error) {
      logger.error('Notify approval status failed', error instanceof Error ? error : new Error(String(error)), { learnerId, type, itemId });
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
      await apiPost('/admin-notifications', { action: 'create-system-alert', title, message, admin_type: adminType });
    } catch (error) {
      logger.error('Create system alert exception', error instanceof Error ? error : new Error(String(error)), { adminType });
    }
  }
}