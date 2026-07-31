/**
 * Centralized Email Service
 * Single source of truth for all email operations via email-worker service binding
 */

import type { PagesEnv } from './types';
import { apiLogger } from './logger';
import { z } from 'zod';

// Zod schema for email service response validation
const emailServiceResponseSchema = z.object({
  messageId: z.string().optional()
});

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via email-worker using service binding
 * @throws Error if EMAIL_SERVICE binding is not configured
 */
export async function sendEmail(
  env: PagesEnv,
  payload: EmailPayload
): Promise<EmailResult> {
  if (!env.EMAIL_SERVICE) {
    throw new Error('EMAIL_SERVICE binding is not configured');
  }

  try {
    apiLogger.info('Sending email via service binding RPC');
    
    // Use RPC method directly instead of HTTP request
    const result = await env.EMAIL_SERVICE.sendEmail({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text || '',
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    // Validate the result structure using Zod
    let validatedResult;
    try {
      validatedResult = emailServiceResponseSchema.parse(result);
    } catch (parseError) {
      apiLogger.error('Invalid email service response format', parseError as Error);
      throw new Error('Invalid email service response');
    }

    apiLogger.info('Email sent successfully via service binding RPC', { result });
    
    return {
      success: true,
      messageId: validatedResult.messageId,
    };
  } catch (error) {
    apiLogger.error('Failed to send email', error as Error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email with simplified error handling (logs but doesn't throw)
 * Useful for non-critical emails that shouldn't block the main flow
 */
export async function sendEmailSafe(
  env: PagesEnv,
  payload: EmailPayload
): Promise<boolean> {
  try {
    const result = await sendEmail(env, payload);
    return result.success;
  } catch (error) {
    apiLogger.error('Email sending failed (non-critical)', error as Error);
    return false;
  }
}

/**
 * Validate email environment configuration
 * @throws Error if required environment variables are missing
 */
export function validateEmailEnv(env: PagesEnv): void {
  if (!env.EMAIL_SERVICE) {
    throw new Error('Missing required: EMAIL_SERVICE binding');
  }
}

/**
 * Check if email environment is configured (non-throwing)
 */
export function isEmailConfigured(env: PagesEnv): boolean {
  return !!env.EMAIL_SERVICE;
}
