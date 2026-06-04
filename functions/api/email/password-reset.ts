/**
 * Password Reset Email Template API
 * POST /api/email/password-reset
 * 
 * Called by SSO Worker to send beautiful password reset emails
 */

import type { Env } from '../../../src/functions-lib/types';
import { jsonResponse } from '../../../src/functions-lib';
import { sendEmail, isEmailConfigured } from '../../lib/email-service';
import { generatePasswordResetLinkHtml } from './services/templates';
import { apiLogger } from '../../lib/logger';

interface PasswordResetEmailRequest {
  to: string;
  resetUrl: string;
  templateOnly?: boolean;  // If true, return template data instead of sending email
}

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

    // Parse request body
    let body: PasswordResetEmailRequest;
    try {
      const parsed = await request.json();
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid payload');
      }
      body = parsed as PasswordResetEmailRequest;
    } catch (error) {
      apiLogger.error('Invalid JSON in password reset email request', error as Error);
      return jsonResponse({ 
        success: false, 
        error: 'Invalid JSON payload' 
      }, 400);
    }

    // Validate required fields
    if (!body.to) {
      return jsonResponse({
        success: false,
        error: 'to email address is required'
      }, 400);
    }

    if (!body.resetUrl) {
      return jsonResponse({
        success: false,
        error: 'resetUrl is required'
      }, 400);
    }

    // Validate email format with more robust regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(body.to)) {
      return jsonResponse({
        success: false,
        error: 'Invalid email format'
      }, 400);
    }

    apiLogger.info('Processing password reset email request', {
      to: body.to
      // Note: resetUrl not logged for security reasons
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