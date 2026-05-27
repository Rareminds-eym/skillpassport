/**
 * Organization invitation email handler
 * POST /api/email/invitation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../../../src/functions-lib/types';
import type { InvitationEmailRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { authenticateUser } from '../../lib/auth';
import { generateInvitationEmailHtml, getInvitationSubject } from '../services/templates';
import { apiLogger } from '../../../lib/logger';
import { sendEmail } from '../../../lib/email-service';

export async function handleInvitationEmail(
  request: Request,
  body: InvitationEmailRequest,
  env: Env,
  supabase: SupabaseClient
): Promise<Response> {
 const auth = await authenticateUser(request, env as unknown as Record<string, string>);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const { to, organizationName, memberType, invitationToken, expiresAt, customMessage } = body;

  if (!to || !organizationName || !memberType || !invitationToken || !expiresAt) {
    return jsonResponse({
      success: false,
      error: 'Missing required fields: to, organizationName, memberType, invitationToken, expiresAt'
    }, 400);
  }

  try {
    const html = generateInvitationEmailHtml({
      organizationName,
      memberType,
      invitationToken,
      expiresAt,
      customMessage
    });

    const subject = getInvitationSubject(organizationName);

    const result = await sendEmail(env, {
      to,
      subject,
      html,
      from: env.FROM_EMAIL || 'noreply@rareminds.in',
      fromName: env.FROM_NAME || 'Skill Passport',
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    return jsonResponse({
      success: true,
      message: 'Invitation email sent successfully',
      data: { messageId: result.messageId }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation email';
    apiLogger.error('Error sending invitation email', error as Error);
    return jsonResponse({
      success: false,
      error: errorMessage
    }, 500);
  }
}
