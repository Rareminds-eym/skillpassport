/**
 * Migration Notification Service
 *
 * Handles sending notifications to users about the subscription migration
 * from tiered plans to the add-on based system.
 *
 * @requirement Task 8.2 - Create migration notification system
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Email templates for migration notifications
 */
const EMAIL_TEMPLATES = {
  migration_announcement: {
    subject: 'Important: Changes to Your SkillPassport Subscription',
    template: 'migration-announcement',
  },
  migration_reminder_30: {
    subject: 'Reminder: Your Subscription is Changing in 30 Days',
    template: 'migration-reminder-30',
  },
  migration_reminder_7: {
    subject: 'Action Required: Subscription Changes in 7 Days',
    template: 'migration-reminder-7',
  },
  migration_complete: {
    subject: 'Your SkillPassport Subscription Has Been Updated',
    template: 'migration-complete',
  },
};

/**
 * Schedule a migration notification for a user
 */
export async function scheduleMigrationNotification(
  userId,
  scheduledDate,
  notificationType = 'migration_reminder_30'
) {
  const template = EMAIL_TEMPLATES[notificationType];

  if (!template) {
    throw new Error(`Unknown notification type: ${notificationType}`);
  }

  const { data, error } = await supabase
    .from('scheduled_notifications')
    .insert({
      user_id: userId,
      notification_type: notificationType,
      scheduled_for: scheduledDate,
      status: 'pending',
      template_id: template.template,
      subject: template.subject,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }

  return data;
}

/**
 * Get pending notifications that need to be sent
 */
export async function getPendingNotifications() {
  const { data, error } = await supabase
    .from('scheduled_notifications')
    .select(
      `
      *,
      users!inner(id, email, user_metadata)
    `
    )
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching pending notifications:', error);
    throw error;
  }

  return data || [];
}

/**
 * Mark notification as sent
 */
export async function markNotificationSent(notificationId, success = true, errorMessage = null) {
  const { error } = await supabase
    .from('scheduled_notifications')
    .update({
      status: success ? 'sent' : 'failed',
      sent_at: success ? new Date().toISOString() : null,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    console.error('Error updating notification status:', error);
    throw error;
  }
}

/**
 * Send migration notification email
 * This integrates with your email service (e.g., SendGrid, Resend, etc.)
 */
export async function sendMigrationEmail(notification) {
  const { user, notification_type, subject } = notification;

  // Get user's subscription details for personalization
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get migration details
  const { data: migration } = await supabase
    .from('subscription_migrations')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const emailData = {
    to: user.email,
    subject: subject,
    template: EMAIL_TEMPLATES[notification_type].template,
    data: {
      userName: user.user_metadata?.full_name || user.email.split('@')[0],
      currentPlan: subscription?.plan_type || 'Basic',
      migratedFeatures: migration?.migrated_features || [],
      priceProtectionUntil: migration?.price_protection_until,
      subscriptionEndDate: subscription?.subscription_end_date,
      dashboardUrl: `${process.env.VITE_APP_URL || 'https://skillpassport.in'}/subscription/manage`,
    },
  };

  // TODO: Integrate with your email service
  // Example with a generic email service:
  // await emailService.send(emailData);

  console.log('Would send email:', emailData);

  return { success: true, emailData };
}

/**
 * Process all pending notifications
 */
export async function processNotifications() {
  const notifications = await getPendingNotifications();

  console.log(`Processing ${notifications.length} pending notifications`);

  const results = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const notification of notifications) {
    try {
      await sendMigrationEmail(notification);
      await markNotificationSent(notification.id, true);
      results.sent++;
    } catch (error) {
      console.error(`Failed to send notification ${notification.id}:`, error);
      await markNotificationSent(notification.id, false, error.message);
      results.failed++;
      results.errors.push({ id: notification.id, error: error.message });
    }
  }

  return results;
}

/**
 * Schedule all migration notifications for a user
 */
export async function scheduleAllMigrationNotifications(userId, migrationDate) {
  const notifications = [];

  // 30-day reminder
  const reminder30Date = new Date(migrationDate);
  reminder30Date.setDate(reminder30Date.getDate() - 30);
  if (reminder30Date > new Date()) {
    notifications.push(
      await scheduleMigrationNotification(
        userId,
        reminder30Date.toISOString(),
        'migration_reminder_30'
      )
    );
  }

  // 7-day reminder
  const reminder7Date = new Date(migrationDate);
  reminder7Date.setDate(reminder7Date.getDate() - 7);
  if (reminder7Date > new Date()) {
    notifications.push(
      await scheduleMigrationNotification(
        userId,
        reminder7Date.toISOString(),
        'migration_reminder_7'
      )
    );
  }

  // Migration complete notification (on migration date)
  notifications.push(
    await scheduleMigrationNotification(userId, migrationDate, 'migration_complete')
  );

  return notifications;
}

/**
 * Get notification history for a user
 */
export async function getUserNotificationHistory(userId) {
  const { data, error } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notification history:', error);
    throw error;
  }

  return data || [];
}

/**
 * Cancel pending notifications for a user
 */
export async function cancelPendingNotifications(userId) {
  const { data, error } = await supabase
    .from('scheduled_notifications')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select();

  if (error) {
    console.error('Error cancelling notifications:', error);
    throw error;
  }

  return data || [];
}

export default {
  scheduleMigrationNotification,
  getPendingNotifications,
  markNotificationSent,
  sendMigrationEmail,
  processNotifications,
  scheduleAllMigrationNotifications,
  getUserNotificationHistory,
  cancelPendingNotifications,
  EMAIL_TEMPLATES,
};
