/**
 * Event registration email handlers
 * POST /api/email/event-confirmation - Send confirmation emails
 * POST /api/email/event-otp - Send OTP verification email
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../../../src/functions-lib/types';
import type { EventConfirmationRequest, EventOTPRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { apiLogger } from '../../../lib/logger';
import { sendEmail } from '../../../lib/email-service';
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

  // Validate required env vars first (fail-fast)
  if (!env.ADMIN_EMAIL) {
    return jsonResponse({
      success: false,
      error: 'ADMIN_EMAIL environment variable is not configured'
    }, 500);
  }
  if (!env.APP_URL) {
    return jsonResponse({
      success: false,
      error: 'APP_URL environment variable is not configured'
    }, 500);
  }

  try {

    // Base URL for PDF download link
    const baseUrl = env.APP_URL;
    
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

    // Send both emails in parallel using centralized service
    const results = await Promise.all([
      // User confirmation email
      sendEmail(env, {
        to: email,
        subject: userSubject,
        html: userHtml,
      }).catch((error) => {
        apiLogger.error('User confirmation email error', error);
        throw error;
      }),
      // Admin notification email
      sendEmail(env, {
        to: env.ADMIN_EMAIL,
        subject: adminSubject,
        html: adminHtml,
      }).catch((error) => {
        apiLogger.error('Admin notification email error', error);
        throw error;
      }),
    ]);

    // Check if both emails succeeded
    if (!results[0].success || !results[1].success) {
      throw new Error('One or more emails failed to send');
    }

    // Log successful email sends
    apiLogger.info('Both confirmation emails sent successfully', {
      userEmail: email,
      adminEmail: env.ADMIN_EMAIL,
      userMessageId: results[0].messageId,
      adminMessageId: results[1].messageId,
    });

    return jsonResponse({
      success: true,
      message: 'Confirmation emails sent successfully',
      data: {
        userEmail: email,
        adminEmail: env.ADMIN_EMAIL
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send confirmation emails';
    apiLogger.error('Error sending event confirmation emails', error as Error);
    return jsonResponse({
      success: false,
      error: errorMessage
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

    const result = await sendEmail(env, {
      to: email,
      subject,
      html,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    return jsonResponse({
      success: true,
      message: 'OTP email sent successfully',
      data: { email, messageId: result.messageId }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP email';
    apiLogger.error('Error sending OTP email', error as Error);
    return jsonResponse({
      success: false,
      error: errorMessage
    }, 500);
  }
}
