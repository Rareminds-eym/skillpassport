/**
 * Learner Notifications Service
 * Handles notifications for learners about pipeline changes, interviews, etc.
 */

import { apiPost } from '@/shared/api/apiClient';
import { getWSClient } from '@/shared/api/wsRealtimeClient';

export class LearnerNotificationService {
  static async getlearnerNotifications(learnerId, options = {}) {
    try {
      const result = await apiPost('/learners/notifications', {
        action: 'get-notifications', learnerId,
        unreadOnly: options.unreadOnly,
        type: options.type,
        limit: options.limit,
      });
      return result?.data?.data || [];
    } catch (error) {
      console.error('Error fetching learner notifications:', error);
      throw error;
    }
  }

  static async getUnreadCount(learnerId) {
    try {
      const result = await apiPost('/learners/notifications', {
        action: 'get-unread-count', learnerId,
      });
      return result?.data?.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  static async markAsRead(notificationId, learnerId) {
    try {
      const result = await apiPost('/learners/notifications', {
        action: 'mark-as-read', notificationId, learnerId,
      });
      return result?.data?.success || false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async markAllAsRead(learnerId) {
    try {
      const result = await apiPost('/learners/notifications', {
        action: 'mark-all-as-read', learnerId,
      });
      return result?.data?.success || false;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  static async createNotification(notificationData) {
    try {
      const result = await apiPost('/learners/notifications', {
        action: 'create-notification', ...notificationData,
      });
      return result?.data?.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId, learnerId) {
    try {
      const result = await apiPost('/learners/notifications', {
        action: 'delete-notification', notificationId, learnerId,
      });
      return result?.data?.success || false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  static subscribeToNotifications(learnerId, onNotification) {
    const sseClient = getWSClient();
    const unsubscribers = [];

    // Subscribe to INSERT events
    const unsubInsert = sseClient.subscribe(
      'learner_notifications',
      { event: 'INSERT', filter: `learner_id=eq.${learnerId}` },
      (event) => {
        if (event.type === 'change') {
          onNotification(event.payload);
        }
      }
    );
    unsubscribers.push(unsubInsert);

    // Subscribe to UPDATE events
    const unsubUpdate = sseClient.subscribe(
      'learner_notifications',
      { event: 'UPDATE', filter: `learner_id=eq.${learnerId}` },
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

  static unsubscribeFromNotifications(unsubscribeFn) {
    if (unsubscribeFn && typeof unsubscribeFn === 'function') {
      unsubscribeFn();
    }
  }

  static getNotificationConfig(type) {
    const configs = {
      stage_change: {
        icon: 'ArrowRight',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      interview_scheduled: {
        icon: 'Video',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100'
      },
      offer_received: {
        icon: 'Award',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      application_status: {
        icon: 'FileText',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      message: {
        icon: 'MessageSquare',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      }
    };

    return configs[type] || configs.application_status;
  }
}

export default LearnerNotificationService;
