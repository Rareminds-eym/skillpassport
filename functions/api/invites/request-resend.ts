/**
 * Request Resend Invitation
 * POST /api/invites/request-resend?token=xxx
 * 
 * Sends email to admin notifying them that the invitee needs a new invitation
 */

import { getServiceClient } from '../../lib/supabase';

export async function onRequestPost(context: any): Promise<Response> {
    console.log('=== REQUEST RESEND INVITATION API CALLED ===');

    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    // Get token from query params
    const url = new URL(context.request.url);
    const token = url.searchParams.get('token');

    if (!token) {
        return Response.json({ error: 'Token is required' }, { status: 400 });
    }

    try {
        // Get invitation details
        console.log('[request-resend] Looking up invitation');
        const { data: invitation, error: inviteError } = await supabase
            .from('organization_invitations')
            .select(`
                *,
                organization:organizations(id, name),
                inviter:invited_by(id, email, first_name, last_name)
            `)
            .eq('invitation_token', token)
            .single();

        if (inviteError || !invitation) {
            console.error('[request-resend] Invitation not found:', inviteError);
            return Response.json({ error: 'Invitation not found' }, { status: 404 });
        }

        console.log('[request-resend] ✓ Invitation found:', invitation.id);

        // Get organization and inviter data
        const orgData = Array.isArray(invitation.organization)
            ? invitation.organization[0]
            : invitation.organization;

        const inviterData = Array.isArray(invitation.inviter)
            ? invitation.inviter[0]
            : invitation.inviter;

        const adminEmail = inviterData?.email || invitation.invited_by;
        const adminName = inviterData?.first_name && inviterData?.last_name
            ? `${inviterData.first_name} ${inviterData.last_name}`
            : 'Admin';
        const organizationName = orgData?.name || 'your organization';

        // Send notification email to admin
        console.log('[request-resend] Sending notification to admin:', adminEmail);

        try {
            const { sendEmail } = await import('../../lib/emailService');

            const roleDisplayNames: Record<string, string> = {
                company_admin: 'Recruiter Admin',
                recruiter: 'Recruiter',
                viewer: 'Viewer',
            };
            const roleDisplay = roleDisplayNames[invitation.invitee_role] || invitation.invitee_role;

            const currentYear = new Date().getFullYear();

            const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation Resend Request</title>
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
                                Invitation Resend Requested
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Hi ${adminName},
                            </p>
                            
                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                <strong style="color: #111827;">${invitation.invitee_email}</strong> has requested a new invitation to join <strong style="color: #111827;">${organizationName}</strong> as <strong style="color: #278FD3;">${roleDisplay}</strong>.
                            </p>
                            
                            <p style="margin: 0 0 32px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Their previous invitation may have expired or been lost. You can resend the invitation from your recruitment dashboard.
                            </p>
                            
                            <!-- Info Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                                            <strong>Action needed:</strong> Please resend the invitation from your admin dashboard to help them join your team.
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
Hi ${adminName},

${invitation.invitee_email} has requested a new invitation to join ${organizationName} as ${roleDisplay}.

Their previous invitation may have expired or been lost. You can resend the invitation from your recruitment dashboard.

Action needed: Please resend the invitation from your admin dashboard to help them join your team.

This is an automated notification from SkillPassport
© ${currentYear} SkillPassport. All rights reserved.
            `.trim();

            await sendEmail(
                {
                    to: adminEmail,
                    subject: `${invitation.invitee_email} needs a new invitation`,
                    html,
                    text,
                    metadata: {
                        type: 'resend_request',
                        invitationId: invitation.id,
                        organizationName,
                    },
                },
                env as any
            );

            console.log('[request-resend] ✓ Notification email sent to admin');

            return Response.json({
                success: true,
                message: 'Your request has been sent to the organization admin. They will resend your invitation shortly.',
            });

        } catch (emailError: any) {
            console.error('[request-resend] Failed to send notification email:', emailError);
            return Response.json({
                error: 'Failed to send notification email',
                details: emailError.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('=== REQUEST RESEND INVITATION API ERROR ===');
        console.error('[request-resend] Unexpected error:', error);
        return Response.json(
            { error: 'Failed to process resend request', details: error.message },
            { status: 500 }
        );
    }
}
