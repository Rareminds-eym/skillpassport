/**
 * Organization invitation email handler
 * POST /api/email/invitation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../../../src/functions-lib/types';
import type { InvitationEmailRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { sendEmail } from '../services/mailer';
import { generateInvitationEmailHtml, getInvitationSubject } from '../services/templates';

export async function handleInvitationEmail(
  body: InvitationEmailRequest,
  env: Env,
  supabase: SupabaseClient
): Promise<Response> {
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

    return jsonResponse({
      success: true,
      message: 'Invitation email sent successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error sending invitation email:', error);
    return jsonResponse({
      success: false,
      error: error.message || 'Failed to send invitation email'
    }, 500);
  }
}
