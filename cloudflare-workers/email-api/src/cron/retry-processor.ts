/**
 * Failed email retry processor for CRON jobs
 */

import { generateCountdownEmailHtml, getCountdownSubject } from '../templates/countdown';
import { sendEmail } from '../services/mailer';
import { 
  createSupabaseClient,
  getFailedEmails,
  updateEmailTracking
} from '../services/supabase';
import { calculateBackoffHours, getHoursSince } from '../utils/date';
import { MAX_RETRY_ATTEMPTS, RETRY_BATCH_SIZE, EMAIL_STATUS, DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME } from '../config/constants';
import type { Env, FailedEmailRecord } from '../types';
import { SupabaseClient } from '@supabase/supabase-js';

export async function retryFailedEmails(env: Env): Promise<void> {
  console.log('Starting failed email retry process...');

  const supabase = createSupabaseClient(env);
  if (!supabase) {
    console.error('Supabase configuration missing');
    return;
  }

  const maxRetries = parseInt(env.MAX_EMAIL_RETRIES || String(MAX_RETRY_ATTEMPTS));

  const { data: failedEmails, error: fetchError } = await getFailedEmails(
    supabase,
    maxRetries,
    RETRY_BATCH_SIZE
  );

  if (fetchError) {
    console.error('Error fetching failed emails:', fetchError);
    return;
  }

  if (!failedEmails || failedEmails.length === 0) {
    console.log('No failed emails to retry');
    return;
  }

  console.log(`Found ${failedEmails.length} failed emails to retry`);

  for (const emailRecord of failedEmails) {
    await retryIndividualEmail(supabase, env, emailRecord, maxRetries);
  }

  console.log('Failed email retry process completed');
}

async function retryIndividualEmail(
  supabase: SupabaseClient,
  env: Env,
  emailRecord: FailedEmailRecord,
  maxRetries: number
): Promise<void> {
  try {
    const preReg = emailRecord.pre_registrations;
    const countdownDay = parseInt(emailRecord.metadata?.countdown_day || '0');
    const launchDate = emailRecord.metadata?.launch_date || env.LAUNCH_DATE;

    // Check exponential backoff
    const backoffHours = calculateBackoffHours(emailRecord.retry_count);
    const hoursSinceFailure = getHoursSince(emailRecord.failed_at);

    if (hoursSinceFailure < backoffHours) {
      console.log(`Skipping ${preReg.email} - backoff period not elapsed (${hoursSinceFailure.toFixed(1)}h / ${backoffHours}h)`);
      return;
    }

    console.log(`Retrying email to ${preReg.email} (attempt ${emailRecord.retry_count + 1}/${maxRetries})...`);

    // Update status to sending
    await updateEmailTracking(supabase, emailRecord.id, {
      email_status: EMAIL_STATUS.SENDING,
      error_message: undefined
    });

    // Generate and send email
    const html = generateCountdownEmailHtml({
      fullName: preReg.full_name,
      countdownDay: countdownDay,
      launchDate: launchDate || '2026-02-01'
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
    await updateEmailTracking(supabase, emailRecord.id, {
      email_status: EMAIL_STATUS.SENT,
      sent_at: new Date().toISOString(),
      error_message: undefined
    });

    console.log(`✓ Retry successful for ${preReg.email}`);

  } catch (error) {
    console.error(`Retry failed for ${emailRecord.pre_registrations?.email}:`, error);

    const newRetryCount = emailRecord.retry_count + 1;
    const updateData: any = {
      email_status: EMAIL_STATUS.FAILED,
      failed_at: new Date().toISOString(),
      error_message: `[Retry ${newRetryCount}] ${(error as Error).message}`,
      retry_count: newRetryCount
    };

    // If max retries reached, mark as permanently failed
    if (newRetryCount >= maxRetries) {
      updateData.email_status = EMAIL_STATUS.REJECTED;
      updateData.error_message = `[Max retries reached] ${(error as Error).message}`;
      console.error(`✗ Max retries reached for ${emailRecord.pre_registrations?.email} - marking as rejected`);
    }

    await updateEmailTracking(supabase, emailRecord.id, updateData);
  }
}
