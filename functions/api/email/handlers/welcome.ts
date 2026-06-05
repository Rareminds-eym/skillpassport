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
import { z } from 'zod';

const welcomeEmailSchema = z.object({
  to: z.string({ message: 'Missing required fields: to, name, role, baseUrl' })
    .trim()
    .min(1, 'Missing required fields: to, name, role, baseUrl')
    .email('Invalid email address'),
  name: z.string({ message: 'Missing required fields: to, name, role, baseUrl' })
    .trim()
    .min(1, 'Missing required fields: to, name, role, baseUrl'),
  role: z.string({ message: 'Missing required fields: to, name, role, baseUrl' })
    .trim()
    .min(1, 'Missing required fields: to, name, role, baseUrl'),
  baseUrl: z.string({ message: 'Missing required fields: to, name, role, baseUrl' })
    .trim()
    .min(1, 'Missing required fields: to, name, role, baseUrl'),
  additionalInfo: z.string().trim().optional(),
});

type WelcomeEmailRequest = z.infer<typeof welcomeEmailSchema>;

export async function handleWelcomeEmail(
  requestBody: unknown,
  env: Env
): Promise<Response> {
  try {
    const result = welcomeEmailSchema.safeParse(requestBody);
    if (!result.success) {
      return jsonResponse(
        {
          success: false,
          error: result.error.issues[0].message,
        },
        400
      );
    }
    const body = result.data;

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
    const emailResult = await sendEmail(env, {
      to: body.to,
      subject,
      html,
      text,
    });

    if (!emailResult.success) {
      apiLogger.error('Failed to send welcome email', new Error(emailResult.error));
      return jsonResponse(
        {
          success: false,
          error: emailResult.error || 'Failed to send email',
        },
        500
      );
    }

    apiLogger.info('Welcome email sent successfully', { to: body.to });

    return jsonResponse({
      success: true,
      message: 'Welcome email sent successfully',
      messageId: emailResult.messageId,
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
