/**
 * Welcome Email Handler
 * Sends welcome emails using the template
 */

import type { Env } from '../../../lib/types';
import { jsonResponse } from '../../../lib/response';
import { sendEmail } from '../../../lib/email-service';
import {
  generateWelcomeEmailHtml,
  generateWelcomeEmailText,
  getWelcomeSubject,
  type WelcomeEmailData,
} from '../services/templates';
import { apiLogger } from '../../../lib/logger';
import { z } from 'zod';

const welcomeEmailSchema = z.object({
  to: z.string({ message: 'Email address is required' })
    .trim()
    .min(1, 'Email address is required')
    .email('Invalid email address'),
  name: z.string({ message: 'Name is required' })
    .trim()
    .min(1, 'Name is required'),
  role: z.string({ message: 'Role is required' })
    .trim()
    .min(1, 'Role is required'),
  baseUrl: z.string({ message: 'Base URL is required' })
    .trim()
    .min(1, 'Base URL is required'),
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
    const text = generateWelcomeEmailText(templateData);

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
