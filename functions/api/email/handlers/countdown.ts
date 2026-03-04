/**
 * Countdown email handler
 * POST /api/email/countdown
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../../../src/functions-lib/types';
import type { CountdownEmailRequest } from '../types';
import { EMAIL_STATUS } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { sendEmail } from '../services/mailer';
import { generateCountdownEmailHtml, getCountdownSubject } from '../services/templates';
import { 
  findPreRegistrationByEmail, 
  createEmailTracking, 
  updateEmailTracking 
} from '../services/database';

export async function handleCountdownEmail(
  body: CountdownEmailRequest,
  env: Env,
  supabase: SupabaseClient
): Promise<Response> {
  const { to, fullName, countdownDay, launchDate } = body;

  if (!to || !fullName || !countdownDay || !launchDate) {
    return jsonResponse({
      success: false,
      error: 'Missing required fields: to, fullName, countdownDay, launchDate'
    }, 400);
  }

  let trackingId: string | null = null;

  try {
    // Create tracking record if Supabase is configured
    if (supabase) {
      const { data: preReg } = await findPreRegistrationByEmail(supabase, to);

      if (preReg) {
        const { data: tracking } = await createEmailTracking(supabase, {
          pre_registration_id: preReg.id,
          email_status: EMAIL_STATUS.QUEUED,
          scheduled_at: new Date().toISOString(),
          metadata: {
            countdown_day: countdownDay,
            launch_date: launchDate,
            source: 'manual_api'
          }
        });

        if (tracking) {
          trackingId = tracking.id;
          await updateEmailTracking(supabase, trackingId, {
            email_status: EMAIL_STATUS.SENDING
          });
        }
      }
    }

    // Generate and send email
    const html = generateCountdownEmailHtml({ fullName, countdownDay, launchDate });
    const subject = getCountdownSubject(countdownDay);

    const result = await sendEmail(env, {
      to,
      subject,
      html,
      from: env.FROM_EMAIL || 'noreply@rareminds.in',
      fromName: env.FROM_NAME || 'Skill Passport',
    });

    // Update tracking status to sent
    if (trackingId && supabase) {
      await updateEmailTracking(supabase, trackingId, {
        email_status: EMAIL_STATUS.SENT,
        sent_at: new Date().toISOString()
      });
    }

    return jsonResponse({
      success: true,
      message: 'Countdown email sent successfully',
      data: result
    });

  } catch (error: any) {
    console.error('Error in handleCountdownEmail:', error);

    // Update tracking status to failed
    if (trackingId && supabase) {
      await updateEmailTracking(supabase, trackingId, {
        email_status: EMAIL_STATUS.FAILED,
        failed_at: new Date().toISOString(),
        error_message: error.message,
        retry_count: 1
      });
    }

    return jsonResponse({
      success: false,
      error: error.message || 'Failed to send countdown email'
    }, 500);
  }
}
