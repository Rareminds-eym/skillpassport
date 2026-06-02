import { apiGet, apiPost } from '@/shared/api/apiClient';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-notification');

export class LearnerNotificationService {
  static async getlearnerNotifications(learnerId, options = {}) {
    try {
      const response: any = await apiPost('/learners/notifications', {
        action: 'get-notifications',
        learnerId,
        unreadOnly: options.unreadOnly || false,
        type: options.type || null,
        limit: options.limit || null,
      });

      const data = response?.data ?? response;
      return data?.data || [];
    } catch (error) {
      logger.error('Error fetching learner notifications', error, { learnerId });
      throw error;
    }
  }

  static async getUnreadCount(learnerId) {
    try {
      const response: any = await apiPost('/learners/notifications', {
        action: 'get-unread-count',
        learnerId,
      });

      const data = response?.data ?? response;
      return data?.count || 0;
    } catch (error) {
      logger.error('Error fetching unread count', error, { learnerId });
      return 0;
    }
  }

  static async markAsRead(notificationId, learnerId) {
    try {
      const response: any = await apiPost('/learners/notifications', {
        action: 'mark-as-read',
        notificationId,
        learnerId,
      });

      const data = response?.data ?? response;
      return !!data?.success;
    } catch (error) {
      logger.error('Error marking notification as read', error, { notificationId });
      return false;
    }
  }

  static async markAllAsRead(learnerId) {
    try {
      const response: any = await apiPost('/learners/notifications', {
        action: 'mark-all-as-read',
        learnerId,
      });

      const data = response?.data ?? response;
      return !!data?.success;
    } catch (error) {
      logger.error('Error marking all notifications as read', error, { learnerId });
      return false;
    }
  }

  static async createNotification(notificationData) {
    try {
      const response: any = await apiPost('/learners/notifications', {
        action: 'create-notification',
        learner_id: notificationData.learner_id || notificationData.recipient_id,
        notification_type: notificationData.notification_type || notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
      });

      const data = response?.data ?? response;
      return data?.data;
    } catch (error) {
      logger.error('Error creating notification', error, { learnerId: notificationData.learner_id });
      throw error;
    }
  }

  static async deleteNotification(notificationId, learnerId) {
    try {
      const response: any = await apiPost('/learners/notifications', {
        action: 'delete-notification',
        notificationId,
        learnerId,
      });

      const data = response?.data ?? response;
      return !!data?.success;
    } catch (error) {
      logger.error('Error deleting notification', error, { notificationId });
      return false;
    }
  }

  static subscribeToNotifications(learnerId: string, onNotification: (notification: any) => void) {
    const sseClient = getSSEClient();
    const unsubscribers: Array<() => void> = [];

    // Subscribe to INSERT events
    const unsubInsert = sseClient.subscribe(
      'notifications',
      { event: 'INSERT', filter: `recipient_id=eq.${learnerId}` },
      (event) => {
        if (event.type === 'change') {
          onNotification(event.payload);
        }
      }
    );
    unsubscribers.push(unsubInsert);

    // Subscribe to UPDATE events
    const unsubUpdate = sseClient.subscribe(
      'notifications',
      { event: 'UPDATE', filter: `recipient_id=eq.${learnerId}` },
      (event) => {
        if (event.type === 'change') {
          onNotification(event.payload);
        }
      }
    );
    unsubscribers.push(unsubUpdate);

    // Return unsubscribe function
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  static unsubscribeFromNotifications(unsubscribeFn: () => void) {
    if (unsubscribeFn && typeof unsubscribeFn === 'function') {
      unsubscribeFn();
    }
  }

  static getNotificationConfig(type) {
    const configs = {
      stage_change: {
        icon: 'ArrowRight',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      },
      interview_scheduled: {
        icon: 'Video',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
      },
      offer_received: {
        icon: 'Award',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      application_status: {
        icon: 'FileText',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
      message: {
        icon: 'MessageSquare',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      },
    };

    return configs[type] || configs.application_status;
  }
}

export default LearnerNotificationService;