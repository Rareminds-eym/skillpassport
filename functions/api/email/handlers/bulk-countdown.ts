/**
 * Bulk countdown email handler
 * POST /api/email/send-bulk-countdown
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../../lib/types';
import type { BulkCountdownEmailRequest, BulkEmailResult, PreRegistration } from '../types';
import { EMAIL_STATUS } from '../types';
import { apiSuccess, apiError } from '../../../lib/response';
import { sendEmail } from '../../../lib/email-service';
import { generateCountdownEmailHtml, getCountdownSubject } from '../services/templates';
import { 
  getAllPreRegistrations,
  checkEmailAlreadySent,
  createEmailTracking,
  updateEmailTracking
} from '../services/database';

function getTodayStartOfDay(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

export async function handleBulkCountdownEmail(
  body: BulkCountdownEmailRequest,
  env: Env,
  supabase: SupabaseClient
): Promise<Response> {
  const { countdownDay, launchDate } = body;

  if (!countdownDay || !launchDate) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: countdownDay, launchDate');
  }

  if (!supabase) {
    return apiError(500, 'INTERNAL_ERROR', 'Supabase not configured');
  }

  try {
    const { data: preRegistrations, error: fetchError } = await getAllPreRegistrations(supabase);

    if (fetchError) {
      console.error('Error fetching pre-registrations:', fetchError);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch pre-registrations');
    }

    if (!preRegistrations || preRegistrations.length === 0) {
      return apiSuccess({
        message: 'No pre-registrations found',
        data: {
          summary: { total: 0, sent: 0, skipped: 0, failed: 0 },
          details: []
        }
      });
    }

    console.log(`Found ${preRegistrations.length} pre-registrations`);

    const results = await processBulkEmails(
      supabase,
      env,
      preRegistrations,
      countdownDay,
      launchDate
    );

    console.log(`Bulk email completed: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`);

    return apiSuccess({
      message: 'Bulk countdown emails processed',
      data: {
        summary: {
          total: results.total,
          sent: results.sent,
          skipped: results.skipped,
          failed: results.failed
        },
        details: results.details
      }
    });

  } catch (error: any) {
    console.error('Error in handleBulkCountdownEmail:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Failed to send bulk countdown emails');
  }
}

async function processBulkEmails(
  supabase: SupabaseClient,
  env: Env,
  preRegistrations: PreRegistration[],
  countdownDay: number,
  launchDate: string
): Promise<BulkEmailResult> {
  const results: BulkEmailResult = {
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

      if (insertError || !trackingRecord) {
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

    } catch (error: any) {
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
