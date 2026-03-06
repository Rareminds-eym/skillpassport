/**
 * Countdown email handler
 * POST /api/email/countdown
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { CountdownEmailRequest } from '../types';
import { EMAIL_STATUS } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { EmailWorkerClient } from '../services/worker-client';
import { getEmailWorkerConfig, APP_URL } from '../config';
import { countdownTemplate } from '../templates';
import { 
  findPreRegistrationByEmail, 
  createEmailTracking, 
  updateEmailTracking 
} from '../services/database';

export async function handleCountdownEmail(
  body: CountdownEmailRequest,
  env: PagesEnv,
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
          if (trackingId) {
            await updateEmailTracking(supabase, trackingId, {
              email_status: EMAIL_STATUS.SENDING
            });
          }
        }
      }
    }

    // Send via worker
    const workerConfig = getEmailWorkerConfig(env);
    const client = new EmailWorkerClient(workerConfig);
    
    const html = countdownTemplate({
      fullName,
      countdownDay,
      launchDate,
      registrationLink: `${APP_URL}/pre-registration`,
    });
    
    const result = await client.sendEmail({
      to,
      subject: `${countdownDay} Days Until Skill Passport Launch! 🚀`,
      html,
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
