/**
 * Centralized Email Service
 * Single source of truth for all email operations via email-worker
 * 
 * Supports both service binding (preferred) and HTTP (fallback)
 */

import type { PagesEnv } from '../../src/functions-lib/types';
import { apiLogger } from './logger';

const FROM_EMAIL = 'noreply@rareminds.in';
const FROM_NAME = 'Skill Passport';

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via email-worker using service binding (preferred) or HTTP (fallback)
 * @throws Error if EMAIL_SERVICE binding and EMAIL_API_URL are not configured
 */
export async function sendEmail(
  env: PagesEnv,
  payload: EmailPayload
): Promise<EmailResult> {
  // Try service binding first (fast, type-safe)
  if (env.EMAIL_SERVICE) {
    try {
      apiLogger.info('Sending email via service binding');
      
      const response = await env.EMAIL_SERVICE.fetch(
        new Request('https://internal/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Api-Key': env.EMAIL_API_KEY || 'service-binding',
          },
          body: JSON.stringify({
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text || '',
            from: payload.from || FROM_EMAIL,
            fromName: payload.fromName || FROM_NAME,
          }),
        })
      );

      if (!response.ok) {
        const errorText = await response.text();
        apiLogger.error('Email service binding error', new Error(`HTTP ${response.status}: ${errorText}`));
        
        // Don't throw, fall through to HTTP fallback
      } else {
        const result = await response.json();
        apiLogger.info('Email sent successfully via service binding', { result });
        
        return {
          success: true,
          messageId: result.messageId || result.id,
        };
      }
    } catch (error) {
      apiLogger.warn('Service binding failed, falling back to HTTP', error as Error);
      // Fall through to HTTP
    }
  }

  // Fallback to HTTP if service binding not available or failed
  if (!env.EMAIL_API_URL) {
    throw new Error('Neither EMAIL_SERVICE binding nor EMAIL_API_URL is configured');
  }
  
  if (!env.EMAIL_API_KEY) {
    throw new Error('EMAIL_API_KEY environment variable is not configured');
  }

  try {
    apiLogger.info('Sending email via HTTP (fallback)');
    
    const response = await fetch(`${env.EMAIL_API_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': env.EMAIL_API_KEY,
      },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text || '',
        from: payload.from || FROM_EMAIL,
        fromName: payload.fromName || FROM_NAME,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      apiLogger.error('Email API error', new Error(`HTTP ${response.status}: ${errorText}`));
      return {
        success: false,
        error: `Email API error: HTTP ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    apiLogger.info('Email sent successfully via HTTP', { result });
    
    return {
      success: true,
      messageId: result.messageId || result.id,
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
  if (!env.EMAIL_SERVICE && !env.EMAIL_API_URL) {
    throw new Error('Missing required: EMAIL_SERVICE binding or EMAIL_API_URL');
  }
  if (!env.EMAIL_SERVICE && !env.EMAIL_API_KEY) {
    throw new Error('Missing required environment variable: EMAIL_API_KEY (when using HTTP)');
  }
}

/**
 * Check if email environment is configured (non-throwing)
 */
export function isEmailConfigured(env: PagesEnv): boolean {
  return !!(env.EMAIL_SERVICE || (env.EMAIL_API_URL && env.EMAIL_API_KEY));
}
