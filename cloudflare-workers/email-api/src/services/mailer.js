/**
 * Email sending service using worker-mailer
 */

import { WorkerMailer } from 'worker-mailer';
import { buildSmtpConfig, getFromAddress } from '../config/smtp.js';

export async function sendEmail(env, emailData) {
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

export async function sendEmailWithErrorHandling(env, emailData) {
  try {
    const result = await sendEmail(env, emailData);
    return { success: true, ...result };
  } catch (error) {
    const errorType = classifyEmailError(error);
    
    return {
      success: false,
      error: error.message,
      errorType: errorType,
      shouldRetry: errorType !== 'permanent'
    };
  }
}

function classifyEmailError(error) {
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
