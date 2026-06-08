// @public-endpoint: Sends a password-reset email; intended to be called server-side by the SSO worker. FLAG: add an internal shared-secret header (RBAC guard-matrix, task 11.1/11.4; CC-2)
/**
 * Password Reset Email Template API
 * POST /api/email/password-reset
 * 
 * Called by SSO Worker to send beautiful password reset emails
 */

import { z } from 'zod';
import { isEmailConfigured, sendEmail } from '../../lib/email-service';
import { apiLogger } from '../../lib/logger';
import { jsonResponse } from '../../lib/response';
import type { Env } from '../../lib/types';
import { isValidEmail } from '../../lib/validation';
import { generatePasswordResetLinkHtml } from './services/templates';

const passwordResetEmailSchema = z.object({
  to: z.string({ message: 'to email address is required' })
    .trim()
    .min(1, 'to email address is required')
    .refine(val => isValidEmail(val), { message: 'Invalid email format' }),
  resetUrl: z.string({ message: 'resetUrl is required' })
    .trim()
    .min(1, 'resetUrl is required'),
  templateOnly: z.boolean().optional(),
});

type PasswordResetEmailRequest = z.infer<typeof passwordResetEmailSchema>;

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    // Check if email service is configured
    if (!isEmailConfigured(env)) {
      apiLogger.error('Email service not configured');
      return jsonResponse({
        success: false,
        error: 'Email service not configured'
      }, 500);
    }

    // Parse request body and validate using Zod
    let body: PasswordResetEmailRequest;
    try {
      const parsed = await request.json();
      const result = passwordResetEmailSchema.safeParse(parsed);
      if (!result.success) {
        return jsonResponse({
          success: false,
          error: result.error.issues[0].message
        }, 400);
      }
      body = result.data;
    } catch (error) {
      apiLogger.error('Invalid JSON in password reset email request', error as Error);
      return jsonResponse({
        success: false,
        error: 'Invalid JSON payload'
      }, 400);
    }

    apiLogger.info('Processing password reset email request', {
      to: body.to
      // SECURITY: resetUrl contains sensitive token and MUST NOT be logged
      // This policy should be enforced across all endpoints handling sensitive URLs
    });

    // Generate beautiful HTML email
    const html = generatePasswordResetLinkHtml({ resetUrl: body.resetUrl });

    // Generate plain text version
    const text = `Reset your password - SkillPassport

Hello,

We received a request to reset your password for your SkillPassport account.

Click the link below to reset your password:
${body.resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The SkillPassport Team

© ${new Date().getFullYear()} SkillPassport by RareMinds. All rights reserved.`;

    const subject = 'Reset your password - SkillPassport';

    // If templateOnly mode, return template data without sending
    if (body.templateOnly) {
      return jsonResponse({
        success: true,
        html,
        text,
        subject,
      });
    }

    // Send email via email-worker
    const result = await sendEmail(env, {
      to: body.to,
      subject,
      html,
      text,
      from: 'noreply@rareminds.in',
      fromName: 'SkillPassport'
    });

    if (result.success) {
      apiLogger.info('Password reset email sent successfully', {
        to: body.to,
        messageId: result.messageId
      });

      return jsonResponse({
        success: true,
        message: 'Password reset email sent successfully',
        messageId: result.messageId
      });
    } else {
      apiLogger.error('Failed to send password reset email', new Error(result.error));

      return jsonResponse({
        success: false,
        error: result.error || 'Failed to send email'
      }, 500);
    }

  } catch (error) {
    apiLogger.error('Error processing password reset email request', error as Error);

    return jsonResponse({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
}