/**
 * Countdown email handler
 * POST /countdown
 */

import { generateCountdownEmailHtml, getCountdownSubject } from '../templates/countdown.js';
import { sendEmail } from '../services/mailer.js';
import { 
  createSupabaseClient, 
  findPreRegistrationByEmail, 
  createEmailTracking, 
  updateEmailTracking 
} from '../services/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME, EMAIL_STATUS } from '../config/constants.js';

export async function handleCountdownEmail(body, env) {
  const { to, fullName, countdownDay, launchDate } = body;

  // Validate required fields
  if (!to || !fullName || !countdownDay || !launchDate) {
    return errorResponse(
      'Missing required fields: to, fullName, countdownDay, launchDate',
      null,
      400
    );
  }

  let trackingId = null;
  const supabase = createSupabaseClient(env);

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
      from: DEFAULT_FROM_EMAIL,
      fromName: DEFAULT_FROM_NAME,
    });

    // Update tracking status to sent
    if (trackingId && supabase) {
      await updateEmailTracking(supabase, trackingId, {
        email_status: EMAIL_STATUS.SENT,
        sent_at: new Date().toISOString()
      });
    }

    return successResponse('Countdown email sent successfully', result);

  } catch (error) {
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

    return errorResponse('Failed to send countdown email', error.message);
  }
}
