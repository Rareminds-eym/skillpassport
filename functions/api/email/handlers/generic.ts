/**
 * Generic email sending handler
 * POST /api/email/send or /api/email
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../../../src/functions-lib/types';
import type { GenericEmailRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { sendEmail } from '../services/mailer';

export async function handleGenericEmail(
  body: GenericEmailRequest,
  env: Env,
  supabase: SupabaseClient
): Promise<Response> {
  const { to, subject, html, text, from, fromName } = body;

  if (!to || !subject || !html) {
    return jsonResponse({
      success: false,
      error: 'Missing required fields: to, subject, html'
    }, 400);
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

    return jsonResponse({
      success: true,
      message: 'Email sent successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return jsonResponse({
      success: false,
      error: error.message || 'Failed to send email'
    }, 500);
  }
}
