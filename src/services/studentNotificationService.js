/**
 * Student Notifications Service
 * Handles notifications for students about pipeline changes, interviews, etc.
 */

import { supabase } from '../lib/supabaseClient';

export class StudentNotificationService {
  /**
   * Get all notifications for a student
   * @param {string} studentId - Student's UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of notifications
   */
  static async getStudentNotifications(studentId, options = {}) {
    try {
      let query = supabase
        .from('student_notifications')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (options.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (options.type) {
        query = query.eq('notification_type', options.type);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching student notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   * @param {string} studentId - Student's UUID
   * @returns {Promise<number>} Count of unread notifications
   */
  static async getUnreadCount(studentId) {
    try {
      const { count, error } = await supabase
        .from('student_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('is_read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @param {string} studentId - Student's UUID for verification
   * @returns {Promise<boolean>} Success status
   */
  static async markAsRead(notificationId, studentId) {
    try {
      const { data, error } = await supabase
        .from('student_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   * @param {string} studentId - Student's UUID
   * @returns {Promise<boolean>} Success status
   */
  static async markAllAsRead(studentId) {
    try {
      const { error } = await supabase
        .from('student_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('student_id', studentId)
        .eq('is_read', false);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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
        .from('student_notifications')
        .insert([
          {
            student_id: notificationData.student_id,
            notification_type: notificationData.notification_type,
            title: notificationData.title,
            message: notificationData.message,
            pipeline_candidate_id: notificationData.pipeline_candidate_id || null,
            opportunity_id: notificationData.opportunity_id || null,
            interview_id: notificationData.interview_id || null,
            application_id: notificationData.application_id || null,
            metadata: notificationData.metadata || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {number} notificationId - Notification ID
   * @param {string} studentId - Student's UUID for verification
   * @returns {Promise<boolean>} Success status
   */
  static async deleteNotification(notificationId, studentId) {
    try {
      const { error } = await supabase
        .from('student_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('student_id', studentId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Subscribe to real-time notifications
   * @param {string} studentId - Student's UUID
   * @param {Function} onNotification - Callback when new notification arrives
   * @returns {Object} Supabase subscription channel
   */
  static subscribeToNotifications(studentId, onNotification) {
    const channel = supabase
      .channel(`student-notifications-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_notifications',
          filter: `student_id=eq.${studentId}`,
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
          table: 'student_notifications',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          onNotification(payload.new);
        }
      )
      .subscribe();

    return channel;
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

export default StudentNotificationService;
