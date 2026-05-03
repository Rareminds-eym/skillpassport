/**
 * Countdown email handler
 * POST /api/email/countdown
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { CountdownEmailRequest } from '../types';
import { EMAIL_STATUS } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { generateCountdownEmailHtml, getCountdownSubject } from '../services/templates';
import { apiLogger } from '../../../lib/logger';
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
          await updateEmailTracking(supabase, trackingId, {
            email_status: EMAIL_STATUS.SENDING
          });
        }
      }
    }

    // Generate and send email
    if (!env.INTERNAL_API_KEY) {
      throw new Error('INTERNAL_API_KEY environment variable is not configured');
    }
    if (!env.EMAIL_WORKER_URL) {
      throw new Error('EMAIL_WORKER_URL environment variable is not configured');
    }

    const html = generateCountdownEmailHtml({ fullName, countdownDay, launchDate });
    const subject = getCountdownSubject(countdownDay);

    const response = await fetch(`${env.EMAIL_WORKER_URL}/send`, {

      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': env.INTERNAL_API_KEY,
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email worker failed: ${errorText}`);
    }

    const result = await response.json();

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

  } catch (error: unknown) {
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to send countdown email';
    
    const errorObject = error instanceof Error ? error : new Error(String(error));
    
    apiLogger.error('Error in handleCountdownEmail', errorObject);

    // Update tracking status to failed (only if trackingId exists)
    if (trackingId && supabase) {
      try {
        await updateEmailTracking(supabase, trackingId, {
          email_status: EMAIL_STATUS.FAILED,
          failed_at: new Date().toISOString(),
          error_message: errorMessage,
          retry_count: 1
        });
      } catch (trackingError) {
        // Log tracking update failure but don't throw
        apiLogger.error('Failed to update email tracking status', 
          trackingError instanceof Error ? trackingError : new Error(String(trackingError))
        );
      }
    }

    return jsonResponse({
      success: false,
      error: errorMessage
    }, 500);
  }
}
