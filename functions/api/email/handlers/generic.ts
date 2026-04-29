/**
 * Generic email sending handler
 * POST /api/email/send or /api/email
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../../../src/functions-lib/types';
import type { GenericEmailRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';

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
    const response = await fetch(env.EMAIL_WORKER_URL || 'http://127.0.0.1:8787/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': env.INTERNAL_API_KEY || 'dev-test1232312',
      },
      body: JSON.stringify({ to, subject, html, text, from, fromName }),
    });

    if (!response.ok) {
      throw new Error(`Email worker failed with status ${response.status}`);
    }

    const result = await response.json();

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
