/**
 * Enhanced email sending service with attachment support
 * For now, falls back to regular email without attachments
 * TODO: Implement proper MIME multipart when worker-mailer supports it
 */

import { sendEmail } from './mailer.js';

/**
 * Send email with optional PDF attachment
 * Currently falls back to regular email (attachments not yet supported)
 */
export async function sendEmailWithAttachment(env, emailData) {
  const { to, subject, html, text, from, fromName, attachments } = emailData;

  console.log(`Attempting to send email with ${attachments?.length || 0} attachment(s)`);
  
  // For now, send without attachments using regular mailer
  // TODO: Implement proper MIME multipart support
  console.warn('PDF attachments not yet fully supported - sending email without attachment');
  
  return await sendEmail(env, {
    to,
    subject,
    html,
    text,
    from,
    fromName
  });
}
