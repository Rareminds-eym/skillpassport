/**
 * Enhanced email sending service with attachment support
 */

import { sendEmail } from './mailer.js';

/**
 * Send email with optional PDF attachment
 */
export async function sendEmailWithAttachment(env, emailData) {
  const { to, subject, html, text, from, fromName, attachments } = emailData;

  console.log(`Sending email with ${attachments?.length || 0} attachment(s)`);
  
  return await sendEmail(env, {
    to,
    subject,
    html,
    text,
    from,
    fromName,
    attachments: attachments || []
  });
}
