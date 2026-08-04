/**
 * Resend Invitation Endpoint
 * POST /api/recruitment/invitations/{id}/resend
 */

import { withAuth } from '../../../../lib/auth';
import { getServiceClient } from '../../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * POST /api/recruitment/invitations/{id}/resend
 * Resend a pending invitation email
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    // Extract invitation ID from URL params
    const invitationId = context.params.id as string;

    if (!invitationId) {
        return Response.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    try {
        // Get invitation to verify ownership and status
        const { data: invitation, error: fetchError } = await supabase
            .from('organization_invitations')
            .select('*')
            .eq('id', invitationId)
            .single();

        if (fetchError || !invitation) {
            console.error('Invitation not found:', fetchError);
            return Response.json({ error: 'Invitation not found' }, { status: 404 });
        }

        // Verify user has access to this organization
        const access = await verifyOrgAccess(
            supabase,
            user.sub,
            invitation.organization_id,
            PERMISSIONS.MANAGE_TEAM
        );
        if (!access.allowed) {
            return access.error!;
        }

        // Check if invitation can be resent
        if (invitation.status !== 'pending') {
            return Response.json(
                { error: `Cannot resend invitation with status: ${invitation.status}` },
                { status: 400 }
            );
        }

        // Generate new token and extend expiration
        const newToken = crypto.randomUUID();
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days from now

        // Update invitation with new token and expiration
        const { error: updateError } = await supabase
            .from('organization_invitations')
            .update({
                invitation_token: newToken,
                expires_at: newExpiresAt.toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', invitationId);

        if (updateError) {
            console.error('Error updating invitation:', updateError);
            return Response.json({ error: updateError.message }, { status: 500 });
        }

        // Send invitation email
        const baseUrl = new URL(context.request.url).origin;
        const invitationUrl = `${baseUrl}/invite/accept?token=${newToken}`;

        try {
            const { sendRecruitmentInvitationEmail } = await import('../../../../lib/emailService');

            // Get inviter's name
            const inviterName = user.name || user.email || 'A team member';

            // Get organization name
            const { data: orgData } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', invitation.organization_id)
                .single();

            const organizationName = orgData?.name || 'the organization';

            await sendRecruitmentInvitationEmail(
                {
                    email: invitation.invitee_email,
                    inviterName,
                    organizationName,
                    role: invitation.invitee_role,
                    invitationUrl,
                },
                env as any
            );

            console.log('[resend-invitation] Email sent successfully', {
                email: invitation.invitee_email,
                invitationId
            });
        } catch (emailError: any) {
            console.error('[resend-invitation] Failed to send email:', emailError);
            // Don't fail the request if email fails, invitation is still updated
        }

        return Response.json({
            data: {
                success: true,
                message: 'Invitation resent successfully',
                invitationUrl,
            }
        });
    } catch (error: any) {
        console.error('Error resending invitation:', error);
        return Response.json(
            { error: 'Failed to resend invitation', details: error.message },
            { status: 500 }
        );
    }
});
