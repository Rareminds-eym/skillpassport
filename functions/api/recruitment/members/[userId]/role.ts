import { withAuth } from '../../../../lib/auth';
import { getServiceClient } from '../../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

const RECRUITMENT_TO_SSO_ROLE: Record<string, string> = {
    company_admin: 'admin',
    recruiter: 'member',
    viewer: 'member',
};

const VALID_RECRUITMENT_ROLES = ['company_admin', 'recruiter', 'viewer'];

/**
 * PUT /api/recruitment/members/{userId}/role
 * Update a member's recruitment role
 */
export const onRequestPut = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);
    const targetUserId = context.params.userId as string;

    if (!targetUserId) {
        return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    let body: { role?: string };
    try {
        body = await context.request.json() as any;
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body.role || !VALID_RECRUITMENT_ROLES.includes(body.role)) {
        return Response.json({
            error: `Valid role is required: ${VALID_RECRUITMENT_ROLES.join(', ')}`,
        }, { status: 400 });
    }

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id') || user.org_id;

    if (!orgId) {
        return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_TEAM);
    if (!access.allowed) return access.error!;

    try {
        const ssoRole = RECRUITMENT_TO_SSO_ROLE[body.role] || 'member';

        const { error: omError } = await supabase
            .from('organization_members')
            .update({ role: ssoRole, updated_at: new Date().toISOString() })
            .eq('organization_id', orgId)
            .eq('user_id', targetUserId);

        if (omError) {
            console.error('[update-role] Failed to update organization_members:', omError);
        }

        const { error: invError } = await supabase
            .from('organization_invitations')
            .update({ invitee_role: body.role, updated_at: new Date().toISOString() })
            .eq('organization_id', orgId)
            .eq('accepted_by_user_id', targetUserId)
            .eq('status', 'accepted');

        if (invError) {
            console.error('[update-role] Failed to update invitation:', invError);
        }

        if (!omError && !invError) {
            console.warn('[update-role] Member not found in either table, update may have no effect');
        }

        return Response.json({ success: true, message: 'Member role updated successfully' });
    } catch (error: any) {
        console.error('Error updating member role:', error);
        return Response.json(
            { error: 'Failed to update member role', details: error.message },
            { status: 500 }
        );
    }
});
