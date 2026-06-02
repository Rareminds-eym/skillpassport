import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';

const logger = getLogger('school-admin-notification');

const API_PATH = '/college-admin/school-admin';

export class SchoolAdminNotificationService {
  static async getSchoolAdminNotifications(schoolId: string, options: { unreadOnly?: boolean } = {}) {
    try {
      const data = await apiPost(API_PATH, {
        action: 'get-notifications',
        school_id: schoolId,
        unread_only: options.unreadOnly || false,
      });
      return data as any[] || [];
    } catch (error) {
      logger.error('Failed to fetch school admin notifications', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async getUnreadCount(schoolId: string) {
    try {
      const data = await apiPost(API_PATH, {
        action: 'get-unread-count',
        school_id: schoolId,
      });
      return (data as number) || 0;
    } catch (error) {
      logger.error('Failed to fetch unread notification count', error instanceof Error ? error : new Error('Unknown error'));
      return 0;
    }
  }

  static async getPendingTrainings(schoolId: string) {
    try {
      const data = await apiPost(API_PATH, {
        action: 'get-pending-trainings',
        school_id: schoolId,
      });
      return (data as any[]) || [];
    } catch (error) {
      logger.error('Failed to fetch pending trainings', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async getPendingExperiences(schoolId: string) {
    try {
      const data = await apiPost(API_PATH, {
        action: 'get-pending-experiences',
        school_id: schoolId,
      });
      return (data as any[]) || [];
    } catch (error) {
      logger.error('Failed to fetch pending experiences', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      await apiPost(API_PATH, {
        action: 'mark-notification-read',
        notification_id: notificationId,
      });
      return true;
    } catch (error) {
      logger.error('Failed to mark notification as read', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }

  static async approveTraining(trainingId: string, approverId: string, notes = '') {
    try {
      const result = await apiPost(API_PATH, {
        action: 'approve-training',
        training_id: trainingId,
        approver_id: approverId,
        notes,
      });
      return result as { success: boolean; message: string; training_id: string };
    } catch (error) {
      logger.error('Failed to approve training', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async rejectTraining(trainingId: string, rejectorId: string, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      const result = await apiPost(API_PATH, {
        action: 'reject-training',
        training_id: trainingId,
        rejector_id: rejectorId,
        notes,
      });
      return result as { success: boolean; message: string; training_id: string; reason: string };
    } catch (error) {
      logger.error('Failed to reject training', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async approveExperience(experienceId: string, approverId: string, notes = '') {
    try {
      const result = await apiPost(API_PATH, {
        action: 'approve-experience',
        experience_id: experienceId,
        approver_id: approverId,
        notes,
      });
      return result as { success: boolean; message: string; experience_id: string };
    } catch (error) {
      logger.error('Failed to approve experience', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async rejectExperience(experienceId: string, rejectorId: string, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      const result = await apiPost(API_PATH, {
        action: 'reject-experience',
        experience_id: experienceId,
        rejector_id: rejectorId,
        notes,
      });
      return result;
    } catch (error) {
      logger.error('Failed to reject experience', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async getPendingProjects(schoolId: string) {
    try {
      const data = await apiPost(API_PATH, {
        action: 'get-pending-projects',
        school_id: schoolId,
      });
      return (data as any[]) || [];
    } catch (error) {
      logger.error('Failed to fetch pending projects', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async approveProject(projectId: string, approverId: string, notes = '') {
    try {
      if (!projectId || projectId === 'undefined') {
        throw new Error('Invalid project ID');
      }
      if (!approverId || approverId === 'undefined') {
        throw new Error('Invalid approver ID - user not authenticated');
      }
      const result = await apiPost(API_PATH, {
        action: 'approve-project',
        project_id: projectId,
        approver_id: approverId,
        notes,
      });
      return result as { success: boolean; message: string; project_id: string };
    } catch (error) {
      logger.error('Failed to approve project', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static async rejectProject(projectId: string, rejectorId: string, notes = '') {
    try {
      if (!notes || notes.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      if (!projectId || projectId === 'undefined') {
        throw new Error('Invalid project ID');
      }
      if (!rejectorId || rejectorId === 'undefined') {
        throw new Error('Invalid rejector ID - user not authenticated');
      }
      const result = await apiPost(API_PATH, {
        action: 'reject-project',
        project_id: projectId,
        rejector_id: rejectorId,
        notes,
      });
      return result as { success: boolean; message: string; project_id: string; reason: string };
    } catch (error) {
      logger.error('Failed to reject project', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  static subscribeToNotifications(schoolId: string, callback: (notification: any) => void) {
    const sseClient = getSSEClient();
    
    const unsub = sseClient.subscribe(
      'training_notifications',
      { event: 'INSERT', filter: `school_id=eq.${schoolId}` },
      (event) => {
        if (event.type === 'change') {
          callback(event.payload);
        }
      }
    );

    return unsub;
  }
}
