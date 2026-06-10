/**
 * Cancel Invitation Endpoint
 * PUT /api/recruitment/invitations/{id}/cancel
 */

import { withAuth } from '../../../../lib/auth';
import { getServiceClient } from '../../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * PUT /api/recruitment/invitations/{id}/cancel
 * Cancel a pending invitation
 */
export const onRequestPut = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    // Extract invitation ID from URL params
    const invitationId = context.params.id as string;

    if (!invitationId) {
        return Response.json({ error: 'Invitation ID is required' }, { status: 400 });
    }

    try {
        // Get invitation to verify ownership
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

        // Check if invitation can be cancelled
        if (invitation.status !== 'pending') {
            return Response.json(
                { error: `Cannot cancel invitation with status: ${invitation.status}` },
                { status: 400 }
            );
        }

        // Cancel invitation
        const { error: updateError } = await supabase
            .from('organization_invitations')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancelled_by: user.sub,
                updated_at: new Date().toISOString(),
            })
            .eq('id', invitationId);

        if (updateError) {
            console.error('Error cancelling invitation:', updateError);
            return Response.json({ error: updateError.message }, { status: 500 });
        }

        return Response.json({
            data: {
                success: true,
                message: 'Invitation cancelled successfully',
            }
        });
    } catch (error: any) {
        console.error('Error cancelling invitation:', error);
        return Response.json(
            { error: 'Failed to cancel invitation', details: error.message },
            { status: 500 }
        );
    }
});
