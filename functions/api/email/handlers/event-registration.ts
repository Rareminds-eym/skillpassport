/**
 * Event registration email handlers
 * POST /api/email/event-confirmation - Send confirmation emails
 * POST /api/email/event-otp - Send OTP verification email
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../../../src/functions-lib/types';
import type { EventConfirmationRequest, EventOTPRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { sendEmail } from '../services/mailer';
import {
  generateUserConfirmationHtml,
  generateAdminNotificationHtml,
  generateOTPEmailHtml,
  getUserConfirmationSubject,
  getAdminNotificationSubject,
  getOTPSubject
} from '../services/templates';

/**
 * Handle event registration confirmation emails
 * Sends both user confirmation and admin notification
 * POST /api/email/event-confirmation
 */
export async function handleEventConfirmation(
  body: EventConfirmationRequest,
  env: Env,
  supabase: SupabaseClient
): Promise<Response> {
  const { name, email, phone, amount, orderId, campaign } = body;

  if (!name || !email || !phone || !amount) {
    return jsonResponse({
      success: false,
      error: 'Missing required fields: name, email, phone, amount'
    }, 400);
  }

  try {
    // Determine base URL for PDF download link
    const baseUrl = env.APP_URL || 'https://skillpassport.rareminds.in';
    
    // Generate email templates
    const userHtml = generateUserConfirmationHtml({
      name,
      email,
      phone,
      amount,
      orderId,
      campaign: campaign || 'direct',
      baseUrl
    });

    const adminHtml = generateAdminNotificationHtml({
      name,
      email,
      phone,
      amount,
      orderId,
      campaign: campaign || 'direct'
    });

    const userSubject = getUserConfirmationSubject(name);
    const adminSubject = getAdminNotificationSubject(name, amount);

    // Send both emails in parallel
    const emailWorkerUrl = env.EMAIL_WORKER_URL || 'http://127.0.0.1:8787/send';
    const emailWorkerKey = env.INTERNAL_API_KEY || 'dev-test1232312';

    await Promise.all([
      // User confirmation email
      fetch(emailWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Api-Key': emailWorkerKey,
        },
        body: JSON.stringify({ to: email, subject: userSubject, html: userHtml }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(`Email worker failed with status ${res.status}`);
      }),
      // Admin notification email
      fetch(emailWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Api-Key': emailWorkerKey,
        },
        body: JSON.stringify({ to: 'naveen@rareminds.in', subject: adminSubject, html: adminHtml }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(`Email worker failed with status ${res.status}`);
      }),
    ]);

    return jsonResponse({
      success: true,
      message: 'Confirmation emails sent successfully',
      data: {
        userEmail: email,
        adminEmail: 'naveen@rareminds.in'
      }
    });

  } catch (error: any) {
    console.error('Error sending event confirmation emails:', error);
    return jsonResponse({
      success: false,
      error: error.message || 'Failed to send confirmation emails'
    }, 500);
  }
}

/**
 * Handle OTP verification email
 * POST /api/email/event-otp
 */
export async function handleEventOTP(
  body: EventOTPRequest,
  env: Env,
  supabase: SupabaseClient
): Promise<Response> {
  const { email, otp, name } = body;

  if (!email || !otp) {
    return jsonResponse({
      success: false,
      error: 'Missing required fields: email, otp'
    }, 400);
  }

  try {
    const html = generateOTPEmailHtml({ otp, name });
    const subject = getOTPSubject(otp);

    await sendEmail(env, {
      to: email,
      subject,
      html,
      from: env.FROM_EMAIL || 'noreply@rareminds.in',
      fromName: env.FROM_NAME || 'Skill Passport',
    });

    return jsonResponse({
      success: true,
      message: 'OTP email sent successfully',
      data: { email }
    });

  } catch (error: any) {
    console.error('Error sending OTP email:', error);
    return jsonResponse({
      success: false,
      error: error.message || 'Failed to send OTP email'
    }, 500);
  }
}
