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
    // Validate required env vars
    if (!env.INTERNAL_API_KEY) {
      throw new Error('INTERNAL_API_KEY environment variable is not configured');
    }
    if (!env.ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL environment variable is not configured');
    }
    if (!env.EMAIL_WORKER_URL) {
      throw new Error('EMAIL_WORKER_URL environment variable is not configured');
    }
    if (!env.APP_URL) {
      throw new Error('APP_URL environment variable is not configured');
    }

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

    // Send both emails in parallel
    const emailWorkerUrl = `${env.EMAIL_WORKER_URL}/send`;

    const results = await Promise.all([
      // User confirmation email
      fetch(emailWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Api-Key': env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ to: email, subject: userSubject, html: userHtml }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`User email failed with status ${res.status}: ${errorText}`);
          }
          return res;
        })
        .catch((error) => {
          apiLogger.error('User confirmation email error', error);
          throw error;
        }),
      // Admin notification email
      fetch(emailWorkerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Api-Key': env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ to: env.ADMIN_EMAIL, subject: adminSubject, html: adminHtml }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Admin email failed with status ${res.status}: ${errorText}`);
          }
          return res;
        })
        .catch((error) => {
          apiLogger.error('Admin notification email error', error);
          throw error;
        }),
    ]);

    // Log successful email sends
    apiLogger.info('Both confirmation emails sent successfully', {
      userEmail: email,
      adminEmail: env.ADMIN_EMAIL,
      userStatus: results[0].status,
      adminStatus: results[1].status
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
    if (!env.INTERNAL_API_KEY) {
      throw new Error('INTERNAL_API_KEY environment variable is not configured');
    }
    if (!env.EMAIL_WORKER_URL) {
      throw new Error('EMAIL_WORKER_URL environment variable is not configured');
    }

    const html = generateOTPEmailHtml({ otp, name });
    const subject = getOTPSubject(otp);

    const response = await fetch(`${env.EMAIL_WORKER_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': env.INTERNAL_API_KEY,
      },
      body: JSON.stringify({ to: email, subject, html }),
    });

    if (!response.ok) {
      throw new Error(`Email worker failed with status ${response.status}`);
    }

    const result = await response.json();

    return jsonResponse({
      success: true,
      message: 'OTP email sent successfully',
      data: { email, result }
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
