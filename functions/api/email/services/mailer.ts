/**
 * Email sending service using worker-mailer
 */

import { WorkerMailer } from 'worker-mailer';
import type { Env } from '../../../../src/functions-lib/types';
import type { EmailData, EmailResult, SmtpConfig, FromAddress } from '../types';

export function buildSmtpConfig(env: Env): SmtpConfig {
  const smtpHost = env.SMTP_HOST;
  const smtpPort = parseInt(env.SMTP_PORT || '587');
  const smtpUser = env.SMTP_USER;
  const smtpPass = env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP configuration missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS');
  }

  return {
    host: smtpHost,
    port: smtpPort,
    secure: false,
    startTls: true,
    authType: 'plain',
    credentials: {
      username: smtpUser,
      password: smtpPass,
    },
  };
}

export function getFromAddress(env: Env, customFrom?: string, customFromName?: string): FromAddress {
  const defaultFromEmail = env.FROM_EMAIL || 'noreply@rareminds.in';
  const defaultFromName = env.FROM_NAME || 'Skill Passport';

  return {
    email: customFrom || defaultFromEmail,
    name: customFromName || defaultFromName,
  };
}

export async function sendEmail(env: Env, emailData: EmailData): Promise<EmailResult> {
  const { to, subject, html, text, from, fromName } = emailData;

  const smtpConfig = buildSmtpConfig(env);
  const fromAddress = getFromAddress(env, from, fromName);
  const recipients = Array.isArray(to) ? to : [to];

  console.log(`Sending email to: ${recipients.join(', ')}`);
  console.log(`From: ${fromAddress.name} <${fromAddress.email}>`);

  await WorkerMailer.send(smtpConfig, {
    from: fromAddress,
    to: recipients,
    subject: subject,
    text: text || 'Please view this email in an HTML-capable email client.',
    html: html,
  });

  console.log('Email sent successfully');

  return {
    success: true,
    recipients: recipients,
  };
}

export async function sendEmailWithErrorHandling(env: Env, emailData: EmailData): Promise<EmailResult> {
  try {
    const result = await sendEmail(env, emailData);
    return { success: true, ...result };
  } catch (error: any) {
    const errorType = classifyEmailError(error);
    
    return {
      success: false,
      error: error.message,
      errorType: errorType,
      shouldRetry: errorType !== 'permanent'
    };
  }
}

function classifyEmailError(error: any): 'permanent' | 'temporary' | 'unknown' {
  const errorMessage = error.message?.toLowerCase() || '';

  // Permanent failures (don't retry)
  if (
    errorMessage.includes('invalid email') ||
    errorMessage.includes('mailbox not found') ||
    errorMessage.includes('user unknown') ||
    errorMessage.includes('address rejected') ||
    errorMessage.includes('does not exist')
  ) {
    return 'permanent';
  }

  // Temporary failures (retry)
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('network') ||
    errorMessage.includes('temporarily') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('quota')
  ) {
    return 'temporary';
  }

  // Unknown errors (retry with caution)
  return 'unknown';
}
