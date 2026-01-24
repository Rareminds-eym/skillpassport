/**
 * Helper functions for countdown email processing
 */

import { generateCountdownEmailHtml, getCountdownSubject } from '../templates/countdown.js';
import { sendEmail } from '../services/mailer.js';
import { 
  checkEmailAlreadySent,
  createEmailTracking,
  updateEmailTracking
} from '../services/supabase.js';
import { EMAIL_STATUS, DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME } from '../config/constants.js';

export async function processIndividualCountdownEmail(supabase, env, preReg, daysUntilLaunch, launchDate) {
  try {
    // Check if email already sent for this countdown day
    const { data: existingEmail } = await checkEmailAlreadySent(
      supabase,
      preReg.id,
      daysUntilLaunch
    );

    if (existingEmail) {
      console.log(`Email already sent to ${preReg.email} for countdown day ${daysUntilLaunch}`);
      return;
    }

    // Create email tracking record
    const scheduledAt = new Date();
    const { data: trackingRecord, error: insertError } = await createEmailTracking(supabase, {
      pre_registration_id: preReg.id,
      email_status: EMAIL_STATUS.QUEUED,
      scheduled_at: scheduledAt.toISOString(),
      metadata: {
        countdown_day: daysUntilLaunch,
        launch_date: launchDate,
        payment_status: preReg.payment_status,
        campaign: 'countdown'
      }
    });

    if (insertError) {
      console.error(`Error creating tracking record for ${preReg.email}:`, insertError);
      return;
    }

    console.log(`Sending countdown email to ${preReg.email}...`);

    // Update status to sending
    await updateEmailTracking(supabase, trackingRecord.id, {
      email_status: EMAIL_STATUS.SENDING
    });

    // Generate and send email
    const html = generateCountdownEmailHtml({
      fullName: preReg.full_name,
      countdownDay: daysUntilLaunch,
      launchDate: launchDate
    });

    const subject = getCountdownSubject(daysUntilLaunch);

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

    console.log(`✓ Email sent successfully to ${preReg.email}`);

  } catch (error) {
    console.error(`Error sending email to ${preReg.email}:`, error);

    // Update status to failed
    if (trackingRecord?.id) {
      await updateEmailTracking(supabase, trackingRecord.id, {
        email_status: EMAIL_STATUS.FAILED,
        failed_at: new Date().toISOString(),
        error_message: error.message,
        retry_count: 1
      });
    }
  }
}
