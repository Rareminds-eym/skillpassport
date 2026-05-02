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
    if (!env.INTERNAL_API_KEY) {
      throw new Error('INTERNAL_API_KEY is not configured');
    }
    if (!env.EMAIL_WORKER_URL) {
      throw new Error('EMAIL_WORKER_URL is not configured');
    }

    const response = await fetch(`${env.EMAIL_WORKER_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': env.INTERNAL_API_KEY,
      },
      body: JSON.stringify({ to, subject, html, text, from, fromName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email worker failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('Generic email sent via email-worker:', { to, subject });

    return jsonResponse({
      success: true,
      message: 'Email sent successfully',
      data: result
    });
  } catch (error: any) {
    apiLogger.error('Error sending email', error);
    return jsonResponse({
      success: false,
      error: error.message || 'Failed to send email'
    }, 500);
  }
}
