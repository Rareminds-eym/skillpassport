import { apiPost } from '@/shared/api/apiClient';
import { AdminNotificationType } from '@/shared/lib/hooks';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('admin-notification-service');

export class AdminNotificationService {
  static async createNotification(
    recipientId: string,
    type: AdminNotificationType,
    title: string,
    message: string
  ) {
    try {
      const response: any = await apiPost('/admin-notifications', {
        action: 'create',
        recipient_id: recipientId,
        type,
        title,
        message,
      });

      return response?.data ?? response;
    } catch (error) {
      logger.error('Failed to create admin notification', error as Error, { recipientId, type });
      throw error;
    }
  }

  static async notifyTrainingSubmission(
    schoolId: string,
    learnerName: string,
    trainingTitle: string,
    trainingId: string
  ) {
    try {
      await apiPost('/admin-notifications', {
        action: 'notify-training-submission',
        school_id: schoolId,
        learner_name: learnerName,
        training_title: trainingTitle,
        training_id: trainingId,
      });
    } catch (error) {
      logger.error('Failed to notify training submission', error as Error, { schoolId, learnerName });
    }
  }

  static async notifyExperienceSubmission(
    schoolId: string,
    learnerName: string,
    experienceTitle: string,
    experienceId: string
  ) {
    try {
      await apiPost('/admin-notifications', {
        action: 'notify-experience-submission',
        school_id: schoolId,
        learner_name: learnerName,
        experience_title: experienceTitle,
        experience_id: experienceId,
      });
    } catch (error) {
      logger.error('Failed to notify experience submission', error as Error, { schoolId, learnerName });
    }
  }

  static async notifyProjectSubmission(
    schoolId: string,
    learnerName: string,
    projectTitle: string,
    projectId: string
  ) {
    try {
      await apiPost('/admin-notifications', {
        action: 'notify-project-submission',
        school_id: schoolId,
        learner_name: learnerName,
        project_title: projectTitle,
        project_id: projectId,
      });
    } catch (error) {
      logger.error('Failed to notify project submission', error as Error, { schoolId, learnerName });
    }
  }

  static async notifyCollegeAdmin(
    collegeId: string,
    type: AdminNotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ) {
    try {
      await apiPost('/admin-notifications', {
        action: 'notify-college-admin',
        college_id: collegeId,
        type,
        title,
        message,
        metadata,
      });
    } catch (error) {
      logger.error('Failed to notify college admin', error as Error, { collegeId });
    }
  }

  static async notifyApprovalStatus(
    learnerId: string,
    type: 'training_approved' | 'training_rejected' | 'experience_approved' | 'experience_rejected' | 'project_approved' | 'project_rejected',
    itemTitle: string,
    itemId: string,
    notes?: string
  ) {
    try {
      await apiPost('/admin-notifications', {
        action: 'notify-approval-status',
        learner_id: learnerId,
        type,
        item_title: itemTitle,
        item_id: itemId,
        notes,
      });
    } catch (error) {
      logger.error('Failed to notify approval status', error as Error, { learnerId, type });
    }
  }

  static async createSystemAlert(
    title: string,
    message: string,
    adminType?: 'school_admin' | 'college_admin' | 'university_admin'
  ) {
    try {
      await apiPost('/admin-notifications', {
        action: 'create-system-alert',
        title,
        message,
        admin_type: adminType,
      });
    } catch (error) {
      logger.error('Failed to create system alert', error as Error, { adminType });
    }
  }
}