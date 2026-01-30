/**
 * Notification Service
 * Handles sending notifications to students based on their preferences
 * Uses the existing notifications table and new notification_settings column
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Notification types that can be sent
 */
export const NOTIFICATION_TYPES = {
  APPLICATION_UPDATE: 'application_update',
  NEW_OPPORTUNITY: 'new_opportunity',
  RECRUITER_MESSAGE: 'recruiter_message',
  SHORTLIST: 'shortlist',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  SYSTEM: 'system',
};

/**
 * Check if a student wants to receive a specific type of notification
 * @param {string} studentEmail - Student email
 * @param {string} notificationType - Type of notification
 * @returns {Promise<boolean>} Whether to send the notification
 */
export const shouldSendNotification = async (studentEmail, notificationType) => {
  try {
    // Get student's notification preferences from user_settings table
    const { getNotificationPreferencesByEmail } = await import('./userSettingsService.js');
    const result = await getNotificationPreferencesByEmail(studentEmail);

    if (!result.success) {
      console.warn('Could not fetch notification preferences:', result.error);
      return true; // Default to sending if we can't check preferences
    }

    const settings = result.data || {};

    // Check master switch first
    if (settings.emailNotifications === false) {
      return false; // User has disabled all notifications
    }

    // Check specific notification type
    switch (notificationType) {
      case NOTIFICATION_TYPES.APPLICATION_UPDATE:
        return settings.applicationUpdates !== false;
      
      case NOTIFICATION_TYPES.NEW_OPPORTUNITY:
        return settings.newOpportunities !== false;
      
      case NOTIFICATION_TYPES.RECRUITER_MESSAGE:
        return settings.recruitingMessages !== false;
      
      case NOTIFICATION_TYPES.SHORTLIST:
      case NOTIFICATION_TYPES.INTERVIEW:
      case NOTIFICATION_TYPES.OFFER:
        // These are important, check applicationUpdates setting
        return settings.applicationUpdates !== false;
      
      case NOTIFICATION_TYPES.SYSTEM:
        // System notifications always send (unless master switch is off)
        return true;
      
      default:
        return true; // Unknown type, send by default
    }
  } catch (err) {
    console.error('Error checking notification preferences:', err);
    return true; // Default to sending on error
  }
};

/**
 * Send a notification to a student
 * Checks preferences before sending
 * @param {Object} params - Notification parameters
 * @param {string} params.recipientEmail - Student email
 * @param {string} params.type - Notification type
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @returns {Promise<Object>} Result with success status
 */
export const sendNotification = async ({ recipientEmail, type, title, message }) => {
  try {
    // First, check if student wants this type of notification
    const shouldSend = await shouldSendNotification(recipientEmail, type);
    
    if (!shouldSend) {
      console.log(`📭 Notification not sent - user preferences: ${recipientEmail}`);
      return { 
        success: true, 
        sent: false, 
        reason: 'User preferences - notification disabled' 
      };
    }

    // Get student's user_id (recipient_id for notifications table)
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id, id')
      .eq('email', recipientEmail)
      .single();

    if (studentError || !student?.user_id) {
      console.error('Student not found:', studentError);
      return { 
        success: false, 
        error: 'Student not found' 
      };
    }

    // Insert notification into notifications table
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: student.user_id,
        type: type,
        title: title,
        message: message,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }

    console.log(`✅ Notification sent to ${recipientEmail}: ${title}`);
    return { 
      success: true, 
      sent: true, 
      data 
    };
  } catch (err) {
    console.error('Error sending notification:', err);
    return { 
      success: false, 
      error: err.message 
    };
  }
};

/**
 * Send notification to multiple students
 * @param {Array} recipients - Array of student emails
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @returns {Promise<Object>} Results with counts
 */
export const sendBulkNotifications = async (recipients, type, title, message) => {
  const results = {
    total: recipients.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const recipientEmail of recipients) {
    try {
      const result = await sendNotification({
        recipientEmail,
        type,
        title,
        message,
      });

      if (result.success && result.sent) {
        results.sent++;
      } else if (result.success && !result.sent) {
        results.skipped++;
      } else {
        results.failed++;
        results.errors.push({ email: recipientEmail, error: result.error });
      }
    } catch (err) {
      results.failed++;
      results.errors.push({ email: recipientEmail, error: err.message });
    }
  }

  return results;
};

/**
 * Get unread notification count for a student
 * @param {string} userId - User ID (from auth.users)
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error getting unread count:', err);
    return 0;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Result
 */
export const markAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result
 */
export const markAllAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Notifications
 */
export const getNotifications = async (userId, options = {}) => {
  try {
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
    } = options;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
};

// Export helper functions for common notification scenarios
export const notificationHelpers = {
  /**
   * Send application status update notification
   */
  applicationStatusUpdate: async (studentEmail, jobTitle, newStatus) => {
    return sendNotification({
      recipientEmail: studentEmail,
      type: NOTIFICATION_TYPES.APPLICATION_UPDATE,
      title: 'Application Status Updated',
      message: `Your application for ${jobTitle} has been updated to: ${newStatus}`,
    });
  },

  /**
   * Send new opportunity notification
   */
  newOpportunity: async (studentEmail, opportunityTitle, company) => {
    return sendNotification({
      recipientEmail: studentEmail,
      type: NOTIFICATION_TYPES.NEW_OPPORTUNITY,
      title: 'New Opportunity Available',
      message: `${opportunityTitle} at ${company} matches your profile!`,
    });
  },

  /**
   * Send recruiter message notification
   */
  recruiterMessage: async (studentEmail, recruiterName, company) => {
    return sendNotification({
      recipientEmail: studentEmail,
      type: NOTIFICATION_TYPES.RECRUITER_MESSAGE,
      title: 'New Message from Recruiter',
      message: `${recruiterName} from ${company} has sent you a message`,
    });
  },

  /**
   * Send shortlist notification
   */
  shortlisted: async (studentEmail, jobTitle, company) => {
    return sendNotification({
      recipientEmail: studentEmail,
      type: NOTIFICATION_TYPES.SHORTLIST,
      title: 'You\'ve Been Shortlisted!',
      message: `Congratulations! You've been shortlisted for ${jobTitle} at ${company}`,
    });
  },

  /**
   * Send interview invitation
   */
  interviewInvitation: async (studentEmail, jobTitle, company, date) => {
    return sendNotification({
      recipientEmail: studentEmail,
      type: NOTIFICATION_TYPES.INTERVIEW,
      title: 'Interview Invitation',
      message: `You're invited for an interview for ${jobTitle} at ${company} on ${date}`,
    });
  },

  /**
   * Send offer notification
   */
  offerReceived: async (studentEmail, jobTitle, company) => {
    return sendNotification({
      recipientEmail: studentEmail,
      type: NOTIFICATION_TYPES.OFFER,
      title: 'Job Offer Received!',
      message: `Congratulations! You've received an offer for ${jobTitle} at ${company}`,
    });
  },
};

export default {
  sendNotification,
  sendBulkNotifications,
  shouldSendNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getNotifications,
  NOTIFICATION_TYPES,
  notificationHelpers,
};
