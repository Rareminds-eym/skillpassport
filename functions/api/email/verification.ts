/**
 * Email Verification Template Handler
 * POST /api/email/verification
 * 
 * Returns email verification template for SSO worker to send
 */

import type { PagesFunction } from '../../lib/types';
import { createLogger } from '../../lib/logger';
import {
    generateEmailVerificationHtml,
    generateEmailVerificationText,
    getEmailVerificationSubject,
    type EmailVerificationData,
} from './services/templates';

interface VerificationRequest {
    to: string;
    verifyUrl: string;
    templateOnly?: boolean;
}

export const onRequestPost: PagesFunction = async (context) => {
    // Create structured logger
    const logger = createLogger('email-verification', context.env.ENVIRONMENT || 'production');

    // Generate request ID for tracing
    const requestId = context.request.headers.get('X-Request-ID') || crypto.randomUUID();

    try {
        logger.info('verification_template_request', {
            requestId,
            path: new URL(context.request.url).pathname,
        });

        const body = await context.request.json() as VerificationRequest;
        const { to, verifyUrl, templateOnly } = body;

        logger.info('template_generation_started', {
            requestId,
            to,
            hasVerifyUrl: !!verifyUrl,
            templateOnly: !!templateOnly,
        });

        if (!to || !verifyUrl) {
            logger.warn('validation_failed_missing_fields', {
                requestId,
                hasTo: !!to,
                hasVerifyUrl: !!verifyUrl,
            });

            return new Response(
                JSON.stringify({ error: 'Missing required fields: to, verifyUrl' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const templateData: EmailVerificationData = {
            verifyUrl,
        };

        const startTime = Date.now();
        const template = {
            subject: getEmailVerificationSubject(),
            html: generateEmailVerificationHtml(templateData),
            text: generateEmailVerificationText(templateData),
        };
        const duration = Date.now() - startTime;

        logger.info('template_generated_successfully', {
            requestId,
            to,
            templateOnly: !!templateOnly,
            htmlLength: template.html.length,
            textLength: template.text.length,
            duration,
        });

        // If templateOnly flag is set, just return the template
        // Otherwise, send the email (future enhancement)
        if (templateOnly) {
            return new Response(JSON.stringify(template), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                },
            });
        }

        // For now, always return template
        // In future, could integrate with email service here
        return new Response(JSON.stringify(template), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
            },
        });
    } catch (error) {
        logger.error('template_generation_failed', error, {
            requestId,
        });

        // Generic message to client (no internal details exposed)
        return new Response(
            JSON.stringify({
                error: 'Failed to generate verification email. Please try again later.',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                },
            }
        );
    }
};
