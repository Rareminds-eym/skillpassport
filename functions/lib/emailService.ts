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

    // Extract first name only
    const inviterFirstName = inviterName.split(' ')[0] || inviterName;

    const roleDisplayNames: Record<string, string> = {
        company_admin: 'Admin',
        recruiter: 'Recruiter',
        viewer: 'Viewer',
    };

    const roleDisplay = roleDisplayNames[role] || role;
    const currentYear = new Date().getFullYear();

    // Get base URL for logo (using cid for embedded image instead)
    const baseUrl = invitationUrl.split('/invite/')[0] || invitationUrl.split('/accept-invitation')[0];
    const logoUrl = `${baseUrl}/RareMinds%20ISO%20Logo-01.png`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've been invited to join ${organizationName} on SkillPassport</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Logo Header -->
                    <tr>
                        <td style="padding: 32px 40px 24px; text-align: center; background-color: #ffffff; border-radius: 12px 12px 0 0;">
                            <img src="${logoUrl}" alt="SkillPassport Logo" style="max-width: 180px; height: auto;" />
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <!-- Main Message -->
                            <p style="margin: 0 0 24px; color: #111827; font-size: 18px; line-height: 1.6; font-weight: 500;">
                                <strong>${inviterFirstName}</strong> has invited you to join <strong>${organizationName}</strong> as <strong>${roleDisplay}</strong>
                            </p>
                            
                            <!-- Context -->
                            <p style="margin: 0 0 32px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                                Click the button below to set up your account — it takes less than a minute.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 0 0 24px;">
                                        <a href="${invitationUrl}" style="display: inline-block; padding: 16px 48px; background-color: #278FD3; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(39, 143, 211, 0.2);">
                                            Accept invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Expiry Notice -->
                            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">
                                This link expires in 7 days. If you weren't expecting this, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; line-height: 1.5;">
                                Sent by <strong>${inviterName}</strong> from <strong>${organizationName}</strong>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                © ${currentYear} SkillPassport. All rights reserved.
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
${inviterFirstName} has invited you to join ${organizationName} as ${roleDisplay}

Click the button below to set up your account — it takes less than a minute.

Accept your invitation: ${invitationUrl}

This link expires in 7 days. If you weren't expecting this, you can safely ignore this email.

Sent by ${inviterName} from ${organizationName}
© ${currentYear} SkillPassport. All rights reserved.
    `.trim();

    return sendEmail(
        {
            to: email,
            subject: `You've been invited to join ${organizationName} on SkillPassport`,
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

/**
 * Send an email notification to admin when a recruiter accepts their invitation
 */
export async function sendInvitationAcceptedEmail(
    params: {
        adminEmail: string;
        adminName: string;
        recruiterName: string;
        organizationName: string;
        role: string;
    },
    env: { EMAIL_SERVICE?: { sendEmail: Function } }
): Promise<SendEmailResponse> {
    const { adminEmail, adminName, recruiterName, organizationName, role } = params;

    const roleDisplayNames: Record<string, string> = {
        company_admin: 'Admin',
        recruiter: 'Recruiter',
        viewer: 'Viewer',
    };

    const roleDisplay = roleDisplayNames[role] || role;
    const currentYear = new Date().getFullYear();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${recruiterName} has accepted your invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 40px 24px;">
                            <h1 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700; line-height: 1.3;">
                                Great news!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <!-- Main Message -->
                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                <strong style="color: #111827;">${recruiterName}</strong> has accepted your invitation and joined <strong style="color: #111827;">${organizationName}</strong> as <strong style="color: #278FD3;">${roleDisplay}</strong>.
                            </p>
                            
                            <p style="margin: 0 0 32px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                They now have access to your organization's recruitment dashboard and can start collaborating with your team.
                            </p>
                            
                            <!-- Success Indicator -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 16px; background-color: #d1fae5; border-left: 4px solid #10b981; border-radius: 6px;">
                                        <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.5;">
                                            <strong>✓ Invitation accepted</strong><br>
                                            ${recruiterName} is now an active member of your team.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; line-height: 1.5;">
                                This is an automated notification from SkillPassport
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                © ${currentYear} SkillPassport. All rights reserved.
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
Great news!

${recruiterName} has accepted your invitation and joined ${organizationName} as ${roleDisplay}.

They now have access to your organization's recruitment dashboard and can start collaborating with your team.

✓ Invitation accepted
${recruiterName} is now an active member of your team.

This is an automated notification from SkillPassport
© ${currentYear} SkillPassport. All rights reserved.
    `.trim();

    return sendEmail(
        {
            to: adminEmail,
            subject: `${recruiterName} has accepted your invitation`,
            html,
            text,
            metadata: {
                type: 'invitation_accepted_notification',
                organizationName,
                recruiterName,
                role,
            },
        },
        env
    );
}
