/**
 * Email Service
 * Sends emails via the shared email-worker
 */

interface SendEmailRequest {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    fromName?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
    metadata?: Record<string, any>;
}

interface SendEmailResponse {
    success: boolean;
    messageId?: string;
    customMessageId?: string;
    recipient?: string[];
    timestamp?: string;
    error?: string;
    errorCode?: string;
}

/**
 * Send an email via the email-worker service binding
 */
export async function sendEmail(
    request: SendEmailRequest,
    env: { EMAIL_SERVICE?: { sendEmail: Function } }
): Promise<SendEmailResponse> {
    const emailService = env.EMAIL_SERVICE;
    if (!emailService) {
        throw new Error('EMAIL_SERVICE binding is not configured');
    }

    try {
        const result = await emailService.sendEmail(request) as SendEmailResponse;

        if (!result.success) {
            throw new Error(result.error || 'Failed to send email');
        }

        return result;
    } catch (error: any) {
        console.error('[emailService] Error sending email:', error);
        throw error;
    }
}

/**
 * Send a recruitment invitation email
 */
export async function sendRecruitmentInvitationEmail(
    params: {
        email: string;
        inviterName: string;
        organizationName: string;
        role: string;
        invitationUrl: string;
    },
    env: { EMAIL_SERVICE?: { sendEmail: Function } }
): Promise<SendEmailResponse> {
    const { email, inviterName, organizationName, role, invitationUrl } = params;

    const roleDisplayNames: Record<string, string> = {
        company_admin: 'Admin',
        recruiter: 'Recruiter',
        viewer: 'Viewer',
    };

    const roleDisplay = roleDisplayNames[role] || role;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recruitment Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                                You're Invited!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Hi there,
                            </p>
                            
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                <strong>${inviterName}</strong> has invited you to join the recruitment team at <strong>${organizationName}</strong> as a <strong>${roleDisplay}</strong>.
                            </p>
                            
                            <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Click the button below to accept the invitation and get started:
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px;">
                                        <a href="${invitationUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Or copy and paste this link into your browser:
                            </p>
                            
                            <p style="margin: 0 0 30px; color: #3b82f6; font-size: 14px; line-height: 1.6; word-break: break-all;">
                                ${invitationUrl}
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                            
                            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                © ${new Date().getFullYear()} SkillPassport. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    const text = `
You're Invited!

Hi there,

${inviterName} has invited you to join the recruitment team at ${organizationName} as a ${roleDisplay}.

Accept your invitation by visiting this link:
${invitationUrl}

This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} SkillPassport. All rights reserved.
    `.trim();

    return sendEmail(
        {
            to: email,
            subject: `Invitation to join ${organizationName}'s recruitment team`,
            html,
            text,
            metadata: {
                type: 'recruitment_invitation',
                organizationName,
                role,
            },
        },
        env
    );
}
