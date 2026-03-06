/**
 * Generic email sending handler
 * POST /api/email/send or /api/email
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { GenericEmailRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { EmailWorkerClient } from '../services/worker-client';
import { getEmailWorkerConfig } from '../config';

export async function handleGenericEmail(
  body: GenericEmailRequest,
  env: PagesEnv,
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
    const workerConfig = getEmailWorkerConfig(env);
    const client = new EmailWorkerClient(workerConfig);
    
    const result = await client.sendEmail({
      to,
      subject,
      html,
      text,
      from,
      fromName,
    });

    return jsonResponse(result);
  } catch (error: any) {
    console.error('Error sending email:', error);
    return jsonResponse({
      success: false,
      error: error.message || 'Failed to send email'
    }, 500);
  }
}
