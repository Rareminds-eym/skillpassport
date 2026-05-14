/**
 * Learner Notifications Service
 * Handles notifications for learners about pipeline changes, interviews, etc.
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-notification');

export class LearnerNotificationService {
  /**
   * Get all notifications for a learner
   * @param {string} learnerId - Learner's UUID from learners table
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of notifications
   */
  static async getlearnerNotifications(learnerId, options = {}) {
    try {
      // Map learner_id to user_id (notifications.recipient_id references users.id)
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('user_id')
        .eq('id', learnerId)
        .single();

      if (learnerError || !learnerData?.user_id) {
        logger.warn('Learner not found or has no user_id', { learnerId });
        return [];
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', learnerData.user_id)
        .order('created_at', { ascending: false });

      if (options.unreadOnly) {
        query = query.eq('read', false);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error fetching learner notifications', error, { learnerId });
      throw error;
    }
  }

  /**
   * Get unread notification count
   * @param {string} learnerId - Learner's UUID from learners table
   * @returns {Promise<number>} Count of unread notifications
   */
  static async getUnreadCount(learnerId) {
    try {
      // Map learner_id to user_id
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('user_id')
        .eq('id', learnerId)
        .single();

      if (learnerError || !learnerData?.user_id) {
        logger.warn('Learner not found or has no user_id', { learnerId });
        return 0;
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', learnerData.user_id)
        .eq('read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      logger.error('Error fetching unread count', error, { learnerId });
      return 0;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID (UUID)
   * @param {string} learnerId - Learner's UUID for verification
   * @returns {Promise<boolean>} Success status
   */
  static async markAsRead(notificationId, learnerId) {
    try {
      // Map learner_id to user_id
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('user_id')
        .eq('id', learnerId)
        .single();

      if (learnerError || !learnerData?.user_id) {
        logger.warn('Learner not found or has no user_id', { learnerId });
        return false;
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({
          read: true
        })
        .eq('id', notificationId)
        .eq('recipient_id', learnerData.user_id)
        .select()
        .single();

      if (error) throw error;

      return !!data;
    } catch (error) {
      logger.error('Error marking notification as read', error, { notificationId });
      return false;
    }
  }

  /**
   * Mark all notifications as read
   * @param {string} learnerId - Learner's UUID
   * @returns {Promise<boolean>} Success status
   */
  static async markAllAsRead(learnerId) {
    try {
      // Map learner_id to user_id
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('user_id')
        .eq('id', learnerId)
        .single();

      if (learnerError || !learnerData?.user_id) {
        logger.warn('Learner not found or has no user_id', { learnerId });
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          read: true
        })
        .eq('recipient_id', learnerData.user_id)
        .eq('read', false);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error marking all notifications as read', error, { learnerId });
      return false;
    }
  }

  /**
   * Create a manual notification (for system/admin use)
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  static async createNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          recipient_id: notificationData.learner_id || notificationData.recipient_id,
          type: notificationData.notification_type || notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Error creating notification', error, { learnerId: notificationData.learner_id });
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID (UUID)
   * @param {string} learnerId - Learner's UUID for verification
   * @returns {Promise<boolean>} Success status
   */
  static async deleteNotification(notificationId, learnerId) {
    try {
      // Map learner_id to user_id
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('user_id')
        .eq('id', learnerId)
        .single();

      if (learnerError || !learnerData?.user_id) {
        logger.warn('Learner not found or has no user_id', { learnerId });
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_id', learnerData.user_id);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error deleting notification', error, { notificationId });
      return false;
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  static async subscribeToNotifications(learnerId: string, onNotification: (notification: any) => void) {
    try {
      // Map learner_id to user_id
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('user_id')
        .eq('id', learnerId)
        .single();

      if (learnerError || !learnerData?.user_id) {
        logger.warn('Learner not found or has no user_id', { learnerId });
        return null;
      }

      const userId = learnerData.user_id;

      const channel = supabase
        .channel(`learner-notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`
          },
          (payload) => {
            onNotification(payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`
          },
          (payload) => {
            onNotification(payload.new);
          }
        )
        .subscribe();

      logger.info('Subscribed to notifications', { learnerId, userId });
      return channel;
    } catch (error: unknown) {
      logger.error('Error subscribing to notifications', error as Error, { learnerId });
      return null;
    }
  }

  /**
   * Unsubscribe from notifications
   * @param {Object} channel - Supabase channel to unsubscribe
   */
  static unsubscribeFromNotifications(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }

  /**
   * Get notification icon and color based on type
   * @param {string} type - Notification type
   * @returns {Object} Icon and color configuration
   */
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
