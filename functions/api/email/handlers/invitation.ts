/**
 * Organization invitation email handler
 * POST /api/email/invitation
 */

import type { Env } from '../../../lib/types';
import type { InvitationEmailRequest } from '../types';
import { apiSuccess, apiError } from '../../../lib/response';
import { generateInvitationEmailHtml, getInvitationSubject } from '../services/templates';
import { apiLogger } from '../../../lib/logger';
import { sendEmail } from '../../../lib/email-service';

export async function handleInvitationEmail(
  body: InvitationEmailRequest,
  env: Env
): Promise<Response> {
  const { to, organizationName, memberType, invitationToken, expiresAt, customMessage } = body;

  if (!to || !organizationName || !memberType || !invitationToken || !expiresAt) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: to, organizationName, memberType, invitationToken, expiresAt');
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

    return apiSuccess({
      message: 'Invitation email sent successfully',
      data: { messageId: result.messageId }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation email';
    apiLogger.error('Error sending invitation email', error as Error);
    return apiError(500, 'INTERNAL_ERROR', errorMessage);
  }
}
