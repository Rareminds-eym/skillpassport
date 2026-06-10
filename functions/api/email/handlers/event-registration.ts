/**
 * Event registration email handlers
 * POST /api/email/event-confirmation - Send confirmation emails
 * POST /api/email/event-otp - Send OTP verification email
 */

import type { Env } from '../../../lib/types';
import type { EventConfirmationRequest, EventOTPRequest } from '../types';
import { apiSuccess, apiError } from '../../../lib/response';
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
  env: Env
): Promise<Response> {
  const { name, email, phone, amount, orderId, campaign } = body;

  if (!name || !email || !phone || !amount) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: name, email, phone, amount');
  }

  // Validate required env vars first (fail-fast)
  if (!env.ADMIN_EMAIL) {
    return apiError(500, 'INTERNAL_ERROR', 'ADMIN_EMAIL environment variable is not configured');
  }
  if (!env.APP_URL) {
    return apiError(500, 'INTERNAL_ERROR', 'APP_URL environment variable is not configured');
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

    return apiSuccess({
      message: 'Confirmation emails sent successfully',
      data: {
        userEmail: email,
        adminEmail: env.ADMIN_EMAIL
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send confirmation emails';
    apiLogger.error('Error sending event confirmation emails', error as Error);
    return apiError(500, 'INTERNAL_ERROR', errorMessage);
  }
}

/**
 * Handle OTP verification email
 * POST /api/email/event-otp
 */
export async function handleEventOTP(
  body: EventOTPRequest,
  env: Env
): Promise<Response> {
  const { email, otp, name } = body;

  if (!email || !otp) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: email, otp');
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

    return apiSuccess({
      message: 'OTP email sent successfully',
      data: { email, messageId: result.messageId }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP email';
    apiLogger.error('Error sending OTP email', error as Error);
    return apiError(500, 'INTERNAL_ERROR', errorMessage);
  }
}
