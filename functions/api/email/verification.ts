/**
 * Email Verification Template Handler
 * POST /api/email/verification
 * 
 * Returns email verification template for SSO worker to send
 */

import type { PagesFunction } from '../../lib/types';
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
    try {
        const body = await context.request.json() as VerificationRequest;
        const { to, verifyUrl, templateOnly } = body;

        if (!to || !verifyUrl) {
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

        const template = {
            subject: getEmailVerificationSubject(),
            html: generateEmailVerificationHtml(templateData),
            text: generateEmailVerificationText(templateData),
        };

        // If templateOnly flag is set, just return the template
        // Otherwise, send the email (future enhancement)
        if (templateOnly) {
            return new Response(JSON.stringify(template), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // For now, always return template
        // In future, could integrate with email service here
        return new Response(JSON.stringify(template), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('[Email Verification] Error:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to generate verification email',
                details: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
