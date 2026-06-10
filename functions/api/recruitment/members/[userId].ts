import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

const getMemberData = async (supabase: any, userId: string, orgId: string) => {
    const { data: acceptedInvitations, error: invError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'accepted')
        .eq('accepted_by_user_id', userId)
        .maybeSingle();

    if (invError) return null;

    if (acceptedInvitations) {
        const { data: userData } = await supabase
            .from('users')
            .select('id, email, firstName, lastName, role')
            .eq('id', userId)
            .maybeSingle();

        const fullName = userData ? [userData.firstName, userData.lastName].filter(Boolean).join(' ') : acceptedInvitations.invitee_name || '';

        return {
            id: acceptedInvitations.id,
            userId: acceptedInvitations.accepted_by_user_id,
            organizationId: acceptedInvitations.organization_id,
            name: fullName,
            email: userData?.email || acceptedInvitations.invitee_email,
            ssoRoleName: 'member',
            recruitmentRole: acceptedInvitations.invitee_role,
            membershipStatus: 'active',
            isActive: true,
            invitedBy: acceptedInvitations.invited_by,
            invitedAt: acceptedInvitations.created_at,
            joinedAt: acceptedInvitations.accepted_at,
            createdAt: acceptedInvitations.accepted_at || acceptedInvitations.created_at,
            updatedAt: acceptedInvitations.updated_at || acceptedInvitations.accepted_at || acceptedInvitations.created_at,
        };
    }

    const { data: directMember, error: directError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .maybeSingle();

    if (directError || !directMember) return null;

    const { data: userData } = await supabase
        .from('users')
        .select('id, email, firstName, lastName, role')
        .eq('id', userId)
        .maybeSingle();

    const { data: roleMapping } = await supabase
        .from('recruitment_role_mapping')
        .select('sso_role_name, recruitment_role');

    const roleMap = new Map<string, string>((roleMapping || []).map((r: any) => [r.sso_role_name, r.recruitment_role]));

    const fullName = userData ? [userData.firstName, userData.lastName].filter(Boolean).join(' ') : '';

    return {
        id: directMember.id,
        userId: directMember.user_id,
        organizationId: directMember.organization_id,
        name: fullName,
        email: userData?.email || '',
        ssoRoleName: directMember.role,
        recruitmentRole: roleMap.get(directMember.role) || null,
        membershipStatus: directMember.status,
        isActive: directMember.status === 'active',
        invitedBy: null,
        invitedAt: null,
        joinedAt: directMember.created_at,
        createdAt: directMember.created_at,
        updatedAt: directMember.updated_at,
    };
};

/**
 * GET /api/recruitment/members/{userId}
 * Get a single member by user ID
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);
    const targetUserId = context.params.userId as string;

    if (!targetUserId) {
        return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id') || user.org_id;

    if (!orgId) {
        return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const access = await verifyOrgAccess(supabase, user.sub, orgId, undefined);
    if (!access.allowed) return access.error!;

    try {
        const member = await getMemberData(supabase, targetUserId, orgId);
        if (!member) {
            return Response.json({ error: 'Member not found' }, { status: 404 });
        }

        return Response.json(member);
    } catch (error: any) {
        console.error('Error fetching member:', error);
        return Response.json(
            { error: 'Failed to fetch member', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * DELETE /api/recruitment/members/{userId}
 * Remove a member from the organization
 */
export const onRequestDelete = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);
    const targetUserId = context.params.userId as string;

    if (!targetUserId) {
        return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id') || user.org_id;

    if (!orgId) {
        return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_TEAM);
    if (!access.allowed) return access.error!;

    if (targetUserId === user.sub) {
        return Response.json({ error: 'Cannot remove yourself from the organization' }, { status: 400 });
    }

    try {
        const { error: omError } = await supabase
            .from('organization_members')
            .delete()
            .eq('organization_id', orgId)
            .eq('user_id', targetUserId);

        if (omError) {
            console.error('Error removing from organization_members:', omError);
        }

        const { error: invError } = await supabase
            .from('organization_invitations')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancelled_by: user.sub,
                updated_at: new Date().toISOString(),
            })
            .eq('organization_id', orgId)
            .eq('accepted_by_user_id', targetUserId)
            .eq('status', 'accepted');

        if (invError) {
            console.error('Error cancelling invitation:', invError);
        }

        return Response.json({ success: true, message: 'Member removed successfully' });
    } catch (error: any) {
        console.error('Error removing member:', error);
        return Response.json(
            { error: 'Failed to remove member', details: error.message },
            { status: 500 }
        );
    }
});
