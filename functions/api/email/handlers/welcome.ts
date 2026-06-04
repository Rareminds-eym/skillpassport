/**
 * Welcome Email Handler
 * Sends welcome emails using the template
 */

import type { Env } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { sendEmail } from '../../../lib/email-service';
import {
  generateWelcomeEmailHtml,
  getWelcomeSubject,
  type WelcomeEmailData,
} from '../services/templates';
import { apiLogger } from '../../../lib/logger';

interface WelcomeEmailRequest {
  to: string;
  name: string;
  role: string;
  baseUrl: string;
  additionalInfo?: string;
}

export async function handleWelcomeEmail(
  body: WelcomeEmailRequest,
  env: Env
): Promise<Response> {
  try {
    // Validate required fields
    if (!body.to || !body.name || !body.role || !body.baseUrl) {
      return jsonResponse(
        {
          success: false,
          error: 'Missing required fields: to, name, role, baseUrl',
        },
        400
      );
    }

    // Validate email format with more robust regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(body.to)) {
      return jsonResponse(
        {
          success: false,
          error: 'Invalid email address',
        },
        400
      );
    }

    // Generate email content from template
    const templateData: WelcomeEmailData = {
      name: body.name,
      email: body.to,
      role: body.role,
      baseUrl: body.baseUrl,
      additionalInfo: body.additionalInfo,
    };

    const subject = getWelcomeSubject();
    const html = generateWelcomeEmailHtml(templateData);
    const text = `Welcome to SkillPassport!\n\nHello ${body.name},\n\nYour account has been created successfully and is ready to use!\n\nEmail: ${body.to}\nRole: ${body.role}\n\nLogin now: ${body.baseUrl}/login\n\nIf you have any questions, please don't hesitate to contact our support team.`;

    // Send email via email-worker
    const result = await sendEmail(env, {
      to: body.to,
      subject,
      html,
      text,
    });

    if (!result.success) {
      apiLogger.error('Failed to send welcome email', new Error(result.error));
      return jsonResponse(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        500
      );
    }

    apiLogger.info('Welcome email sent successfully', { to: body.to });

    return jsonResponse({
      success: true,
      message: 'Welcome email sent successfully',
      messageId: result.messageId,
    });
  } catch (error) {
    apiLogger.error('Error in handleWelcomeEmail', error as Error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    );
  }
}
