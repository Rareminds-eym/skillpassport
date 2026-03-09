/**
 * Generic email sending handler
 * POST /
 */

import { sendEmail } from '../services/mailer';
import { successResponse, errorResponse } from '../utils/response';
import type { Env, GenericEmailRequest } from '../types';

export async function handleGenericEmail(body: GenericEmailRequest, env: Env): Promise<Response> {
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
    return errorResponse('Failed to send email', (error as Error).message);
  }
}
