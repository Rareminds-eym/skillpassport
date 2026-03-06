/**
 * Organization invitation email handler
 * POST /api/email/invitation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { InvitationEmailRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { EmailWorkerClient } from '../services/worker-client';
import { getEmailWorkerConfig, APP_URL } from '../config';
import { invitationTemplate } from '../templates';

export async function handleInvitationEmail(
  body: InvitationEmailRequest,
  env: PagesEnv,
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
    const workerConfig = getEmailWorkerConfig(env);
    const client = new EmailWorkerClient(workerConfig);
    
    const html = invitationTemplate({
      organizationName,
      memberType,
      invitationLink: `${APP_URL}/accept-invitation?token=${invitationToken}`,
      expiresAt,
      customMessage,
    });
    
    const result = await client.sendEmail({
      to,
      subject: `You're invited to join ${organizationName}`,
      html,
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
