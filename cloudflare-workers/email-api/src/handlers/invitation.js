/**
 * Organization invitation email handler
 * POST /invitation
 */

import { generateInvitationEmailHtml, getInvitationSubject } from '../templates/invitation.js';
import { sendEmail } from '../services/mailer.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME } from '../config/constants.js';

export async function handleInvitationEmail(body, env) {
  const { 
    to, 
    organizationName, 
    memberType, 
    invitationToken, 
    expiresAt, 
    customMessage 
  } = body;

  // Validate required fields
  if (!to || !organizationName || !memberType || !invitationToken || !expiresAt) {
    return errorResponse(
      'Missing required fields: to, organizationName, memberType, invitationToken, expiresAt',
      null,
      400
    );
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
      from: DEFAULT_FROM_EMAIL,
      fromName: DEFAULT_FROM_NAME,
    });

    return successResponse('Invitation email sent successfully', result);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return errorResponse('Failed to send invitation email', error.message);
  }
}
