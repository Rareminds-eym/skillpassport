/**
 * Centralized Email Service
 * Single source of truth for all email operations via email-worker.
 *
 * Uses Cloudflare Service Binding RPC (EMAIL_SERVICE) when available.
 * Falls back to HTTP fetch (EMAIL_WORKER_URL + INTERNAL_API_KEY) for
 * environments where the binding is not yet configured.
 */

import type { PagesEnv } from '../../src/functions-lib/types';
import { apiLogger } from './logger';
import { getEmailService, type EmailWorkerEnv } from './emailBinding';

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
 * Send email via email-worker.
 * Prefers RPC service binding (EMAIL_SERVICE); falls back to HTTP if not bound.
 */
export async function sendEmail(
  env: PagesEnv,
  payload: EmailPayload
): Promise<EmailResult> {
  // ── RPC path (preferred) ──────────────────────────────────────────────────
  const emailEnv = env as unknown as EmailWorkerEnv;
  if (emailEnv.EMAIL_SERVICE) {
    try {
      const worker = getEmailService(emailEnv);
      const result = await worker.sendEmail({
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        from: payload.from || FROM_EMAIL,
        fromName: payload.fromName || FROM_NAME,
      });
      apiLogger.info('Email sent via RPC binding', { messageId: result.messageId });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      apiLogger.error('Email RPC failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown RPC error',
      };
    }
  }

  // ── HTTP fallback (legacy) ────────────────────────────────────────────────
  if (!env.EMAIL_WORKER_URL) {
    throw new Error('EMAIL_WORKER_URL environment variable is not configured');
  }
  if (!env.INTERNAL_API_KEY) {
    throw new Error('INTERNAL_API_KEY environment variable is not configured');
  }

  try {
    const response = await fetch(`${env.EMAIL_WORKER_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': env.INTERNAL_API_KEY,
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

    const result = await response.json() as { messageId?: string; id?: string };
    apiLogger.info('Email sent via HTTP fallback', { result });
    return { success: true, messageId: result.messageId || result.id };
  } catch (error) {
    apiLogger.error('Failed to send email', error as Error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email with simplified error handling (logs but doesn't throw).
 * Useful for non-critical emails that shouldn't block the main flow.
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
 * Validate email environment configuration.
 * Accepts either RPC binding or HTTP fallback config.
 * @throws Error if neither is configured
 */
export function validateEmailEnv(env: PagesEnv): void {
  const emailEnv = env as unknown as EmailWorkerEnv;
  if (emailEnv.EMAIL_SERVICE) return; // RPC binding present — all good
  if (!env.EMAIL_WORKER_URL) {
    throw new Error('Missing required: EMAIL_SERVICE binding or EMAIL_WORKER_URL');
  }
  if (!env.INTERNAL_API_KEY) {
    throw new Error('Missing required: EMAIL_SERVICE binding or INTERNAL_API_KEY');
  }
}

/**
 * Check if email environment is configured (non-throwing).
 */
export function isEmailConfigured(env: PagesEnv): boolean {
  const emailEnv = env as unknown as EmailWorkerEnv;
  return !!(emailEnv.EMAIL_SERVICE || (env.EMAIL_WORKER_URL && env.INTERNAL_API_KEY));
}
