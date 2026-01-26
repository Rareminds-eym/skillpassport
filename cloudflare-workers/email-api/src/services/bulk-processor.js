/**
 * Bulk email processing service
 */

import { generateCountdownEmailHtml, getCountdownSubject } from '../templates/countdown.js';
import { sendEmail } from './mailer.js';
import { 
  checkEmailAlreadySent,
  createEmailTracking,
  updateEmailTracking
} from './supabase.js';
import { getTodayStartOfDay } from '../utils/date.js';
import { DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME, EMAIL_STATUS } from '../config/constants.js';

export async function processBulkEmails(supabase, env, preRegistrations, countdownDay, launchDate) {
  const results = {
    total: preRegistrations.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: []
  };

  const today = getTodayStartOfDay();

  for (const preReg of preRegistrations) {
    try {
      // Check if email already sent today
      const { data: existingEmail } = await checkEmailAlreadySent(
        supabase,
        preReg.id,
        countdownDay,
        today
      );

      if (existingEmail) {
        console.log(`Skipping ${preReg.email} - already sent today`);
        results.skipped++;
        results.details.push({
          email: preReg.email,
          status: 'skipped',
          reason: 'Already sent today'
        });
        continue;
      }

      // Create tracking record
      const { data: trackingRecord, error: insertError } = await createEmailTracking(supabase, {
        pre_registration_id: preReg.id,
        email_status: EMAIL_STATUS.QUEUED,
        scheduled_at: new Date().toISOString(),
        metadata: {
          countdown_day: countdownDay,
          launch_date: launchDate,
          payment_status: preReg.payment_status,
          source: 'bulk_api'
        }
      });

      if (insertError) {
        console.error(`Error creating tracking record for ${preReg.email}:`, insertError);
        results.failed++;
        results.details.push({
          email: preReg.email,
          status: 'failed',
          reason: 'Failed to create tracking record'
        });
        continue;
      }

      // Update to sending
      await updateEmailTracking(supabase, trackingRecord.id, {
        email_status: EMAIL_STATUS.SENDING
      });

      // Generate and send email
      const html = generateCountdownEmailHtml({
        fullName: preReg.full_name,
        countdownDay: countdownDay,
        launchDate: launchDate
      });

      const subject = getCountdownSubject(countdownDay);

      await sendEmail(env, {
        to: preReg.email,
        subject,
        html,
        from: DEFAULT_FROM_EMAIL,
        fromName: DEFAULT_FROM_NAME,
      });

      // Update status to sent
      await updateEmailTracking(supabase, trackingRecord.id, {
        email_status: EMAIL_STATUS.SENT,
        sent_at: new Date().toISOString()
      });

      console.log(`✓ Email sent to ${preReg.email}`);
      results.sent++;
      results.details.push({
        email: preReg.email,
        status: 'sent',
        tracking_id: trackingRecord.id
      });

    } catch (error) {
      console.error(`Error sending email to ${preReg.email}:`, error);
      results.failed++;
      results.details.push({
        email: preReg.email,
        status: 'failed',
        reason: error.message
      });
    }
  }

  return results;
}
