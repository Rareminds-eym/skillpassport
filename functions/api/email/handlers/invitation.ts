/**
 * Organization invitation email handler
 * POST /api/email/invitation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../../../../src/functions-lib/types';
import type { InvitationEmailRequest } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { authenticateUser } from '../../shared/auth';
import { generateInvitationEmailHtml, getInvitationSubject } from '../services/templates';
import { apiLogger } from '../../../lib/logger';

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
    // Validate required env vars
    if (!env.INTERNAL_API_KEY) {
      throw new Error('INTERNAL_API_KEY environment variable is not configured');
    }
    if (!env.EMAIL_WORKER_URL) {
      throw new Error('EMAIL_WORKER_URL environment variable is not configured');
    }

    const html = generateInvitationEmailHtml({
      organizationName,
      memberType,
      invitationToken,
      expiresAt,
      customMessage
    });

    const subject = getInvitationSubject(organizationName);

    const response = await fetch(`${env.EMAIL_WORKER_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': env.INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        from: 'noreply@rareminds.in',
        fromName: 'Skill Passport',
      }),
    });

    if (!response.ok) {
      throw new Error(`Email worker failed with status ${response.status}`);
    }

    const result = await response.json();

    return jsonResponse({
      success: true,
      message: 'Invitation email sent successfully',
      data: result
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
