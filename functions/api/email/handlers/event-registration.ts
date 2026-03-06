/**
 * Event registration email handlers
 * POST /api/email/event-confirmation - Send confirmation emails
 * POST /api/email/event-otp - Send OTP verification email
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { EventConfirmationRequest, EventOTPRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { EmailWorkerClient } from '../services/worker-client';
import { getEmailWorkerConfig, APP_URL } from '../config';
import { eventConfirmationTemplate, otpTemplate } from '../templates';

/**
 * Handle event registration confirmation emails
 * Sends both user confirmation and admin notification
 * POST /api/email/event-confirmation
 */
export async function handleEventConfirmation(
  body: EventConfirmationRequest,
  env: PagesEnv,
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
    const workerConfig = getEmailWorkerConfig(env);
    const client = new EmailWorkerClient(workerConfig);
    
    const userHtml = eventConfirmationTemplate({
      name,
      email,
      phone,
      amount,
      orderId: orderId || 'N/A',
      receiptLink: `${APP_URL}/api/email/download-receipt/${orderId}`,
    });
    
    // Send both emails in parallel
    await Promise.all([
      // User confirmation email
      client.sendEmail({
        to: email,
        subject: 'Registration Confirmed - Skill Passport Event',
        html: userHtml,
      }),
      // Admin notification email
      client.sendEmail({
        to: 'naveen@rareminds.in',
        subject: `New Registration: ${name} (₹${amount.toLocaleString()})`,
        html: `
          <h2>New Registration</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
          <p><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
          <p><strong>Campaign:</strong> ${campaign || 'direct'}</p>
        `,
      })
    ]);

    return jsonResponse({
      success: true,
      message: 'Confirmation emails sent successfully',
      data: {
        userEmail: email,
        adminEmail: 'dev@rareminds.in'
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
  env: PagesEnv,
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
    const workerConfig = getEmailWorkerConfig(env);
    const client = new EmailWorkerClient(workerConfig);
    
    const html = otpTemplate({ otp, name });
    
    await client.sendEmail({
      to: email,
      subject: 'Your Verification Code - Skill Passport',
      html,
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
