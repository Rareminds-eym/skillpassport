import cron from 'node-cron';
import { getStudentsNeedingReminder, logNotificationSent, resetDailyStreakFlags } from '../services/streakService.js';
import { sendStreakReminderEmail } from '../services/emailService.js';

/**
 * Main function to check streaks and send reminders
 */
async function checkStreaksAndSendReminders() {
  console.log('\n════════════════════════════════════════════════');
  console.log('🔔 Running Streak Reminder Check...');
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log('════════════════════════════════════════════════\n');

  try {
    // Get list of students who need reminders
    const students = await getStudentsNeedingReminder();

    if (!students || students.length === 0) {
      console.log('✅ No students need reminders at this time.');
      console.log('   Either everyone completed their streak today or we\'ve already sent 4 emails to everyone!\n');
      return;
    }

    console.log(`📊 Found ${students.length} student(s) needing reminders:\n`);

    // Process each student
    for (const student of students) {
      const {
        student_id,
        student_email,
        student_name,
        current_streak,
        emails_sent_today
      } = student;

      // Determine which email template to send (1-4)
      const templateNumber = emails_sent_today + 1;

      if (templateNumber > 4) {
        console.log(`⏭️  Skipping ${student_name} (${student_email}) - Already sent 4 emails today`);
        continue;
      }

      console.log(`\n📧 Processing: ${student_name} (${student_email})`);
      console.log(`   Current Streak: ${current_streak} days`);
      console.log(`   Emails Sent Today: ${emails_sent_today}`);
      console.log(`   Sending Email Template: #${templateNumber}`);

      // Prepare student object for email service
      const studentData = {
        email: student_email,
        name: student_name,
        current_streak: current_streak || 0,
      };

      // Send the email
      const emailResult = await sendStreakReminderEmail(studentData, templateNumber);

      if (emailResult.success) {
        console.log(`   ✅ Email sent successfully!`);

        // Log the notification in the database
        await logNotificationSent(student_id, templateNumber, 'sent');
      } else {
        console.error(`   ❌ Failed to send email: ${emailResult.error}`);

        // Log the failure
        await logNotificationSent(student_id, templateNumber, 'failed', emailResult.error);
      }
    }

    console.log('\n════════════════════════════════════════════════');
    console.log(`✅ Reminder check completed!`);
    console.log(`📊 Processed ${students.length} student(s)`);
    console.log('════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error in checkStreaksAndSendReminders:');
    console.error(error);
    console.log('════════════════════════════════════════════════\n');
  }
}

/**
 * Reset daily streak flags at midnight
 */
async function performDailyReset() {
  console.log('\n════════════════════════════════════════════════');
  console.log('🌅 Performing Daily Streak Reset...');
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log('════════════════════════════════════════════════\n');

  try {
    const result = await resetDailyStreakFlags();

    if (result.success) {
      console.log(`✅ Successfully reset streak flags for ${result.count} students`);
      console.log('   All students can now earn their streak for the new day!\n');
    } else {
      console.error(`❌ Error during daily reset: ${result.error}\n`);
    }

  } catch (error) {
    console.error('\n❌ Error in performDailyReset:');
    console.error(error);
  }

  console.log('════════════════════════════════════════════════\n');
}

/**
 * Initialize all cron jobs
 */
export function initializeStreakScheduler() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Initializing Streak Reminder Scheduler      ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Check if scheduler is enabled
  const isEnabled = process.env.ENABLE_STREAK_SCHEDULER !== 'false';

  if (!isEnabled) {
    console.log('⚠️  Streak Scheduler is DISABLED in environment variables');
    console.log('   Set ENABLE_STREAK_SCHEDULER=true in .env to enable\n');
    return;
  }

  // Get cron expressions from environment or use defaults
  const reminderCron = process.env.STREAK_REMINDER_CRON || '0 */6 * * *'; // Every 6 hours
  const resetCron = process.env.DAILY_RESET_CRON || '0 0 * * *'; // Midnight daily

  console.log('📋 Scheduler Configuration:');
  console.log(`   Reminder Cron: ${reminderCron} (Every 6 hours)`);
  console.log(`   Reset Cron: ${resetCron} (Daily at midnight)`);
  console.log('');

  // Validate cron expressions
  if (!cron.validate(reminderCron)) {
    console.error('❌ Invalid STREAK_REMINDER_CRON expression:', reminderCron);
    return;
  }

  if (!cron.validate(resetCron)) {
    console.error('❌ Invalid DAILY_RESET_CRON expression:', resetCron);
    return;
  }

  // Schedule streak reminder checks (every 6 hours)
  const reminderJob = cron.schedule(reminderCron, checkStreaksAndSendReminders, {
    timezone: process.env.TZ || 'UTC'
  });

  console.log('✅ Streak Reminder Job scheduled successfully');
  console.log('   Will run every 6 hours: 00:00, 06:00, 12:00, 18:00');
  console.log('');

  // Schedule daily reset (at midnight)
  const resetJob = cron.schedule(resetCron, performDailyReset, {
    timezone: process.env.TZ || 'UTC'
  });

  console.log('✅ Daily Reset Job scheduled successfully');
  console.log('   Will run at midnight (00:00) every day');
  console.log('');

  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Streak Scheduler is now ACTIVE! 🚀          ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Run initial check immediately (optional - comment out if you don't want this)
  console.log('🔍 Running initial streak check now...\n');
  checkStreaksAndSendReminders();

  return { reminderJob, resetJob };
}

export default {
  initializeStreakScheduler,
};
