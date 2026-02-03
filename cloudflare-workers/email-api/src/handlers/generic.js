/**
 * Generic email sending handler
 * POST /
 */

import { sendEmail } from '../services/mailer.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function handleGenericEmail(body, env) {
  const { to, subject, html, text, from, fromName } = body;

  if (!to || !subject || !html) {
    return errorResponse(
      'Missing required fields: to, subject, html',
      null,
      400
    );
  }

  try {
    const result = await sendEmail(env, {
      to,
      subject,
      html,
      text,
      from,
      fromName,
    });

    return successResponse('Email sent successfully', result);
  } catch (error) {
    console.error('Error sending email:', error);
    return errorResponse('Failed to send email', error.message);
  }
}
