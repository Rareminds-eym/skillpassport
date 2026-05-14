/**
 * Generic email sending handler
 * POST /api/email/send or /api/email
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { GenericEmailRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { apiLogger } from '../../../lib/logger';
import { sendEmail } from '../../../lib/email-service';

export async function handleGenericEmail(
  body: GenericEmailRequest,
  env: PagesEnv,
  _supabase: SupabaseClient // Required by API contract but not used in this handler
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

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    apiLogger.info('Generic email sent via email-worker', { to, subject, messageId: result.messageId });

    return jsonResponse({
      success: true,
      message: 'Email sent successfully',
      data: { messageId: result.messageId }
    });
  } catch (error: unknown) {
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to send email';
    
    const errorObject = error instanceof Error ? error : new Error(String(error));
    
    apiLogger.error('Error sending email', errorObject);
    
    return jsonResponse({
      success: false,
      error: errorMessage
    }, 500);
  }
}
