/**
 * Email sending service using worker-mailer
 */

import { WorkerMailer } from 'worker-mailer';
import { buildSmtpConfig, getFromAddress } from '../config/smtp';
import type { Env, EmailData, EmailResult } from '../types';

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
    return result;
  } catch (error) {
    const errorType = classifyEmailError(error as Error);
    
    return {
      success: false,
      error: (error as Error).message,
      errorType: errorType,
      shouldRetry: errorType !== 'permanent'
    };
  }
}

function classifyEmailError(error: Error): string {
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
